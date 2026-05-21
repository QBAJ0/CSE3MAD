import React, { createContext, useContext, useState } from "react";
import { GAMIFICATION, SCORING } from "../config/constants";
import { getChallengeById } from "../data/challenges";
import { pushActivityToCloud, pushResultToCloud } from "../services/leaderboard";
import { deriveFanForce, deriveParachute } from "../services/physics";
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

const hasMeaningfulPrediction = (prediction: string | undefined) =>
  (prediction ?? "").trim().length >= GAMIFICATION.PREDICTION_MIN_CHARS;

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

function numberFromMeasurement(value: unknown): number | undefined {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildDerivedByPrototype(
  challengeId: number,
  prototypes: Prototype[],
): Record<number, Record<string, number>> {
  const derived: Record<number, Record<string, number>> = {};

  prototypes.forEach((prototype) => {
    const measurements = prototype.measurements;
    const values: Record<string, number> = {};

    if (challengeId === 1) {
      const calc = deriveParachute({
        dropHeightMeters: numberFromMeasurement(measurements.dropHeightMeters) ?? NaN,
        fallTimeSeconds: numberFromMeasurement(measurements.fallTimeSeconds) ?? NaN,
        toyMassKg: numberFromMeasurement(measurements.toyMassKg),
        contactTimeSeconds:
          numberFromMeasurement(measurements.contactTimeSeconds) ??
          numberFromMeasurement(measurements.contactTime),
        bounced: String(measurements.bounced) === "Yes",
        timeToMaxHeightSeconds:
          numberFromMeasurement(measurements.timeToMaxHeightSeconds) ??
          numberFromMeasurement(measurements.timeToBouncePeak),
      });
      Object.entries(calc).forEach(([key, value]) => {
        if (value != null && Number.isFinite(value)) values[key] = value;
      });
    }

    if (challengeId === 3) {
      const force = deriveFanForce(
        String(measurements.material ?? ""),
        numberFromMeasurement(measurements.bendAngle) ?? NaN,
      );
      if (force != null) values.estimatedForce = force;
    }

    if (Object.keys(values).length > 0) {
      derived[prototype.index] = values;
    }
  });

  return derived;
}

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
    if (hasMeaningfulPrediction(result.prediction))
      points += SCORING.PREDICTION_BONUS;
    if (result.prototypes.length >= 2) points += SCORING.MULTI_DESIGN_2;
    if (result.prototypes.length >= 3) points += SCORING.MULTI_DESIGN_3;
    if (hasCompleteRequiredData(result)) points += SCORING.DATA_QUALITY;
    if (result.reflection.length > GAMIFICATION.REFLECTION_THRESHOLD_1)
      points += SCORING.REFLECTION_BONUS_1;
    if (result.reflection.length > GAMIFICATION.REFLECTION_THRESHOLD_2)
      points += SCORING.REFLECTION_BONUS_2;
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

    // Keep every prototype measurement, including video, photo, and GPS evidence.
    const derivedByPrototype = {
      ...buildDerivedByPrototype(draft.challengeId, draft.prototypes),
      ...(draft.derivedByPrototype ?? {}),
    };

    const baseResult = {
      id: draft.id,
      challengeId: draft.challengeId,
      teamId: draft.teamId,
      teamName: draft.teamName,
      difficulty: draft.difficulty,
      prediction: draft.prediction ?? "",
      prototypes: draft.prototypes, // Includes all measurements.video, measurements.photo, etc.
      derivedByPrototype,
      rating,
      reflection,
      location: draft.location,
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
