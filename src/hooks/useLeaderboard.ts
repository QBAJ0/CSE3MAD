import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  buildLocalLeaderboard,
  fetchLeaderboardFromCloud,
} from "../services/leaderboard";
import { ensureFirebaseAuth } from "../services/authSession";
import { isFirebaseConfigured } from "../firebase";
import { LeaderboardEntry } from "../types";
import { storage } from "../utils/storage";

export type LeaderboardTimeFrame = "week" | "month" | "all";

function timeframeCutoff(timeFrame: LeaderboardTimeFrame): Date | null {
  const now = Date.now();
  if (timeFrame === "week") {
    return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
  if (timeFrame === "month") {
    return new Date(new Date(now).setMonth(new Date(now).getMonth() - 1));
  }
  return null;
}

/** Merge cloud + local entries by team discriminator; prefer higher totalPoints. */
function mergeLeaderboardEntries(
  cloud: LeaderboardEntry[],
  local: LeaderboardEntry[],
): LeaderboardEntry[] {
  const byDisc = new Map<string, LeaderboardEntry>();
  for (const entry of [...cloud, ...local]) {
    const key = entry.discriminator;
    const existing = byDisc.get(key);
    if (!existing || entry.totalPoints > existing.totalPoints) {
      byDisc.set(key, { ...entry, rank: 0 });
    }
  }
  return [...byDisc.values()]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

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
        const cutoff = timeframeCutoff(timeFrame);
        const activities = await storage.getCompletedActivities();
        const localEntries = buildLocalLeaderboard(activities, cutoff);

        let cloudEntries: LeaderboardEntry[] = [];
        if (isFirebaseConfigured) {
          try {
            await ensureFirebaseAuth();
            cloudEntries = await fetchLeaderboardFromCloud(cutoff);
          } catch (e) {
            console.warn("[useLeaderboard] cloud fetch failed, using local only:", e);
          }
        }

        if (!active) return;

        const merged =
          cloudEntries.length > 0
            ? mergeLeaderboardEntries(cloudEntries, localEntries)
            : localEntries;

        console.log("[useLeaderboard] loaded", {
          timeFrame,
          cloudTeams: cloudEntries.length,
          localTeams: localEntries.length,
          displayedTeams: merged.length,
        });

        setEntries(merged);
        setLoading(false);
      };
      void load();
      return () => {
        active = false;
      };
    }, [timeFrame]),
  );

  return { entries, loading };
}
