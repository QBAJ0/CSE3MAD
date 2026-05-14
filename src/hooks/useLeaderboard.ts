import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { buildLocalLeaderboard } from "../services/leaderboard";
import { LeaderboardEntry } from "../types";
import { storage } from "../utils/storage";

export type LeaderboardTimeFrame = "week" | "month" | "all";

export function useLeaderboard(timeFrame: LeaderboardTimeFrame): {
  entries: LeaderboardEntry[];
  loading: boolean;
} {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        const activities = await storage.getCompletedActivities();
        if (!active) return;

        const now = Date.now();
        const cutoff =
          timeFrame === "week"
            ? new Date(now - 7 * 24 * 60 * 60 * 1000)
            : timeFrame === "month"
              ? new Date(new Date(now).setMonth(new Date(now).getMonth() - 1))
              : null;

        setEntries(buildLocalLeaderboard(activities, cutoff));
        setLoading(false);
      };
      load();
      return () => {
        active = false;
      };
    }, [timeFrame]),
  );

  return { entries, loading };
}
