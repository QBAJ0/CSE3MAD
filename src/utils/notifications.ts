import Constants from "expo-constants";
import { Platform } from "react-native";
import { Challenge } from "../types";

type NotificationsModule = typeof import("expo-notifications");
type NotificationSubscription = { remove: () => void };

const STREAK_REMINDER_NOTIFICATION_ID = "streak-reminder";
const DAILY_CHALLENGE_NOTIFICATION_ID = "daily-challenge-reminder";
const NOTIFICATION_CHANNEL_ID = "streak-reminders";

const isExpoGo = Constants.appOwnership === "expo";
let handlerConfigured = false;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (isExpoGo) return null;

  const Notifications = await import("expo-notifications");

  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }

  return Notifications;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: "Streak Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

type DailyChallengeNotificationOptions = {
  challenge: Challenge;
  hour: number;
  minute?: number;
  streak?: number;
  completedToday?: boolean;
};

type StreakReminderNotificationOptions = {
  streak: number;
  hour: number;
  minute?: number;
  challenge?: Challenge;
};

export async function scheduleDailyChallengeNotification({
  challenge,
  hour,
  minute = 0,
  streak = 0,
  completedToday = false,
}: DailyChallengeNotificationOptions): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  await cancelDailyChallengeNotification();

  const isStreakAtRisk = streak > 0 && !completedToday;

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_CHALLENGE_NOTIFICATION_ID,
    content: {
      title: isStreakAtRisk
        ? "Don't break your streak!"
        : "Today's STEM challenge is ready",
      body: isStreakAtRisk
        ? `You're on a ${streak}-day streak. Try ${challenge.title} today to keep it alive.`
        : `Try ${challenge.title}: ${challenge.shortDescription}`,
      sound: true,
      data: {
        challengeId: challenge.id,
        url: `/challenge/${challenge.id}`,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: NOTIFICATION_CHANNEL_ID,
    },
  });
}

export async function scheduleStreakReminderNotification({
  streak,
  hour,
  minute = 0,
  challenge,
}: StreakReminderNotificationOptions): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  await cancelStreakReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_REMINDER_NOTIFICATION_ID,
    content: {
      title: "Don't break your streak!",
      body: challenge
        ? `You're on a ${streak}-day streak. Try ${challenge.title} today to keep it alive.`
        : `You're on a ${streak}-day streak. Complete a challenge today to keep it alive!`,
      sound: true,
      data: challenge
        ? {
            challengeId: challenge.id,
            url: `/challenge/${challenge.id}`,
          }
        : undefined,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: NOTIFICATION_CHANNEL_ID,
    },
  });
}

export async function cancelDailyChallengeNotification(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(
      DAILY_CHALLENGE_NOTIFICATION_ID,
    );
  } catch {
    // Notification may not exist yet.
  }
}

export async function cancelStreakReminder(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(
      STREAK_REMINDER_NOTIFICATION_ID,
    );
  } catch {
    // Notification may not exist yet.
  }
}

export async function cancelChallengeNotifications(): Promise<void> {
  await Promise.all([
    cancelDailyChallengeNotification(),
    cancelStreakReminder(),
  ]);
}

export async function scheduleStreakReminder(
  streak: number,
  hour: number,
  minute = 0,
): Promise<void> {
  await scheduleStreakReminderNotification({
    streak,
    hour,
    minute,
  });
}

export function addNotificationUrlListener(
  onUrl: (url: string) => void,
): NotificationSubscription {
  if (isExpoGo) {
    return { remove: () => {} };
  }

  let subscription: NotificationSubscription | null = null;
  let active = true;

  import("expo-notifications")
    .then((Notifications) => {
      if (!active) return;
      subscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const url = response.notification.request.content.data?.url;
          if (typeof url === "string") onUrl(url);
        },
      );
    })
    .catch(() => {});

  return {
    remove: () => {
      active = false;
      subscription?.remove();
    },
  };
}
