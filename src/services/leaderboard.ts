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
import { buildActivityFirestoreDoc } from "./activityFirestore";
import {
  buildLeaderboardFirestoreDoc,
  LeaderboardFirestoreDoc,
} from "./leaderboardFirestore";
import { ActivityResult, LeaderboardEntry, TeamData } from "../types";

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

/** @deprecated Use LeaderboardFirestoreDoc */
export type LeaderboardCloudDoc = LeaderboardFirestoreDoc;

function currentOwnerUid(): string | null {
  return auth?.currentUser?.uid ?? null;
}

function cloudDocToEntry(
  docId: string,
  data: LeaderboardFirestoreDoc,
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

export async function fetchLeaderboardFromCloud(
  cutoff: Date | null,
): Promise<LeaderboardEntry[]> {
  const uid = currentOwnerUid();

  if (!db) {
    console.warn("[firestore:leaderboard] fetch skipped — not configured");
    return [];
  }

  if (!uid) {
    console.warn("[firestore:leaderboard] fetch skipped — not signed in");
    return [];
  }

  try {
    const q = query(collection(db, COLLECTION), orderBy("totalPoints", "desc"));
    const snap = await getDocs(q);
    const entries: Omit<LeaderboardEntry, "rank">[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as LeaderboardFirestoreDoc;
      const entry = cloudDocToEntry(docSnap.id, data);

      if (cutoff && entry.lastActive) {
        if (new Date(entry.lastActive) < cutoff) {
          return;
        }
      }

      entries.push(entry);
    });

    const ranked = rankEntries(entries);
    console.log("[firestore:leaderboard] fetch ok", { teams: ranked.length });
    return ranked;
  } catch (e) {
    console.warn("[firestore:leaderboard] fetch fail", e);
    return [];
  }
}

export async function pushResultToCloud(result: ActivityResult): Promise<boolean> {
  const ownerUid = currentOwnerUid();
  const path = `${COLLECTION}/${result.teamId}`;

  if (!db || !ownerUid) {
    console.warn("[firestore:leaderboard] write fail — not configured or signed in", {
      path,
      resultId: result.id,
    });
    return false;
  }

  try {
    const teamRef = doc(db, COLLECTION, result.teamId);
    const snap = await getDoc(teamRef);
    const existing = snap.exists()
      ? (snap.data() as LeaderboardFirestoreDoc)
      : undefined;

    const docPayload = buildLeaderboardFirestoreDoc(
      result,
      ownerUid,
      existing,
    );

    await setDoc(teamRef, docPayload);
    console.log("[firestore:leaderboard] write ok", {
      path,
      resultId: result.id,
      totalPoints: docPayload.totalPoints,
    });
    return true;
  } catch (e) {
    console.warn("[firestore:leaderboard] write fail", {
      path,
      resultId: result.id,
      reason: classifyError(e),
      error: e,
    });
    return false;
  }
}

const TEAMS_COLLECTION = "teams";

export async function saveTeamToCloud(team: TeamData): Promise<void> {
  if (!db) return;
  const uid = currentOwnerUid();
  if (!uid) return;
  try {
    await setDoc(doc(db, TEAMS_COLLECTION, team.discriminator), {
      teamName: team.teamName,
      discriminator: team.discriminator,
      members: team.members,
      createdAt: team.createdAt,
      ownerUid: uid,
    });
    console.log("[firestore:team] save ok", team.discriminator);
  } catch (e) {
    console.warn("[firestore:team] save fail", e);
  }
}

export async function lookupTeamFromCloud(
  teamName: string,
  discriminator: string,
): Promise<TeamData | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, TEAMS_COLLECTION, discriminator));
    if (!snap.exists()) return null;
    const data = snap.data() as {
      teamName: string;
      discriminator: string;
      members: TeamData["members"];
      createdAt: string;
    };
    if (data.teamName.trim().toLowerCase() !== teamName.trim().toLowerCase()) return null;
    return {
      teamName: data.teamName,
      discriminator: data.discriminator,
      members: data.members ?? [],
      createdAt: data.createdAt,
      totalPoints: 0,
      completedChallenges: [],
    };
  } catch (e) {
    console.warn("[firestore:team] lookup fail", e);
    return null;
  }
}

export async function pushActivityToCloud(result: ActivityResult): Promise<boolean> {
  const ownerUid = currentOwnerUid();
  const path = `activities/${result.id}`;

  if (!db || !ownerUid) {
    console.warn("[firestore:activity] write fail — not configured or signed in", {
      path,
      resultId: result.id,
    });
    return false;
  }

  try {
    const updatedAt = new Date().toISOString();
    const firestoreDoc = buildActivityFirestoreDoc(result, ownerUid, updatedAt);
    await setDoc(doc(db, "activities", result.id), firestoreDoc);
    console.log("[firestore:activity] write ok", {
      path,
      resultId: result.id,
      challengeId: result.challengeId,
      ownerUid,
      evidencePending: firestoreDoc.evidence.files.length,
    });
    return true;
  } catch (e) {
    console.warn("[firestore:activity] write fail", {
      path,
      resultId: result.id,
      reason: classifyError(e),
      error: e,
    });
    return false;
  }
}
