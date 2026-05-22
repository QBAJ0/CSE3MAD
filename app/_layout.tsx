import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
// Import at top level so TaskManager.defineTask runs before any registration attempt
import { registerStreakReminderTask } from "../src/tasks/streakReminderTask";

export default function RootLayout() {
  useEffect(() => {
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
    void processPendingChallengeCloudSync();
    void processPendingMediaUploads();

    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void processPendingChallengeCloudSync();
        void processPendingMediaUploads();
      }
    });

    return () => appStateSub.remove();
  }, []);

  useEffect(() => {
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
              <Stack.Screen name="activity" options={{ headerShown: false }} />
              <Stack.Screen
                name="challenge/[id]/index"
                options={{
                  headerShown: true,
                  title: "Challenge",
                  headerBackTitle: "Back",
                }}
              />
              <Stack.Screen
                name="challenge/[id]/record"
                options={{
                  headerShown: true,
                  title: "Record Data",
                  headerBackTitle: "Back",
                }}
              />
              <Stack.Screen
                name="challenge/[id]/results"
                options={{
                  headerShown: true,
                  title: "Review & Submit",
                  headerBackTitle: "Back",
                }}
              />
            </Stack>
          </ActivityProvider>
        </TeamProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
