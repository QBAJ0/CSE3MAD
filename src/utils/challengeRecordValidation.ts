import { Measurement, Prototype } from "../types";
import { getTrialLabelForPrototype } from "../data/humanPerformanceTrials";
import {
  HUMAN_PERFORMANCE_CHALLENGE_ID,
  isHumanPerformancePrototypeComplete,
} from "./humanPerformance";

export const OPTIONAL_RECORDERS = new Set<Measurement["recorder"]>([
  "gps",
  "video",
  "photo",
  "videoAnalyzer",
  "slowMotion",
]);

export function getRequiredMeasurements(
  measurements: Measurement[],
): Measurement[] {
  return measurements.filter(
    (m) => !OPTIONAL_RECORDERS.has(m.recorder) && !m.optional,
  );
}

export function isPrototypeComplete(
  prototype: Prototype,
  required: Measurement[],
  challengeId?: number,
): boolean {
  if (challengeId === HUMAN_PERFORMANCE_CHALLENGE_ID) {
    return isHumanPerformancePrototypeComplete(prototype);
  }
  return required.every((m) => {
    const val = prototype.measurements[m.key];
    return val !== undefined && val !== "";
  });
}

/** Measurements shown on record screen; HP session replaces stopwatch + accelerometer. */
export function getRecordMeasurements(
  challengeId: number,
  measurements: Measurement[],
): Measurement[] {
  if (challengeId !== HUMAN_PERFORMANCE_CHALLENGE_ID) return measurements;
  return measurements.filter(
    (m) =>
      m.key !== "timeSeconds" &&
      m.key !== "vibrationData" &&
      m.key !== "smoothness" &&
      m.key !== "movementType",
  );
}

export function getMissingMeasurementLabels(
  prototype: Prototype,
  required: Measurement[],
  challengeId?: number,
): string[] {
  if (challengeId === HUMAN_PERFORMANCE_CHALLENGE_ID) {
    if (isHumanPerformancePrototypeComplete(prototype)) return [];
    const missing: string[] = [];
    if (!prototype.measurements.outcomeText) {
      missing.push("Movement session (timer + movement units)");
    }
    return missing;
  }
  return required
    .filter((m) => {
      const val = prototype.measurements[m.key];
      return val === undefined || val === "";
    })
    .map((m) => m.label);
}

export function buildIncompleteSummary(
  prototypes: Prototype[],
  required: Measurement[],
  challengeId?: number,
): string {
  const lines = prototypes
    .filter((p) => !isPrototypeComplete(p, required, challengeId))
    .map((p) => {
      const missing = getMissingMeasurementLabels(p, required, challengeId);
      const label =
        challengeId === HUMAN_PERFORMANCE_CHALLENGE_ID
          ? getTrialLabelForPrototype(p.index)
          : `Design #${p.index}`;
      return missing.length > 0
        ? `${label}: ${missing.join(", ")}`
        : `${label}: incomplete`;
    });

  return lines.length > 0
    ? lines.join("\n")
    : "Please complete all required measurements.";
}
