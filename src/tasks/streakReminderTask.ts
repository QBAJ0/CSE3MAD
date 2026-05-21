import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import {
  getNextDailyChallenge,
  getTeamActivities,
  hasCompletedActivityToday,
} from "../utils/dailyChallenge";
import {
  cancelChallengeNotifications,
  scheduleStreakReminderNotification,
} from "../utils/notifications";
import { storage } from "../utils/storage";

export const STREAK_REMINDER_TASK = "streak-reminder-background";

// Must be defined at module load time (top level), not inside a component.
TaskManager.defineTask(STREAK_REMINDER_TASK, async () => {
  try {
    const [activities, streak, team, hour, minute] = await Promise.all([
      storage.getCompletedActivities(),
      storage.getStreak(),
      storage.getTeam(),
      storage.getReminderHour(),
      storage.getReminderMinute(),
    ]);

    const teamActivities = getTeamActivities(activities, team);
    const completedToday = hasCompletedActivityToday(teamActivities);
    const nextChallenge = getNextDailyChallenge(teamActivities);

    if (streak > 0 && !completedToday) {
      await scheduleStreakReminderNotification({
        streak,
        hour,
        minute,
        challenge: nextChallenge,
      });
    } else {
      await cancelChallengeNotifications();
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerStreakReminderTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(STREAK_REMINDER_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(STREAK_REMINDER_TASK, {
      minimumInterval: 60 * 60, // 1 hour — OS may run less frequently on iOS
      stopOnTerminate: false,   // keep running after app is closed
      startOnBoot: true,        // restart after device reboot
    });
  }
}
