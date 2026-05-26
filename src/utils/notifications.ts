import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const STREAK_REMINDER_ID = "streak-reminder";

// Push notifications (remote) were removed from Expo Go in SDK 53.
// Local scheduled notifications still work; we guard the handler setup
// to suppress the spurious error log when running in Expo Go.
const isExpoGo = Constants.executionEnvironment === "storeClient";

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (isExpoGo) return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("streak-reminders", {
      name: "Streak Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleStreakReminder(
  streak: number,
  hour: number,
  minute = 0,
  challengeTitle?: string,
): Promise<void> {
  await cancelStreakReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_REMINDER_ID,
    content: {
      title: "Challenge Reminder",
      body: challengeTitle
        ? `Ready for your next challenge: ${challengeTitle}? Complete it today!`
        : "Complete a challenge today to keep learning!",
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

type NotificationSubscription = { remove: () => void };

export function addNotificationUrlListener(
  onUrl: (url: string) => void,
): NotificationSubscription {
  if (isExpoGo) {
    return { remove: () => {} };
  }

  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === "string") onUrl(url);
    },
  );

  return subscription;
}
