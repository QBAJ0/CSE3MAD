import { getChallengeById } from "@/src/data/challenges";
import {
  buildMediaStoragePath,
  collectMediaEvidenceFromResult,
  inferMediaType,
} from "@/src/services/mediaEvidence";
import { ActivityResult, Prototype } from "@/src/types";
import {
  formatPredictionDisplay,
  getPredictionUiConfig,
  getPrototypeOutcomeText,
  getPrototypePredictionText,
  getPrototypePredictionValue,
  getPrototypeWereYouRight,
} from "@/src/utils/prototypePrediction";

/** Top-level keys required on every `activities/{resultId}` document. */
export const REQUIRED_ACTIVITY_DOC_FIELDS = [
  "ownerUid",
  "resultId",
  "id",
  "activityId",
  "challengeId",
  "activityTitle",
  "teamId",
  "discriminator",
  "teamName",
  "yearLevel",
  "difficulty",
  "teamPrediction",
  "prediction",
  "attempts",
  "prototypes",
  "derivedByPrototype",
  "rating",
  "comment",
  "reflection",
  "completedInTime",
  "leaderboardScore",
  "points",
  "location",
  "gpsLat",
  "gpsLng",
  "evidence",
  "createdAt",
  "updatedAt",
] as const;

const SENSOR_MEASUREMENT_KEYS = new Set([
  "vibrationData",
  "soundLevel",
  "breathingData",
  "teamResults",
  "teamBreathing",
  "movementUnits",
  "smoothness",
  "smoothnessScore",
  "fallTimeSeconds",
  "bendAngle",
  "videoAnalysis",
]);

/** One photo/video asset saved under `evidence.files[]`. */
export type MediaEvidenceFileFirestore = {
  localUri: string;
  storagePath: string;
  mediaType: "video" | "photo" | "unknown";
  uploadStatus: "pending" | "uploaded";
  /** Present only after Firebase Storage upload succeeds. */
  downloadUrl?: string;
  uploadedAt?: string;
  prototypeIndex: number;
  measurementKey: string;
  id: string;
};

export type ActivityEvidenceFirestore = {
  hasGps: boolean;
  hasVideo: boolean;
  hasPhoto: boolean;
  hasAnalysis: boolean;
  videoUris: string[];
  photoUris: string[];
  files: MediaEvidenceFileFirestore[];
  /** `pending` while uploads run; `uploaded` when every file has a download URL. Omitted if no media. */
  uploadStatus?: "pending" | "uploaded";
};

export type EvidenceUploadPatch = {
  prototypeIndex: number;
  measurementKey: string;
  localUri: string;
  downloadUrl: string;
  storagePath: string;
  uploadedAt?: string;
};

export type ActivityAttemptFirestore = {
  attemptId: string;
  prototypeId: number;
  attemptNumber: number;
  prototypeIndex: number;
  attemptName: string;
  capturedAt: string;
  prediction: string;
  predictionDisplay: string;
  predictionValue: string;
  predictionUnit: string;
  outcome: string;
  outcomeValue: string;
  unit: string;
  units: string;
  wereYouRight: string | null;
  observationNotes: string;
  sensorSummary: Record<string, string | number>;
  derived: Record<string, number>;
  calculations: Record<string, number>;
  measurements: Record<string, string | number>;
};

/** Document shape written to Firestore `activities/{resultId}`. */
export type ActivityFirestoreDoc = {
  ownerUid: string;
  resultId: string;
  id: string;
  activityId: number;
  challengeId: number;
  activityTitle: string;
  teamId: string;
  teamName: string;
  discriminator: string;
  yearLevel: string;
  difficulty: ActivityResult["difficulty"];
  teamPrediction: string;
  prediction: string;
  attempts: ActivityAttemptFirestore[];
  prototypes: Prototype[];
  derivedByPrototype: Record<number, Record<string, number>>;
  rating: number;
  comment: string;
  reflection: string;
  completedInTime: boolean;
  leaderboardScore: number;
  points: number;
  location: { lat: number; lng: number } | null;
  gpsLat: number | null;
  gpsLng: number | null;
  evidence: ActivityEvidenceFirestore;
  createdAt: string;
  updatedAt: string;
};

function buildSensorSummary(
  measurements: Record<string, string | number>,
): Record<string, string | number> {
  const summary: Record<string, string | number> = {};
  Object.entries(measurements).forEach(([key, value]) => {
    if (
      SENSOR_MEASUREMENT_KEYS.has(key) ||
      key.toLowerCase().includes("vibration") ||
      key.toLowerCase().includes("sensor")
    ) {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        summary[key] = value;
      }
    }
  });
  return summary;
}

function resolveAttemptName(measurements: Record<string, string | number>): string {
  const candidates = [
    measurements.designName,
    measurements.action,
    measurements.condition,
    measurements.movementType,
  ];
  for (const value of candidates) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function resolveAttemptUnits(
  challengeId: number,
  measurements: Record<string, string | number>,
): string {
  const config = getPredictionUiConfig(challengeId);
  if (config.predictionValueUnit) return config.predictionValueUnit;

  const parts: string[] = [];
  if (measurements.fallTimeSeconds != null) parts.push("s");
  if (measurements.soundLevel != null) parts.push("dB");
  if (measurements.bendAngle != null) parts.push("°");
  if (measurements.vibrationData != null) parts.push("g");
  if (measurements.movementUnits != null) parts.push("movement units");
  if (measurements.breathingData != null) parts.push("bpm");
  return parts.join(", ");
}

function num(value: unknown): number | null {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function extractOutcomeValue(
  challengeId: number,
  measurements: Record<string, string | number>,
): string {
  switch (challengeId) {
    case 1:
      return String(num(measurements.fallTimeSeconds) ?? "");
    case 2:
      return String(num(measurements.soundLevel) ?? "");
    case 3:
      return String(num(measurements.bendAngle) ?? "");
    case 4: {
      const shake = num(measurements.vibrationData);
      const movement = num(measurements.movement);
      if (shake != null) return String(shake);
      if (movement != null) return String(movement);
      return "";
    }
    case 5: {
      const units = num(measurements.movementUnits);
      if (units != null) return String(units);
      return String(num(measurements.vibrationData) ?? "");
    }
    case 6:
      return "";
    case 7: {
      const raw = measurements.breathingData;
      if (typeof raw === "string" && raw.trim()) {
        try {
          const members = JSON.parse(raw) as Array<{ bpm: number }>;
          if (Array.isArray(members) && members.length > 0) {
            const avg =
              members.reduce((sum, m) => sum + (m.bpm ?? 0), 0) / members.length;
            return String(Math.round(avg));
          }
        } catch {
          /* fall through */
        }
      }
      return String(num(raw) ?? "");
    }
    default:
      return String(measurements.outcomeValue ?? "");
  }
}

function resolveObservationNotes(
  measurements: Record<string, string | number>,
): string {
  return String(
    measurements.observationNotes ??
      measurements.observations ??
      measurements.notes ??
      "",
  ).trim();
}

export function buildActivityAttempts(
  result: ActivityResult,
): ActivityAttemptFirestore[] {
  const config = getPredictionUiConfig(result.challengeId);
  const showCalculations = result.difficulty === "highSchool";

  return result.prototypes.map((prototype, index) => {
    const wereYouRight = getPrototypeWereYouRight(prototype);
    const derived = result.derivedByPrototype?.[prototype.index] ?? {};
    const unit = config.predictionValueUnit ?? resolveAttemptUnits(
      result.challengeId,
      prototype.measurements,
    );

    return {
      attemptId: `prototype-${prototype.index}`,
      prototypeId: prototype.index,
      attemptNumber: index + 1,
      prototypeIndex: prototype.index,
      attemptName: resolveAttemptName(prototype.measurements),
      capturedAt: prototype.capturedAt,
      prediction: getPrototypePredictionText(prototype),
      predictionDisplay: formatPredictionDisplay(result.challengeId, prototype),
      predictionValue: getPrototypePredictionValue(prototype),
      predictionUnit: unit,
      outcome: getPrototypeOutcomeText(result.challengeId, prototype),
      outcomeValue: extractOutcomeValue(
        result.challengeId,
        prototype.measurements,
      ),
      unit,
      units: resolveAttemptUnits(result.challengeId, prototype.measurements),
      wereYouRight: wereYouRight || null,
      observationNotes: resolveObservationNotes(prototype.measurements),
      sensorSummary: buildSensorSummary(prototype.measurements),
      derived,
      calculations: showCalculations ? { ...derived } : {},
      measurements: { ...prototype.measurements },
    };
  });
}

function evidenceFileId(prototypeIndex: number, measurementKey: string): string {
  return `${prototypeIndex}-${measurementKey}`;
}

function isMediaEvidenceFile(
  file: MediaEvidenceFileFirestore,
): boolean {
  return file.mediaType === "video" || file.mediaType === "photo";
}

export function resolveEvidenceUploadStatus(
  files: MediaEvidenceFileFirestore[],
): "pending" | "uploaded" | undefined {
  const mediaFiles = files.filter(isMediaEvidenceFile);
  if (mediaFiles.length === 0) return undefined;
  const allUploaded = mediaFiles.every(
    (f) => f.uploadStatus === "uploaded" && Boolean(f.downloadUrl),
  );
  return allUploaded ? "uploaded" : "pending";
}

function collectLocalMediaUris(
  result: ActivityResult,
): { videoUris: string[]; photoUris: string[]; hasAnalysis: boolean } {
  const videoUris: string[] = [];
  const photoUris: string[] = [];
  let hasAnalysis = false;

  result.prototypes.forEach((prototype) => {
    Object.entries(prototype.measurements).forEach(([key, value]) => {
      if (value === undefined || value === null || String(value).trim() === "") {
        return;
      }
      const text = String(value);
      if (key.toLowerCase().includes("video")) videoUris.push(text);
      if (key.toLowerCase().includes("photo")) photoUris.push(text);
      if (key.toLowerCase().includes("analysis")) hasAnalysis = true;
    });
  });

  return { videoUris, photoUris, hasAnalysis };
}

/** Merge a successful Storage upload into an in-memory evidence object. */
export function mergeEvidenceUpload(
  evidence: ActivityEvidenceFirestore,
  patch: EvidenceUploadPatch,
  uploadedAt: string,
): ActivityEvidenceFirestore {
  const id = evidenceFileId(patch.prototypeIndex, patch.measurementKey);
  const files = [...(evidence.files ?? [])];
  const index = files.findIndex((f) => f.id === id);
  const mediaType = inferMediaType(patch.measurementKey, patch.localUri);

  const updatedFile: MediaEvidenceFileFirestore = {
    id,
    prototypeIndex: patch.prototypeIndex,
    measurementKey: patch.measurementKey,
    mediaType,
    localUri: patch.localUri,
    storagePath: patch.storagePath,
    uploadStatus: "uploaded",
    downloadUrl: patch.downloadUrl,
    uploadedAt,
  };

  if (index >= 0) {
    files[index] = { ...files[index], ...updatedFile };
  } else {
    files.push(updatedFile);
  }

  const videoUris = files
    .filter((f) => f.mediaType === "video")
    .map((f) => f.downloadUrl ?? f.localUri);
  const photoUris = files
    .filter((f) => f.mediaType === "photo")
    .map((f) => f.downloadUrl ?? f.localUri);

  return {
    ...evidence,
    hasVideo: files.some((f) => f.mediaType === "video"),
    hasPhoto: files.some((f) => f.mediaType === "photo"),
    videoUris,
    photoUris,
    files,
    uploadStatus: resolveEvidenceUploadStatus(files),
  };
}

export function buildActivityEvidenceFirestore(
  result: ActivityResult,
  ownerUid: string,
): ActivityEvidenceFirestore {
  const refs = collectMediaEvidenceFromResult(result);
  const { videoUris, photoUris, hasAnalysis } = collectLocalMediaUris(result);

  const files: MediaEvidenceFileFirestore[] = refs.map((ref) => {
    const mediaType = inferMediaType(ref.measurementKey, ref.localUri);
    return {
      id: evidenceFileId(ref.prototypeIndex, ref.measurementKey),
      prototypeIndex: ref.prototypeIndex,
      measurementKey: ref.measurementKey,
      mediaType,
      localUri: ref.localUri,
      storagePath: buildMediaStoragePath(ref, ownerUid),
      uploadStatus: "pending",
    };
  });

  const uploadStatus = resolveEvidenceUploadStatus(files);

  return {
    hasGps: Boolean(result.location),
    hasVideo: videoUris.length > 0 || files.some((f) => f.mediaType === "video"),
    hasPhoto: photoUris.length > 0 || files.some((f) => f.mediaType === "photo"),
    hasAnalysis,
    videoUris,
    photoUris,
    files,
    ...(uploadStatus ? { uploadStatus } : {}),
  };
}

export function buildActivityFirestoreDoc(
  result: ActivityResult,
  ownerUid: string,
  updatedAt: string = new Date().toISOString(),
): ActivityFirestoreDoc {
  const challenge =
    getChallengeById(result.challengeId) ??
    ({ title: `Challenge ${result.challengeId}` } as { title: string });

  const activityTitle =
    result.activityTitle ?? challenge.title ?? `Challenge ${result.challengeId}`;
  const discriminator = result.discriminator ?? result.teamId;
  const yearLevel = result.yearLevel ?? "Unknown";
  const evidence = buildActivityEvidenceFirestore(result, ownerUid);
  const attempts = buildActivityAttempts(result);
  const points = result.points ?? 0;

  return {
    ownerUid,
    resultId: result.id,
    id: result.id,
    activityId: result.challengeId,
    challengeId: result.challengeId,
    activityTitle,
    teamId: result.teamId,
    teamName: result.teamName,
    discriminator,
    yearLevel,
    difficulty: result.difficulty,
    teamPrediction: result.prediction ?? "",
    prediction: result.prediction ?? "",
    attempts,
    prototypes: result.prototypes,
    derivedByPrototype: result.derivedByPrototype ?? {},
    rating: result.rating,
    comment: result.comment ?? "",
    reflection: result.reflection,
    completedInTime: result.completedInTime ?? true,
    leaderboardScore: points,
    points,
    location: result.location ?? null,
    gpsLat: result.location?.lat ?? null,
    gpsLng: result.location?.lng ?? null,
    evidence,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt ?? updatedAt,
  };
}
