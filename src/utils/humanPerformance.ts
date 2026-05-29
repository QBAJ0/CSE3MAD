import { Prototype } from "../types";

export const HUMAN_PERFORMANCE_CHALLENGE_ID = 5;

/** Converts integrated accelerometer magnitude (sum of g-adjusted samples) to display units. */
export const MOVEMENT_UNIT_FACTOR = 0.1;

export type VibrationLevel = "Low" | "Medium" | "High";

/** Same jerk-based formula as GyroscopeRecorder — lower variation = higher %. */
export function computeSmoothnessScore(velocityChanges: number[]): number {
  if (velocityChanges.length === 0) return 0;
  const avgChange =
    velocityChanges.reduce((a, b) => a + b, 0) / velocityChanges.length;
  return Math.max(0, Math.min(100, 100 - avgChange * 100));
}

export function computeMovementUnits(totalMagnitudeSum: number): number {
  if (!Number.isFinite(totalMagnitudeSum) || totalMagnitudeSum <= 0) return 0;
  return Number((totalMagnitudeSum * MOVEMENT_UNIT_FACTOR).toFixed(1));
}

export function vibrationLabelFromPeak(peakG: number): VibrationLevel {
  if (peakG < 0.1) return "Low";
  if (peakG < 0.2) return "Medium";
  return "High";
}

export function formatOutcomeText(
  movementUnits: number,
  durationSeconds: number,
): string {
  return `${movementUnits.toFixed(1)} movement units in ${durationSeconds.toFixed(1)} seconds`;
}

export function buildHumanPerformanceFields(args: {
  durationSeconds: number;
  totalMagnitudeSum: number;
  peakG: number;
  smoothnessScore?: number;
}): Record<string, string | number> {
  const movementUnits = computeMovementUnits(args.totalMagnitudeSum);
  const vibrationLabel = vibrationLabelFromPeak(args.peakG);
  const durationSeconds = Number(args.durationSeconds.toFixed(2));
  const outcomeText = formatOutcomeText(movementUnits, durationSeconds);

  const fields: Record<string, string | number> = {
    durationSeconds,
    timeSeconds: durationSeconds.toFixed(2),
    movementUnits,
    vibrationData: Number(args.peakG.toFixed(3)),
    vibrationLabel,
    outcomeText,
  };

  if (args.smoothnessScore != null && !Number.isNaN(args.smoothnessScore)) {
    fields.smoothness = args.smoothnessScore;
    fields.smoothnessScore = args.smoothnessScore;
  }

  return fields;
}

export function parseHumanPerformancePrototype(prototype: Prototype) {
  const m = prototype.measurements;
  const durationSeconds = parseFloat(
    String(m.durationSeconds ?? m.timeSeconds ?? ""),
  );
  const movementUnits = parseFloat(String(m.movementUnits ?? ""));
  const smoothnessScore = parseFloat(
    String(m.smoothnessScore ?? m.smoothness ?? ""),
  );
  const peakG = parseFloat(String(m.vibrationData ?? ""));
  const vibrationLabel =
    String(m.vibrationLabel ?? "") ||
    (Number.isFinite(peakG) ? vibrationLabelFromPeak(peakG) : "");
  const outcomeText =
    String(m.outcomeText ?? "") ||
    (Number.isFinite(movementUnits) && Number.isFinite(durationSeconds)
      ? formatOutcomeText(movementUnits, durationSeconds)
      : "");

  return {
    predictedMovementText: String(m.predictedMovementText ?? ""),
    predictedMovementUnits: m.predictedMovementUnits,
    durationSeconds,
    movementUnits,
    smoothnessScore,
    vibrationLabel,
    outcomeText,
    wereYouRight: String(m.wereYouRight ?? ""),
    reflectionNotes: String(m.reflectionNotes ?? ""),
    movementType: String(m.movementType ?? ""),
    peakG,
  };
}

export function isHumanPerformancePrototypeComplete(
  prototype: Prototype,
): boolean {
  const m = prototype.measurements;
  const hasMovement = String(m.movementType ?? "").trim().length > 0;
  const hasSession =
    String(m.outcomeText ?? "").trim().length > 0 ||
    (hasMeasurementValue(m.durationSeconds) &&
      hasMeasurementValue(m.movementUnits));
  return hasMovement && hasSession;
}

function hasMeasurementValue(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function formatReflectNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(decimals);
}
