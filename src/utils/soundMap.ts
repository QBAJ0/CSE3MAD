import { Prototype, SoundMapPoint } from "../types";

export function parseSoundMapPoints(
  challengeId: number,
  prototypes: Prototype[],
): SoundMapPoint[] {
  if (challengeId !== 2) return [];
  return prototypes
    .map((p, i) => {
      const locStr = String(p.measurements.location ?? "");
      const db = parseFloat(String(p.measurements.soundLevel ?? "0"));
      const parts = locStr.split(",").map((s) => parseFloat(s.trim()));
      if (
        parts.length === 2 &&
        !isNaN(parts[0]) &&
        !isNaN(parts[1]) &&
        db > 0
      ) {
        return {
          id: String(i),
          label: String(p.measurements.action ?? `Action ${p.index}`),
          db,
          latitude: parts[0],
          longitude: parts[1],
        };
      }
      return null;
    })
    .filter((pt): pt is SoundMapPoint => pt !== null);
}
