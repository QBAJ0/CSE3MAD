import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { cancelStreakReminder, scheduleStreakReminder } from "../utils/notifications";
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

    const today = new Date().toDateString();
    const teamActivities = team
      ? activities.filter((a) => a.teamId === team.discriminator)
      : activities;
    const completedToday = teamActivities.some(
      (a) => new Date(a.createdAt).toDateString() === today,
    );

    if (streak > 0 && !completedToday) {
      await scheduleStreakReminder(streak, hour, minute);
    } else {
      await cancelStreakReminder();
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
