import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTeam } from "../context/TeamContext";
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

type StreakReminder = {
  showReminder: boolean;
  streak: number;
  completedToday: boolean;
  loading: boolean;
};

export function useStreakReminder(): StreakReminder {
  const { team } = useTeam();
  const [reminder, setReminder] = useState<StreakReminder>({
    showReminder: false,
    streak: 0,
    completedToday: false,
    loading: true,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const check = async () => {
        try {
          const [activities, streak] = await Promise.all([
            storage.getCompletedActivities(),
            storage.getStreak(),
          ]);

          if (!active) return;

          const teamActivities = getTeamActivities(activities, team);
          const completedToday = hasCompletedActivityToday(teamActivities);
          const nextChallenge = getNextDailyChallenge(teamActivities);

          // Show reminder if: streak exists AND no activity completed today
          const showReminder = streak > 0 && !completedToday;

          if (showReminder) {
            const [hour, minute] = await Promise.all([
              storage.getReminderHour(),
              storage.getReminderMinute(),
            ]);
            scheduleStreakReminderNotification({
              challenge: nextChallenge,
              streak,
              hour,
              minute,
            }).catch(console.error);
          } else {
            cancelChallengeNotifications().catch(console.error);
          }

          setReminder({
            showReminder,
            streak,
            completedToday,
            loading: false,
          });
        } catch (e) {
          console.error("Failed to check streak reminder:", e);
          setReminder((prev) => ({ ...prev, loading: false }));
        }
      };

      check();
      return () => {
        active = false;
      };
    }, [team]),
  );

  return reminder;
}
