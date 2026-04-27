import React, { createContext, useContext, useState } from "react";
import { GAMIFICATION, SCORING } from "../config/constants";
import { pushResultToCloud } from "../services/leaderboard";
import { ActivityResult, DifficultyMode, Prototype } from "../types";
import { storage } from "../utils/storage";

type Draft = Partial<ActivityResult> & {
  prototypes: Prototype[];
  currentPrototypeIndex: number;
};

type ActivityContextValue = {
  draft: Draft;
  startDraft: (args: {
    challengeId: number;
    teamId: string;
    teamName: string;
    difficulty: DifficultyMode;
  }) => void;
  setPrediction: (prediction: string) => void;
  updatePrototype: (
    index: number,
    patch: Partial<Omit<Prototype, "index">>,
  ) => void;
  addPrototype: () => void;
  setCurrentPrototypeIndex: (index: number) => void;
  setDerivedForPrototype: (
    prototypeIndex: number,
    derived: Record<string, number>,
  ) => void;
  setLocation: (lat: number, lng: number) => void;
  finalize: (args: {
    rating: 1 | 2 | 3 | 4 | 5;
    reflection: string;
    completedInTime?: boolean;
  }) => Promise<ActivityResult | null>;
  clearDraft: () => void;
};

const emptyDraft: Draft = { prototypes: [], currentPrototypeIndex: 0 };

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const startDraft: ActivityContextValue["startDraft"] = ({
    challengeId,
    teamId,
    teamName,
    difficulty,
  }) => {
    setDraft({
      id: `draft-${Date.now()}`,
      challengeId,
      teamId,
      teamName,
      difficulty,
      prediction: "",
      prototypes: [
        { index: 1, measurements: {}, capturedAt: new Date().toISOString() },
      ],
      derivedByPrototype: {},
      currentPrototypeIndex: 0,
      createdAt: new Date().toISOString(),
    });
  };

  const setPrediction = (prediction: string) =>
    setDraft((prev) => ({ ...prev, prediction }));

  const updatePrototype: ActivityContextValue["updatePrototype"] = (
    index,
    patch,
  ) => {
    setDraft((prev) => ({
      ...prev,
      prototypes: prev.prototypes.map((p) =>
        p.index === index
          ? {
              ...p,
              ...patch,
              measurements: {
                ...p.measurements,
                ...(patch.measurements ?? {}),
              },
            }
          : p,
      ),
    }));
  };

  const addPrototype = () =>
    setDraft((prev) => {
      const nextIndex = prev.prototypes.length + 1;
      return {
        ...prev,
        prototypes: [
          ...prev.prototypes,
          {
            index: nextIndex,
            measurements: {},
            capturedAt: new Date().toISOString(),
          },
        ],
        currentPrototypeIndex: prev.prototypes.length,
      };
    });

  const setCurrentPrototypeIndex = (index: number) =>
    setDraft((prev) => ({ ...prev, currentPrototypeIndex: index }));

  const setDerivedForPrototype: ActivityContextValue["setDerivedForPrototype"] =
    (prototypeIndex, derived) => {
      setDraft((prev) => ({
        ...prev,
        derivedByPrototype: {
          ...(prev.derivedByPrototype ?? {}),
          [prototypeIndex]: {
            ...((prev.derivedByPrototype ?? {})[prototypeIndex] ?? {}),
            ...derived,
          },
        },
      }));
    };

  const setLocation = (lat: number, lng: number) =>
    setDraft((prev) => ({ ...prev, location: { lat, lng } }));

  const calculatePoints = (
    result: Omit<ActivityResult, "points">,
    completedInTime: boolean,
  ): number => {
    let points: number = SCORING.BASE_XP;
    if (result.prototypes.length >= 2) points += SCORING.MULTI_DESIGN_2;
    if (result.prototypes.length >= 3) points += SCORING.MULTI_DESIGN_3;
    if (result.rating >= 4) points += SCORING.HIGH_RATING_4;
    if (result.rating === 5) points += SCORING.HIGH_RATING_5;
    if (result.reflection.length > GAMIFICATION.REFLECTION_THRESHOLD_1)
      points += SCORING.REFLECTION_BONUS;
    if (result.reflection.length > GAMIFICATION.REFLECTION_THRESHOLD_2)
      points += SCORING.REFLECTION_BONUS;
    if (result.location) points += SCORING.GPS_TAGGED;
    if (result.difficulty === "highSchool")
      points = Math.floor(points * SCORING.HIGH_SCHOOL_MULTIPLIER);
    if (!completedInTime)
      points = Math.floor(points * SCORING.TIME_PENALTY_MULTIPLIER);
    return points;
  };

  const finalize: ActivityContextValue["finalize"] = async ({
    rating,
    reflection,
    completedInTime = true,
  }) => {
    if (
      !draft.id ||
      draft.challengeId === undefined ||
      !draft.teamId ||
      !draft.teamName ||
      !draft.difficulty
    ) {
      return null;
    }

    const baseResult = {
      id: draft.id,
      challengeId: draft.challengeId,
      teamId: draft.teamId,
      teamName: draft.teamName,
      difficulty: draft.difficulty,
      prediction: draft.prediction ?? "",
      prototypes: draft.prototypes,
      derivedByPrototype: draft.derivedByPrototype ?? {},
      rating,
      reflection,
      location: draft.location,
      createdAt: draft.createdAt ?? new Date().toISOString(),
    };

    const points = calculatePoints(baseResult, completedInTime);
    const result: ActivityResult = { ...baseResult, points, completedInTime };

    await storage.saveCompletedActivity(result);
    pushResultToCloud(result); // fire-and-forget; falls back gracefully if offline
    return result;
  };

  const clearDraft = () => setDraft(emptyDraft);

  return (
    <ActivityContext.Provider
      value={{
        draft,
        startDraft,
        setPrediction,
        updatePrototype,
        addPrototype,
        setCurrentPrototypeIndex,
        setDerivedForPrototype,
        setLocation,
        finalize,
        clearDraft,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be used inside ActivityProvider");
  return ctx;
}
