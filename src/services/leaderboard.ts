import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, cloudStorage, db } from "@/src/firebase";
import { ActivityResult, Comment, LeaderboardEntry } from "../types";

export type SyncFailReason = "offline" | "permission" | "unknown";

export class CloudSyncError extends Error {
  constructor(public readonly reason: SyncFailReason, cause?: unknown) {
    super(`Cloud sync failed: ${reason}`);
    this.name = "CloudSyncError";
    if (cause instanceof Error) this.stack = cause.stack;
  }
}

function classifyError(e: unknown): SyncFailReason {
  if (e && typeof e === "object" && "code" in e) {
    const code = (e as { code: string }).code;
    if (code === "unavailable" || code === "deadline-exceeded") return "offline";
    if (code === "permission-denied" || code === "unauthenticated") return "permission";
  }
  return "unknown";
}

export function buildLocalLeaderboard(
  activities: ActivityResult[],
  cutoff: Date | null,
): LeaderboardEntry[] {
  const filtered = cutoff
    ? activities.filter((a) => new Date(a.createdAt) >= cutoff)
    : activities;

  const teamMap = new Map<
    string,
    {
      teamName: string;
      discriminator: string;
      totalPoints: number;
      challengesCompleted: number;
      ratingSum: number;
      ratingCount: number;
      lastActive: string;
    }
  >();

  filtered.forEach((a) => {
    const key = `${a.teamName}_${a.teamId}`;
    const existing = teamMap.get(key);
    if (existing) {
      existing.totalPoints += a.points || 0;
      existing.challengesCompleted++;
      existing.ratingSum += a.rating;
      existing.ratingCount++;
      if (new Date(a.createdAt) > new Date(existing.lastActive))
        existing.lastActive = a.createdAt;
    } else {
      teamMap.set(key, {
        teamName: a.teamName,
        discriminator: a.teamId,
        totalPoints: a.points || 0,
        challengesCompleted: 1,
        ratingSum: a.rating,
        ratingCount: 1,
        lastActive: a.createdAt,
      });
    }
  });

  return Array.from(teamMap.values())
    .map((e) => ({
      teamName: e.teamName,
      discriminator: e.discriminator,
      totalPoints: e.totalPoints,
      challengesCompleted: e.challengesCompleted,
      averageRating: e.ratingCount > 0 ? e.ratingSum / e.ratingCount : 0,
      lastActive: e.lastActive,
      rank: 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

const COLLECTION = "leaderboard";

function currentOwnerUid(): string | null {
  return auth?.currentUser?.uid ?? null;
}

function summarizeEvidence(result: ActivityResult) {
  const videoUris: string[] = [];
  const photoUris: string[] = [];
  const analysisFlags: string[] = [];

  result.prototypes.forEach((prototype) => {
    Object.entries(prototype.measurements).forEach(([key, value]) => {
      if (value === undefined || value === null || String(value).trim() === "") {
        return;
      }
      if (key.toLowerCase().includes("video")) videoUris.push(String(value));
      if (key.toLowerCase().includes("photo")) photoUris.push(String(value));
      if (key.toLowerCase().includes("analysis")) analysisFlags.push(String(value));
    });
  });

  return {
    hasGps: Boolean(result.location),
    hasVideo: videoUris.length > 0,
    hasPhoto: photoUris.length > 0,
    hasAnalysis: analysisFlags.length > 0,
    videoUris,
    photoUris,
  };
}

function isEvidenceKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return normalized.includes("video") || normalized.includes("photo");
}

function extensionFromUri(uri: string): string {
  const withoutQuery = uri.split("?")[0] ?? uri;
  const match = withoutQuery.match(/\.([a-zA-Z0-9]+)$/);
  return match ? `.${match[1].toLowerCase()}` : "";
}

async function uploadEvidenceFiles(result: ActivityResult, ownerUid: string) {
  if (!cloudStorage) return [];

  const uploads: {
    prototypeIndex: number;
    key: string;
    localUri: string;
    downloadUrl: string;
  }[] = [];

  for (const prototype of result.prototypes) {
    for (const [key, value] of Object.entries(prototype.measurements)) {
      if (!isEvidenceKey(key) || typeof value !== "string" || value.trim() === "") {
        continue;
      }

      try {
        const response = await fetch(value);
        const blob = await response.blob();
        const fileRef = ref(
          cloudStorage,
          `activity-evidence/${ownerUid}/${result.id}/prototype-${prototype.index}-${key}${extensionFromUri(value)}`,
        );
        await uploadBytes(fileRef, blob);
        uploads.push({
          prototypeIndex: prototype.index,
          key,
          localUri: value,
          downloadUrl: await getDownloadURL(fileRef),
        });
      } catch (e) {
        console.warn(`[leaderboard] uploadEvidenceFiles (${classifyError(e)}):`, e);
      }
    }
  }

  return uploads;
}

export async function pushResultToCloud(result: ActivityResult): Promise<boolean> {
  const ownerUid = currentOwnerUid();
  if (!db || !ownerUid) return false;
  try {
    const teamRef = doc(db, COLLECTION, result.teamId);
    const snap = await getDoc(teamRef);

    if (snap.exists()) {
      const existing = snap.data();
      await setDoc(teamRef, {
        ownerUid,
        teamName: result.teamName,
        discriminator: result.teamId,
        totalPoints: (existing.totalPoints || 0) + (result.points || 0),
        challengesCompleted: (existing.challengesCompleted || 0) + 1,
        ratingSum: (existing.ratingSum || 0) + result.rating,
        ratingCount: (existing.ratingCount || 0) + 1,
        lastActive: result.createdAt,
      });
    } else {
      await setDoc(teamRef, {
        ownerUid,
        teamName: result.teamName,
        discriminator: result.teamId,
        totalPoints: result.points || 0,
        challengesCompleted: 1,
        ratingSum: result.rating,
        ratingCount: 1,
        lastActive: result.createdAt,
      });
    }
    return true;
  } catch (e) {
    console.warn(`[leaderboard] pushResultToCloud (${classifyError(e)}):`, e);
    return false;
  }
}

// Saves the full activity result (including GPS location) to the
// "activities" collection so teachers can query per-submission data.
export async function pushActivityToCloud(result: ActivityResult): Promise<boolean> {
  const ownerUid = currentOwnerUid();
  if (!db || !ownerUid) return false;
  try {
    const evidence = summarizeEvidence(result);
    const uploadedEvidence = await uploadEvidenceFiles(result, ownerUid);
    await setDoc(doc(db, "activities", result.id), {
      ownerUid,
      id: result.id,
      challengeId: result.challengeId,
      teamId: result.teamId,
      teamName: result.teamName,
      difficulty: result.difficulty,
      prediction: result.prediction,
      prototypes: result.prototypes,
      derivedByPrototype: result.derivedByPrototype ?? {},
      points: result.points ?? 0,
      rating: result.rating,
      reflection: result.reflection,
      completedInTime: result.completedInTime ?? true,
      location: result.location ?? null,
      evidence,
      uploadedEvidence,
      createdAt: result.createdAt,
    });
    return true;
  } catch (e) {
    console.warn(`[leaderboard] pushActivityToCloud (${classifyError(e)}):`, e);
    return false;
  }
}

export async function fetchActivitiesByChallenge(
  challengeId: number,
): Promise<Pick<ActivityResult, "id" | "teamName" | "teamId" | "rating" | "reflection" | "createdAt">[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "activities"),
      where("challengeId", "==", challengeId),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: data.id,
        teamName: data.teamName,
        teamId: data.teamId,
        rating: data.rating ?? 0,
        reflection: data.reflection ?? "",
        createdAt: data.createdAt,
      };
    });
  } catch (e) {
    throw new CloudSyncError(classifyError(e), e);
  }
}

export async function postComment(
  comment: Omit<Comment, "id">,
): Promise<boolean> {
  const ownerUid = currentOwnerUid();
  if (!db || !ownerUid) return false;
  try {
    await addDoc(collection(db, "comments"), { ...comment, ownerUid });
    return true;
  } catch (e) {
    console.warn(`[leaderboard] postComment (${classifyError(e)}):`, e);
    return false;
  }
}

export async function fetchComments(challengeId: number): Promise<Comment[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "comments"),
      where("challengeId", "==", challengeId),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
  } catch (e) {
    throw new CloudSyncError(classifyError(e), e);
  }
}

export async function fetchCloudLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    const entries = snap.docs.map((d) => {
      const data = d.data();
      return {
        teamName: data.teamName,
        discriminator: data.discriminator,
        totalPoints: data.totalPoints || 0,
        challengesCompleted: data.challengesCompleted || 0,
        averageRating:
          data.ratingCount > 0 ? data.ratingSum / data.ratingCount : 0,
        lastActive: data.lastActive || "",
        rank: 0,
      } as LeaderboardEntry;
    });

    return entries
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  } catch (e) {
    throw new CloudSyncError(classifyError(e), e);
  }
}
