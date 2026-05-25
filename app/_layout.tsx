import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ensureFirebaseAuth } from "../src/services/authSession";
import { processPendingChallengeCloudSync } from "../src/services/challengeCloudSync";
import { processPendingMediaUploads } from "../src/services/mediaUploadQueue";
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

export default function RootLayout() {
  useEffect(() => {
    if (!isNative) return;

    const setup = async () => {
      await Promise.all([
        requestNotificationPermissions(),
        registerStreakReminderTask(),
        initializeMobileAds(),
      ]);
    };
    setup().catch(console.error);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await ensureFirebaseAuth();
      } catch {
        // Offline or Firebase unavailable; pending queue retries later.
      }
      void processPendingChallengeCloudSync();
      void processPendingMediaUploads();
    })();

    if (!isNative) return;

    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void processPendingChallengeCloudSync();
        void processPendingMediaUploads();
      }
    });

    return () => appStateSub.remove();
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
