import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/src/firebase";
import { ActivityResult, LeaderboardEntry } from "../types";

type SyncFailReason = "offline" | "permission" | "unknown";

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

/** Shape stored at leaderboard/{teamId} in Firestore. */
export type LeaderboardCloudDoc = {
  ownerUid: string;
  teamId: string;
  teamName: string;
  discriminator: string;
  totalPoints: number;
  challengesCompleted: number;
  ratingSum?: number;
  ratingCount?: number;
  lastActive: string;
  updatedAt: string;
};

function currentOwnerUid(): string | null {
  return auth?.currentUser?.uid ?? null;
}

function cloudDocToEntry(
  docId: string,
  data: LeaderboardCloudDoc,
): Omit<LeaderboardEntry, "rank"> {
  const ratingCount = data.ratingCount ?? 0;
  const ratingSum = data.ratingSum ?? 0;
  return {
    teamName: data.teamName,
    discriminator: data.discriminator ?? data.teamId ?? docId,
    totalPoints: data.totalPoints ?? 0,
    challengesCompleted: data.challengesCompleted ?? 0,
    averageRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
    lastActive: data.lastActive ?? data.updatedAt ?? "",
  };
}

function rankEntries(entries: Omit<LeaderboardEntry, "rank">[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

/**
 * Reads the full leaderboard collection (all teams). Rules: any authenticated user.
 * Does not filter by ownerUid.
 */
export async function fetchLeaderboardFromCloud(
  cutoff: Date | null,
): Promise<LeaderboardEntry[]> {
  const uid = currentOwnerUid();
  console.log("[leaderboard:fetch] start", {
    currentUid: uid,
    collection: COLLECTION,
    cutoff: cutoff?.toISOString() ?? null,
  });

  if (!db) {
    console.warn("[leaderboard:fetch] skipped — Firestore not configured");
    return [];
  }

  if (!uid) {
    console.warn("[leaderboard:fetch] skipped — no auth.currentUser");
    return [];
  }

  try {
    const q = query(collection(db, COLLECTION), orderBy("totalPoints", "desc"));
    const snap = await getDocs(q);
    console.log("[leaderboard:fetch] docs fetched", {
      currentUid: uid,
      count: snap.size,
    });

    const entries: Omit<LeaderboardEntry, "rank">[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as LeaderboardCloudDoc;
      const entry = cloudDocToEntry(docSnap.id, data);

      if (cutoff && entry.lastActive) {
        if (new Date(entry.lastActive) < cutoff) {
          return;
        }
      }

      console.log("[leaderboard:fetch] team", {
        docId: docSnap.id,
        teamId: data.teamId ?? docSnap.id,
        teamName: entry.teamName,
        score: entry.totalPoints,
        ownerUid: data.ownerUid,
      });

      entries.push(entry);
    });

    const ranked = rankEntries(entries);
    console.log("[leaderboard:fetch] done", {
      currentUid: uid,
      returnedTeams: ranked.length,
    });
    return ranked;
  } catch (e) {
    console.warn("[leaderboard:fetch] failed", { currentUid: uid, error: e });
    return [];
  }
}

function logWriteStart(args: {
  op: string;
  path: string;
  ownerUid: string | null;
  resultId?: string;
  teamId?: string;
  activityId?: string;
}) {
  console.log("[firestore:write:start]", args);
}

function logWriteEnd(args: {
  op: string;
  path: string;
  ok: boolean;
  ownerUid: string | null;
  error?: unknown;
}) {
  if (args.ok) {
    console.log("[firestore:write:ok]", args);
    return;
  }
  console.warn("[firestore:write:fail]", args);
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

export async function pushResultToCloud(result: ActivityResult): Promise<boolean> {
  const ownerUid = currentOwnerUid();
  const path = `${COLLECTION}/${result.teamId}`;
  logWriteStart({
    op: "pushResultToCloud",
    path,
    ownerUid,
    resultId: result.id,
    teamId: result.teamId,
  });
  if (!db || !ownerUid) {
    logWriteEnd({
      op: "pushResultToCloud",
      path,
      ok: false,
      ownerUid,
      error: "missing db or auth.currentUser",
    });
    return false;
  }
  try {
    const teamRef = doc(db, COLLECTION, result.teamId);
    const snap = await getDoc(teamRef);

    const updatedAt = new Date().toISOString();
    const baseFields = {
      ownerUid,
      teamId: result.teamId,
      teamName: result.teamName,
      discriminator: result.teamId,
      updatedAt,
    };

    if (snap.exists()) {
      const existing = snap.data();
      await setDoc(teamRef, {
        ...baseFields,
        totalPoints: (existing.totalPoints || 0) + (result.points || 0),
        challengesCompleted: (existing.challengesCompleted || 0) + 1,
        ratingSum: (existing.ratingSum || 0) + result.rating,
        ratingCount: (existing.ratingCount || 0) + 1,
        lastActive: result.createdAt,
      });
    } else {
      await setDoc(teamRef, {
        ...baseFields,
        totalPoints: result.points || 0,
        challengesCompleted: 1,
        ratingSum: result.rating,
        ratingCount: 1,
        lastActive: result.createdAt,
      });
    }
    logWriteEnd({
      op: "pushResultToCloud",
      path,
      ok: true,
      ownerUid,
    });
    return true;
  } catch (e) {
    logWriteEnd({
      op: "pushResultToCloud",
      path,
      ok: false,
      ownerUid,
      error: e,
    });
    console.warn(`[leaderboard] pushResultToCloud (${classifyError(e)}):`, e);
    return false;
  }
}

// Saves the full activity result (including GPS location) to the
// "activities" collection so teachers can query per-submission data.
export async function pushActivityToCloud(result: ActivityResult): Promise<boolean> {
  const ownerUid = currentOwnerUid();
  const path = `activities/${result.id}`;
  logWriteStart({
    op: "pushActivityToCloud",
    path,
    ownerUid,
    resultId: result.id,
    teamId: result.teamId,
    activityId: result.id,
  });
  if (!db || !ownerUid) {
    logWriteEnd({
      op: "pushActivityToCloud",
      path,
      ok: false,
      ownerUid,
      error: "missing db or auth.currentUser",
    });
    return false;
  }
  try {
    const evidence = summarizeEvidence(result);
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
      createdAt: result.createdAt,
    });
    logWriteEnd({
      op: "pushActivityToCloud",
      path,
      ok: true,
      ownerUid,
    });
    return true;
  } catch (e) {
    logWriteEnd({
      op: "pushActivityToCloud",
      path,
      ok: false,
      ownerUid,
      error: e,
    });
    console.warn(`[leaderboard] pushActivityToCloud (${classifyError(e)}):`, e);
    return false;
  }
}

