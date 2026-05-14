import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const STREAK_REMINDER_ID = "streak-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("streak-reminders", {
      name: "Streak Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleStreakReminder(streak: number, hour: number, minute = 0): Promise<void> {
  await cancelStreakReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_REMINDER_ID,
    content: {
      title: "Don't break your streak! 🔥",
      body: `You're on a ${streak}-day streak. Complete a challenge today to keep it alive!`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelStreakReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID);
  } catch {
    // notification may not exist yet — that's fine
  }
}
