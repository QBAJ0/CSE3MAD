import { ActivityResult } from "../types";

const LOCAL_URI_PREFIXES = [
  "file://",
  "content://",
  "ph://",
  "assets-library://",
];

export type MediaEvidenceRef = {
  resultId: string;
  challengeId: number;
  teamId: string;
  prototypeIndex: number;
  measurementKey: string;
  localUri: string;
};

export function isLocalMediaUri(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return false;
  }
  return LOCAL_URI_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

export function collectMediaEvidenceFromResult(
  result: ActivityResult,
): MediaEvidenceRef[] {
  const refs: MediaEvidenceRef[] = [];

  result.prototypes.forEach((prototype) => {
    for (const [measurementKey, raw] of Object.entries(prototype.measurements)) {
      if (!isLocalMediaUri(raw)) continue;
      refs.push({
        resultId: result.id,
        challengeId: result.challengeId,
        teamId: result.teamId,
        prototypeIndex: prototype.index,
        measurementKey,
        localUri: raw.trim(),
      });
    }
  });

  return refs;
}

/** Matches `storage.rules` path `activity-evidence/{ownerUid}/{activityId}/...`. */
export function buildMediaStoragePath(
  ref: MediaEvidenceRef,
  ownerUid: string,
): string {
  const ext = extensionFromUri(ref.localUri);
  return `activity-evidence/${ownerUid}/${ref.resultId}/prototype-${ref.prototypeIndex}-${ref.measurementKey}${ext}`;
}

export function inferMediaType(
  measurementKey: string,
  uri: string,
): "video" | "photo" | "unknown" {
  const key = measurementKey.toLowerCase();
  if (key.includes("video")) return "video";
  if (key.includes("photo")) return "photo";
  const lower = uri.toLowerCase();
  if (/\.(mp4|mov|m4v)(\?|$)/.test(lower)) return "video";
  if (/\.(jpg|jpeg|png|webp|heic)(\?|$)/.test(lower)) return "photo";
  return "unknown";
}

function extensionFromUri(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
  if (!match) return "";
  const ext = match[1].toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "heic", "mp4", "mov", "m4v"].includes(ext)) {
    return `.${ext}`;
  }
  return "";
}
