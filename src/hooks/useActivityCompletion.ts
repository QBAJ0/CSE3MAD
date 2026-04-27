import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTeam } from "../context/TeamContext";
import { storage } from "../utils/storage";

export function useActivityCompletion(): { completedIds: Set<number> } {
  const { team } = useTeam();
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

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
      };
      load();
      return () => {
        active = false;
      };
    }, [team]),
  );

  return { completedIds };
}
