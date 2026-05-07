import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTeam } from "../context/TeamContext";
import { storage } from "../utils/storage";

export function useActivityCompletion(): { completedIds: Set<number>; loading: boolean } {
  const { team } = useTeam();
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        const activities = await storage.getCompletedActivities();
        if (!active) return;
        setCompletedIds(
          new Set(
            activities
              .filter((a) => a.teamId === team?.discriminator)
              .map((a) => a.challengeId),
          ),
        );
        setLoading(false);
      };
      load();
      return () => {
        active = false;
      };
    }, [team]),
  );

  return { completedIds, loading };
}
