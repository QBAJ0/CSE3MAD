import { Measurement, Prototype } from "../types";

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
): boolean {
  return required.every((m) => {
    const val = prototype.measurements[m.key];
    return val !== undefined && val !== "";
  });
}

export function getMissingMeasurementLabels(
  prototype: Prototype,
  required: Measurement[],
): string[] {
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
): string {
  const lines = prototypes
    .filter((p) => !isPrototypeComplete(p, required))
    .map((p) => {
      const missing = getMissingMeasurementLabels(p, required);
      return missing.length > 0
        ? `Design #${p.index}: ${missing.join(", ")}`
        : `Design #${p.index}: incomplete`;
    });

  return lines.length > 0
    ? lines.join("\n")
    : "Please complete all required measurements.";
}
