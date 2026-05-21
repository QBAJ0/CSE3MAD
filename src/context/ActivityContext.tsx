import React, { createContext, useContext, useState } from "react";
import { GAMIFICATION, SCORING } from "../config/constants";
import { getChallengeById } from "../data/challenges";
import { pushActivityToCloud, pushResultToCloud } from "../services/leaderboard";
import {
  ActivityResult,
  DifficultyMode,
  Measurement,
  Prototype,
} from "../types";
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

const EVIDENCE_RECORDERS = new Set<Measurement["recorder"]>([
  "gps",
  "video",
  "videoAnalyzer",
  "slowMotion",
  "photo",
]);

const hasMeasurementValue = (value: unknown) =>
  value !== undefined && value !== null && String(value).trim().length > 0;

const getScoredMeasurements = (
  measurements: Measurement[],
  difficulty: DifficultyMode,
) =>
  measurements.filter(
    (measurement) =>
      (!measurement.difficulty || measurement.difficulty === difficulty) &&
      !EVIDENCE_RECORDERS.has(measurement.recorder),
  );

const hasCompleteRequiredData = (result: Omit<ActivityResult, "points">) => {
  const challenge = getChallengeById(result.challengeId);
  if (!challenge || result.prototypes.length === 0) return false;

  const requiredMeasurements = getScoredMeasurements(
    challenge.measurements,
    result.difficulty,
  );
  if (requiredMeasurements.length === 0) return false;

  return result.prototypes.every((prototype) =>
    requiredMeasurements.every((measurement) =>
      hasMeasurementValue(prototype.measurements[measurement.key]),
    ),
  );
};

const hasEvidenceAttached = (result: Omit<ActivityResult, "points">) => {
  if (result.location) return true;

  const challenge = getChallengeById(result.challengeId);
  const evidenceKeys =
    challenge?.measurements
      .filter(
        (measurement) =>
          (!measurement.difficulty ||
            measurement.difficulty === result.difficulty) &&
          EVIDENCE_RECORDERS.has(measurement.recorder),
      )
      .map((measurement) => measurement.key) ?? [];

  return result.prototypes.some((prototype) =>
    evidenceKeys.some((key) => hasMeasurementValue(prototype.measurements[key])),
  );
};

const hasTeamworkEvidence = (result: Omit<ActivityResult, "points">) =>
  result.prototypes.some((prototype) => {
    const rawTeamResults = prototype.measurements.teamResults;
    if (!hasMeasurementValue(rawTeamResults)) return false;

    if (typeof rawTeamResults !== "string") return true;

    try {
      const parsed = JSON.parse(rawTeamResults);
      return Array.isArray(parsed) && parsed.length > 1;
    } catch {
      return true;
    }
  });

const parseLocationMeasurement = (
  value: string | number | undefined,
): { lat: number; lng: number } | undefined => {
  if (typeof value !== "string") return undefined;

  const [latRaw, lngRaw] = value.split(",").map((part) => part.trim());
  const lat = parseFloat(latRaw);
  const lng = parseFloat(lngRaw);

  if (isNaN(lat) || isNaN(lng)) return undefined;
  return { lat, lng };
};

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
    if (hasCompleteRequiredData(result)) points += SCORING.DATA_QUALITY;
    if (result.reflection.length > GAMIFICATION.REFLECTION_THRESHOLD_1)
      points += SCORING.REFLECTION_BONUS;
    if (hasEvidenceAttached(result)) points += SCORING.EVIDENCE_BONUS;
    if (hasTeamworkEvidence(result)) points += SCORING.TEAMWORK_BONUS;
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

    const submittedLocation =
      draft.location ??
      draft.prototypes
        .map((prototype) =>
          parseLocationMeasurement(prototype.measurements.location),
        )
        .find((location) => location !== undefined);

    // Keep every prototype measurement, including video, photo, and GPS evidence.
    const baseResult = {
      id: draft.id,
      challengeId: draft.challengeId,
      teamId: draft.teamId,
      teamName: draft.teamName,
      difficulty: draft.difficulty,
      prediction: draft.prediction ?? "",
      prototypes: draft.prototypes, // Includes all measurements.video, measurements.photo, etc.
      derivedByPrototype: draft.derivedByPrototype ?? {},
      rating,
      reflection,
      location: submittedLocation,
      createdAt: draft.createdAt ?? new Date().toISOString(),
    };

    const points = calculatePoints(baseResult, completedInTime);
    const result: ActivityResult = { ...baseResult, points, completedInTime };

    await storage.saveCompletedActivity(result); // Videos persisted to local storage
    pushResultToCloud(result);   // updates team aggregate on leaderboard
    pushActivityToCloud(result); // saves full result + GPS to activities collection
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
