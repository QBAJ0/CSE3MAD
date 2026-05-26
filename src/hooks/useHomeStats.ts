import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { storage } from "../utils/storage";

type HomeStats = {
  streak: number;
  loading: boolean;
};

export function useHomeStats(): HomeStats {
  const [stats, setStats] = useState<HomeStats>({
    streak: 0,
    loading: true,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        const streak = await storage.getStreak();
        if (!active) return;
        setStats({ streak, loading: false });
      };
      load();
      return () => {
        active = false;
      };
    }, []),
  );

  return stats;
}
