import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { ActivityResult, LeaderboardEntry } from "../types";
import { db } from "./firebase";

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

export async function pushResultToCloud(result: ActivityResult): Promise<void> {
  if (!db) return;
  try {
    const teamRef = doc(db, COLLECTION, result.teamId);
    const snap = await getDoc(teamRef);

    if (snap.exists()) {
      const existing = snap.data();
      await setDoc(teamRef, {
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
        teamName: result.teamName,
        discriminator: result.teamId,
        totalPoints: result.points || 0,
        challengesCompleted: 1,
        ratingSum: result.rating,
        ratingCount: 1,
        lastActive: result.createdAt,
      });
    }
  } catch (e) {
    console.warn("Leaderboard cloud sync failed (offline?):", e);
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
    console.warn("Leaderboard cloud fetch failed (offline?):", e);
    return [];
  }
}
