import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { AppState, InteractionManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "../src/components/ui/ErrorBoundary";
import { ActivityProvider } from "../src/context/ActivityContext";
import { TeamProvider } from "../src/context/TeamContext";
import { initializeMobileAds } from "../src/utils/mobileAds";
import {
  addNotificationUrlListener,
  requestNotificationPermissions,
} from "../src/utils/notifications";
import { registerStreakReminderTask } from "../src/tasks/streakReminderTask";

const isNative = Platform.OS === "ios" || Platform.OS === "android";

/** Defer cloud work until after the splash / first navigation can render. */
const CLOUD_STARTUP_DELAY_MS = 6000;

export default function RootLayout() {
  useEffect(() => {
    if (!isNative) return;

    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        try {
          await requestNotificationPermissions();
        } catch (e) {
          console.warn("[RootLayout] notifications setup:", e);
        }
        try {
          await registerStreakReminderTask();
        } catch (e) {
          console.warn("[RootLayout] background task registration:", e);
        }
        try {
          await initializeMobileAds();
        } catch (e) {
          console.warn("[RootLayout] mobile ads init:", e);
        }
      })();
    });

    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (!isNative) return;

    let cancelled = false;
    let startupTimer: ReturnType<typeof setTimeout> | null = null;
    let appStateSub: ReturnType<typeof AppState.addEventListener> | null = null;

    const runCloudCatchUp = async () => {
      const { isFirebaseConfigured } = await import("../src/firebase");
      if (!isFirebaseConfigured || cancelled) return;

      const { ensureFirebaseAuth } = await import("../src/services/authSession");
      const { processPendingChallengeCloudSync } = await import(
        "../src/services/challengeCloudSync"
      );
      const { processPendingMediaUploads } = await import(
        "../src/services/mediaUploadQueue"
      );

      if (cancelled) return;

      await ensureFirebaseAuth().catch(() => {});
      if (cancelled) return;

      await Promise.allSettled([
        processPendingChallengeCloudSync(),
        processPendingMediaUploads(),
      ]);
    };

    const task = InteractionManager.runAfterInteractions(() => {
      startupTimer = setTimeout(() => {
        void runCloudCatchUp().then(() => {
          if (cancelled) return;
          appStateSub = AppState.addEventListener("change", (nextState) => {
            if (nextState === "active") {
              void runCloudCatchUp();
            }
          });
        });
      }, CLOUD_STARTUP_DELAY_MS);
    });

    return () => {
      cancelled = true;
      task.cancel();
      if (startupTimer) clearTimeout(startupTimer);
      appStateSub?.remove();
    };
  }, []);

  useEffect(() => {
    if (!isNative) return;

    const subscription = addNotificationUrlListener((url) => {
      if (url.startsWith("/challenge/")) {
        router.push(url as any);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TeamProvider>
          <ActivityProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="challenge" options={{ headerShown: false }} />
            </Stack>
          </ActivityProvider>
        </TeamProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
