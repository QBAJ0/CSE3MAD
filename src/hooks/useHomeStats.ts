import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTeam } from "../context/TeamContext";
import { storage } from "../utils/storage";

type HomeStats = {
  totalPoints: number;
  completedCount: number;
  streak: number;
  loading: boolean;
};

export function useHomeStats(): HomeStats {
  const { team } = useTeam();
  const [stats, setStats] = useState<HomeStats>({
    totalPoints: 0,
    completedCount: 0,
    streak: 0,
    loading: true,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        const [activities, streak] = await Promise.all([
          storage.getCompletedActivities(),
          storage.getStreak(),
        ]);
        if (!active) return;
        const mine = activities.filter(
          (a) => a.teamId === team?.discriminator,
        );
        setStats({
          totalPoints: mine.reduce((sum, a) => sum + (a.points ?? 0), 0),
          completedCount: mine.length,
          streak,
          loading: false,
        });
      };
      load();
      return () => {
        active = false;
      };
    }, [team]),
  );

  return stats;
}
