import React, { createContext, useContext, useState } from "react";
import { GAMIFICATION } from "../config/constants";
import { getChallengeById } from "../data/challenges";
import {
  resolveSubmissionLocation,
  scoreActivityResult,
} from "../services/challengeScoring";
import { ensureFirebaseAuth } from "../services/authSession";
import { syncChallengeResultToCloud } from "../services/challengeCloudSync";
import { persistChallengeResultToSqlite } from "../services/challengeResultLocal";
import { enqueueMediaUploadsForResult } from "../services/mediaUploadQueue";
import { deriveParachute } from "../services/physics";
import {
  ActivityResult,
  DifficultyMode,
  Measurement,
  Prototype,
} from "../types";
import { storage } from "../utils/storage";
import { HUMAN_PERFORMANCE_TRIALS } from "../data/humanPerformanceTrials";
import {
  HUMAN_PERFORMANCE_CHALLENGE_ID,
  isHumanPerformancePrototypeComplete,
} from "../utils/humanPerformance";

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
      !EVIDENCE_RECORDERS.has(measurement.recorder) &&
      !measurement.optional,
  );

const hasCompleteRequiredData = (result: Omit<ActivityResult, "points">) => {
  const challenge = getChallengeById(result.challengeId);
  if (!challenge || result.prototypes.length === 0) return false;

  if (result.challengeId === HUMAN_PERFORMANCE_CHALLENGE_ID) {
    return result.prototypes.every(isHumanPerformancePrototypeComplete);
  }

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
    const isHumanPerformance = challengeId === HUMAN_PERFORMANCE_CHALLENGE_ID;
    setDraft({
      id: `draft-${Date.now()}`,
      challengeId,
      teamId,
      teamName,
      difficulty,
      prediction: "",
      prototypes: [
        {
          index: 1,
          measurements: isHumanPerformance
            ? { movementType: HUMAN_PERFORMANCE_TRIALS[0].movementType }
            : {},
          capturedAt: new Date().toISOString(),
        },
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
      const hpTrial =
        prev.challengeId === HUMAN_PERFORMANCE_CHALLENGE_ID
          ? HUMAN_PERFORMANCE_TRIALS.find((t) => t.prototypeIndex === nextIndex)
          : undefined;
      return {
        ...prev,
        prototypes: [
          ...prev.prototypes,
          {
            index: nextIndex,
            measurements: hpTrial
              ? { movementType: hpTrial.movementType }
              : {},
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

    try {
      const submittedLocation = resolveSubmissionLocation(
        draft.location,
        draft.prototypes,
      );

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
        prototypes: draft.prototypes,
        derivedByPrototype,
        rating,
        reflection,
        location: submittedLocation,
        createdAt: draft.createdAt ?? new Date().toISOString(),
      };

      const points = scoreActivityResult(baseResult, completedInTime);
      const result: ActivityResult = { ...baseResult, points, completedInTime };

      console.log("[claim] saving challenge result to sqlite", {
        resultId: result.id,
        teamId: result.teamId,
        challengeId: result.challengeId,
      });
      const sqliteSaved = await persistChallengeResultToSqlite(result);
      if (!sqliteSaved) {
        console.warn("[claim] sqlite save failed; aborting claim", {
          resultId: result.id,
        });
        return null;
      }
      console.log("[claim] sqlite save ok", { resultId: result.id });

      const saved = await storage.saveCompletedActivity(result);
      if (!saved) return null;

      void (async () => {
        try {
          console.log("[claim] starting cloud sync", {
            resultId: result.id,
            teamId: result.teamId,
          });
          await ensureFirebaseAuth();
          await syncChallengeResultToCloud(result);
          void enqueueMediaUploadsForResult(result);
          console.log("[claim] cloud sync completed", { resultId: result.id });
        } catch (e) {
          console.warn("[ActivityContext] cloud sync after claim:", e);
        }
      })();

      return result;
    } catch (e) {
      console.error("finalize failed:", e);
      return null;
    }
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
