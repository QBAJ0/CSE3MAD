import { GAMIFICATION, SCORING } from "../config/constants";
import { getChallengeById } from "../data/challenges";
import {
  ActivityResult,
  DifficultyMode,
  Measurement,
  Prototype,
} from "../types";

export type PointsBreakdownItem = {
  label: string;
  value: string;
  isPenalty?: boolean;
};

const EVIDENCE_RECORDERS = new Set<Measurement["recorder"]>([
  "gps",
  "video",
  "videoAnalyzer",
  "slowMotion",
  "photo",
]);

const hasMeasurementValue = (value: unknown) =>
  value !== undefined && value !== null && String(value).trim().length > 0;

export function parseLocationMeasurement(
  value: string | number | undefined,
): { lat: number; lng: number } | undefined {
  if (typeof value !== "string") return undefined;

  const [latRaw, lngRaw] = value.split(",").map((part) => part.trim());
  const lat = parseFloat(latRaw);
  const lng = parseFloat(lngRaw);

  if (isNaN(lat) || isNaN(lng)) return undefined;
  return { lat, lng };
}

/** Same location resolution used at submit time in ActivityContext.finalize. */
export function resolveSubmissionLocation(
  draftLocation: { lat: number; lng: number } | undefined,
  prototypes: Prototype[],
): { lat: number; lng: number } | undefined {
  if (draftLocation) return draftLocation;

  for (const prototype of prototypes) {
    const parsed = parseLocationMeasurement(prototype.measurements.location);
    if (parsed) return parsed;
  }

  return undefined;
}

export type ChallengeScoringSignals = {
  hasCompleteData: boolean;
  hasEvidence: boolean;
  hasTeamwork: boolean;
};

export function getChallengeScoringSignals(args: {
  challengeId: number;
  difficulty: DifficultyMode;
  prototypes: Prototype[];
  location?: { lat: number; lng: number };
}): ChallengeScoringSignals {
  const challenge = getChallengeById(args.challengeId);
  const measurements =
    challenge?.measurements.filter(
      (m) => !m.difficulty || m.difficulty === args.difficulty,
    ) ?? [];

  const requiredMeasurements = measurements.filter(
    (m) => !EVIDENCE_RECORDERS.has(m.recorder),
  );

  const hasCompleteData =
    args.prototypes.length > 0 &&
    requiredMeasurements.length > 0 &&
    args.prototypes.every((prototype) =>
      requiredMeasurements.every((measurement) =>
        hasMeasurementValue(prototype.measurements[measurement.key]),
      ),
    );

  const hasEvidence = (() => {
    if (args.location) return true;

    const evidenceKeys = measurements
      .filter((m) => EVIDENCE_RECORDERS.has(m.recorder))
      .map((m) => m.key);

    return args.prototypes.some((prototype) =>
      evidenceKeys.some((key) =>
        hasMeasurementValue(prototype.measurements[key]),
      ),
    );
  })();

  const hasTeamwork = args.prototypes.some((prototype) => {
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

  return { hasCompleteData, hasEvidence, hasTeamwork };
}

export type ChallengePointsInput = {
  prototypeCount: number;
  reflectionChars: number;
  hasCompleteData: boolean;
  hasEvidence: boolean;
  hasTeamwork: boolean;
  difficulty: DifficultyMode;
  completedInTime: boolean;
};

export function calculateChallengePoints(input: ChallengePointsInput): number {
  let points: number = SCORING.BASE_XP;

  if (input.prototypeCount >= 2) points += SCORING.MULTI_DESIGN_2;
  if (input.prototypeCount >= 3) points += SCORING.MULTI_DESIGN_3;
  if (input.hasCompleteData) points += SCORING.DATA_QUALITY;
  if (input.reflectionChars > GAMIFICATION.REFLECTION_THRESHOLD_1) {
    points += SCORING.REFLECTION_BONUS;
  }
  if (input.hasEvidence) points += SCORING.EVIDENCE_BONUS;
  if (input.hasTeamwork) points += SCORING.TEAMWORK_BONUS;
  if (input.difficulty === "highSchool") {
    points = Math.floor(points * SCORING.HIGH_SCHOOL_MULTIPLIER);
  }
  if (!input.completedInTime) {
    points = Math.floor(points * SCORING.TIME_PENALTY_MULTIPLIER);
  }

  return points;
}

export function buildChallengePointsBreakdown(
  input: ChallengePointsInput,
): { items: PointsBreakdownItem[]; total: number } {
  const items: PointsBreakdownItem[] = [];
  let pts: number = SCORING.BASE_XP;
  items.push({ label: "Base completion", value: `+${SCORING.BASE_XP}` });

  if (input.prototypeCount >= 2) {
    const bonus =
      SCORING.MULTI_DESIGN_2 +
      (input.prototypeCount >= 3 ? SCORING.MULTI_DESIGN_3 : 0);
    pts += bonus;
    items.push({
      label: `Multiple designs (×${input.prototypeCount})`,
      value: `+${bonus}`,
    });
  }

  if (input.hasCompleteData) {
    pts += SCORING.DATA_QUALITY;
    items.push({
      label: "Complete data set",
      value: `+${SCORING.DATA_QUALITY}`,
    });
  }

  if (input.reflectionChars > GAMIFICATION.REFLECTION_THRESHOLD_1) {
    pts += SCORING.REFLECTION_BONUS;
    items.push({
      label: "Detailed observations",
      value: `+${SCORING.REFLECTION_BONUS}`,
    });
  }

  if (input.hasEvidence) {
    pts += SCORING.EVIDENCE_BONUS;
    items.push({
      label: "Evidence attached",
      value: `+${SCORING.EVIDENCE_BONUS}`,
    });
  }

  if (input.hasTeamwork) {
    pts += SCORING.TEAMWORK_BONUS;
    items.push({
      label: "Teamwork evidence",
      value: `+${SCORING.TEAMWORK_BONUS}`,
    });
  }

  if (input.difficulty === "highSchool") {
    pts = Math.floor(pts * SCORING.HIGH_SCHOOL_MULTIPLIER);
    items.push({ label: "High school multiplier", value: "×1.5" });
  }

  if (!input.completedInTime) {
    pts = Math.floor(pts * SCORING.TIME_PENALTY_MULTIPLIER);
    items.push({ label: "Time penalty", value: "-20%", isPenalty: true });
  }

  return { items, total: pts };
}

export function scoreActivityResult(
  result: Omit<ActivityResult, "points">,
  completedInTime: boolean,
): number {
  const signals = getChallengeScoringSignals({
    challengeId: result.challengeId,
    difficulty: result.difficulty,
    prototypes: result.prototypes,
    location: result.location,
  });

  return calculateChallengePoints({
    prototypeCount: result.prototypes.length,
    reflectionChars: result.reflection.length,
    ...signals,
    difficulty: result.difficulty,
    completedInTime,
  });
}

export function buildPointsInputFromDraft(args: {
  challengeId: number;
  difficulty: DifficultyMode;
  prototypes: Prototype[];
  reflectionChars: number;
  draftLocation?: { lat: number; lng: number };
  completedInTime: boolean;
}): ChallengePointsInput {
  const location = resolveSubmissionLocation(
    args.draftLocation,
    args.prototypes,
  );
  const signals = getChallengeScoringSignals({
    challengeId: args.challengeId,
    difficulty: args.difficulty,
    prototypes: args.prototypes,
    location,
  });

  return {
    prototypeCount: args.prototypes.length,
    reflectionChars: args.reflectionChars,
    ...signals,
    difficulty: args.difficulty,
    completedInTime: args.completedInTime,
  };
}
