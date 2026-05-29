import { Prototype } from "../types";

export type WereYouRightValue = "yes" | "partly" | "no";

type PredictionUiConfig = {
  predictionLabel: string;
  predictionPlaceholder: string;
  predictionValueLabel: string;
  predictionValuePlaceholder: string;
  predictionValueUnit?: string;
  /** When true, only the numeric/value field is shown (no free-text prediction). */
  valueOnly?: boolean;
};
function num(value: unknown): number | null {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function getPredictionUiConfig(challengeId: number): PredictionUiConfig {
  switch (challengeId) {
    case 1:
      return {
        predictionLabel: "Predict parachute performance",
        predictionPlaceholder:
          "Design 2 will be the slowest and safest landing",
        predictionValueLabel: "Predict fall time",
        predictionValuePlaceholder: "1.80",
        predictionValueUnit: "s",
      };
    case 2:
      return {
        predictionLabel: "Predict sound level",
        predictionPlaceholder: "",
        predictionValueLabel: "Predict sound level",
        predictionValuePlaceholder: "72",
        predictionValueUnit: "dB",
        valueOnly: true,
      };
    case 3:
      return {
        predictionLabel: "Predict bend angle",
        predictionPlaceholder: "Folded paper fan at 15 cm will bend the most",
        predictionValueLabel: "Predict bend angle",
        predictionValuePlaceholder: "38",
        predictionValueUnit: "degrees",
      };
    case 4:
      return {
        predictionLabel: "Predict earthquake resistance",
        predictionPlaceholder: "Wider base will shake less",
        predictionValueLabel: "Predict shake",
        predictionValuePlaceholder: "0.12",
        predictionValueUnit: "g",
      };
    case 5:
      return {
        predictionLabel: "Predict movement performance",
        predictionPlaceholder: "Wrist figure-8 will be smoothest",
        predictionValueLabel: "Predict movement",
        predictionValuePlaceholder: "6.5",
        predictionValueUnit: "movement units",
      };
    case 6:
      return {
        predictionLabel: "Predict reaction time",
        predictionPlaceholder: "Ava will react fastest",
        predictionValueLabel: "Predict reaction time",
        predictionValuePlaceholder: "0.32",
        predictionValueUnit: "s",
      };
    case 7:
      return {
        predictionLabel: "Predict breathing rate",
        predictionPlaceholder: "Star jumps will reach highest BPM",
        predictionValueLabel: "Predict BPM",
        predictionValuePlaceholder: "28",
        predictionValueUnit: "bpm",
      };
    default:
      return {
        predictionLabel: "Predict this attempt",
        predictionPlaceholder: "What do you think will happen?",
        predictionValueLabel: "Predicted value",
        predictionValuePlaceholder: "0",
      };  }
}

export function buildOutcomeTextForChallenge(
  challengeId: number,
  measurements: Record<string, string | number>,
): string {
  switch (challengeId) {
    case 1: {
      const fall = num(measurements.fallTimeSeconds);
      const stop = num(measurements.contactTimeSeconds ?? measurements.contactTime);
      const gForce = num(measurements.gForce);
      const parts: string[] = [];
      if (fall != null) parts.push(`${fall.toFixed(2)} s to ground`);
      if (stop != null) parts.push(`${stop.toFixed(2)} s stop time`);
      if (gForce != null) parts.push(`${gForce.toFixed(1)} g impact`);
      return parts.join(" | ");
    }
    case 2: {
      const db = num(measurements.soundLevel);
      return db != null ? `${db.toFixed(1)} dB measured` : "";
    }
    case 3: {
      const bend = num(measurements.bendAngle);
      return bend != null ? `${bend.toFixed(1)}° bend angle` : "";
    }
    case 4: {
      const shake = num(measurements.vibrationData);
      const movement = num(measurements.movement);
      const parts: string[] = [];
      if (shake != null) parts.push(`${shake.toFixed(3)} g shake`);
      if (movement != null) parts.push(`${movement.toFixed(2)} cm movement`);
      return parts.join(" | ");
    }
    case 5: {
      const units = num(measurements.movementUnits);
      const seconds = num(measurements.durationSeconds ?? measurements.timeSeconds);
      if (units != null && seconds != null) {
        return `${units.toFixed(1)} movement units in ${seconds.toFixed(1)} seconds`;
      }
      const vibration = num(measurements.vibrationData);
      const time = num(measurements.timeSeconds);
      if (vibration != null && time != null) {
        return `${vibration.toFixed(3)} g in ${time.toFixed(1)} seconds`;
      }
      return "";
    }
    case 6: {
      const parsed = parseTeamReaction(measurements.teamResults);
      if (parsed) return parsed;
      const reaction = num(measurements.reactionTime);
      return reaction != null ? `${reaction.toFixed(3)} s reaction time` : "";
    }
    case 7: {
      const bpm = num(measurements.breathingData);
      return bpm != null ? `${Math.round(bpm)} breaths/min measured` : "";
    }
    default:
      return String(measurements.outcomeText ?? "").trim();
  }
}

function parseTeamReaction(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const values = parsed
        .map((entry) => num((entry as Record<string, unknown>).average))
        .filter((value): value is number => value != null);
      if (values.length > 0) {
        const fastest = Math.min(...values);
        return `${fastest.toFixed(3)} s fastest team average`;
      }
    }
  } catch {
    return "";
  }
  return "";
}

export function getPrototypePredictionText(prototype: Prototype): string {
  const m = prototype.measurements;
  return String(m.predictedOutcomeText ?? m.predictedMovementText ?? "").trim();
}

export function getPrototypePredictionValue(prototype: Prototype): string {
  const m = prototype.measurements;
  return String(m.predictedOutcomeValue ?? m.predictedMovementUnits ?? "").trim();
}

export function getPrototypeOutcomeText(
  challengeId: number,
  prototype: Prototype,
): string {
  const explicit = String(prototype.measurements.outcomeText ?? "").trim();
  if (explicit.length > 0) return explicit;
  return buildOutcomeTextForChallenge(challengeId, prototype.measurements);
}

export function getPrototypeWereYouRight(
  prototype: Prototype,
): WereYouRightValue | "" {
  const raw = String(prototype.measurements.wereYouRight ?? "").trim();
  if (raw === "yes" || raw === "partly" || raw === "no") return raw;
  return "";
}

export function formatPredictionDisplay(
  challengeId: number,
  prototype: Prototype,
): string {
  const text = getPrototypePredictionText(prototype);
  const value = getPrototypePredictionValue(prototype);
  const config = getPredictionUiConfig(challengeId);

  if (config.valueOnly) {
    return value
      ? config.predictionValueUnit
        ? `${value} ${config.predictionValueUnit}`
        : value
      : "";
  }
  if (text && value) {
    return config.predictionValueUnit
      ? `${text} (${value} ${config.predictionValueUnit})`
      : `${text} (${value})`;
  }
  return text || value;
}

export function getPredictionCharsFromPrototypes(
  prototypes: Prototype[],
): number {
  return prototypes.reduce((sum, prototype) => {
    const text = getPrototypePredictionText(prototype).length;
    const value = getPrototypePredictionValue(prototype).length;
    return sum + Math.max(text, value);
  }, 0);
}
