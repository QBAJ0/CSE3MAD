import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "../src/components/ui/ErrorBoundary";
import { ActivityProvider } from "../src/context/ActivityContext";
import { TeamProvider } from "../src/context/TeamContext";
import { initializeAdMob } from "../src/utils/adMob";
import { requestNotificationPermissions } from "../src/utils/notifications";
// Import at top level so TaskManager.defineTask runs before any registration attempt
import { registerStreakReminderTask } from "../src/tasks/streakReminderTask";

export default function RootLayout() {
  useEffect(() => {
    const setup = async () => {
      await requestNotificationPermissions();
      await registerStreakReminderTask();
      await initializeAdMob();
    };
    setup().catch(console.error);
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
              <Stack.Screen name="challenge" options={{ headerShown: false }} />
            </Stack>
          </ActivityProvider>
        </TeamProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
