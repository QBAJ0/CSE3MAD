import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/src/firebase";
import { ensureFirebaseAuth } from "./authSession";
import { STORAGE_KEYS } from "@/src/utils/storage";
import { ActivityResult } from "../types";
import {
  enqueueMediaUploadsForResult,
  processPendingMediaUploads,
} from "./mediaUploadQueue";
import {
  pushActivityToCloud,
  pushResultToCloud,
} from "./leaderboard";

export type PendingChallengeCloudSync = {
  resultId: string;
  result: ActivityResult;
  leaderboardOk: boolean;
  activityOk: boolean;
  queuedAt: string;
};

async function readQueue(): Promise<PendingChallengeCloudSync[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CLOUD_SYNC);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingChallengeCloudSync[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("[challengeCloudSync] readQueue failed:", e);
    return [];
  }
}

async function writeQueue(queue: PendingChallengeCloudSync[]): Promise<void> {
  try {
    if (queue.length === 0) {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_CLOUD_SYNC);
      return;
    }
    await AsyncStorage.setItem(
      STORAGE_KEYS.PENDING_CLOUD_SYNC,
      JSON.stringify(queue),
    );
  } catch (e) {
    console.warn("[challengeCloudSync] writeQueue failed:", e);
  }
}

async function activitySubmissionExists(resultId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const snap = await getDoc(doc(db, "activities", resultId));
    return snap.exists();
  } catch {
    return false;
  }
}

async function enqueueOrUpdate(
  result: ActivityResult,
  leaderboardOk: boolean,
  activityOk: boolean,
): Promise<void> {
  if (leaderboardOk && activityOk) return;

  const queue = await readQueue();
  const index = queue.findIndex((item) => item.resultId === result.id);

  if (index >= 0) {
    const existing = queue[index];
    queue[index] = {
      ...existing,
      result,
      leaderboardOk: existing.leaderboardOk || leaderboardOk,
      activityOk: existing.activityOk || activityOk,
    };
  } else {
    queue.push({
      resultId: result.id,
      result,
      leaderboardOk,
      activityOk,
      queuedAt: new Date().toISOString(),
    });
  }

  await writeQueue(
    queue.filter((item) => !item.leaderboardOk || !item.activityOk),
  );
}

export type CloudSyncResult = {
  activityOk: boolean;
  leaderboardOk: boolean;
  queued: boolean;
};

export async function syncChallengeResultToCloud(
  result: ActivityResult,
): Promise<CloudSyncResult> {
  if (!isFirebaseConfigured || !db) {
    console.warn("[firestore:sync] skipped — Firebase not configured", {
      resultId: result.id,
    });
    return { activityOk: false, leaderboardOk: false, queued: false };
  }

  try {
    await ensureFirebaseAuth();
  } catch {
    console.warn("[firestore:sync] auth fail — queued for retry", {
      resultId: result.id,
    });
    await enqueueOrUpdate(result, false, false);
    return { activityOk: false, leaderboardOk: false, queued: true };
  }

  const leaderboardOk = await pushResultToCloud(result);
  let activityOk = await pushActivityToCloud(result);

  if (!activityOk && (await activitySubmissionExists(result.id))) {
    activityOk = true;
  }

  const queued = !leaderboardOk || !activityOk;
  if (queued) {
    await enqueueOrUpdate(result, leaderboardOk, activityOk);
  }

  if (activityOk) {
    const enqueued = await enqueueMediaUploadsForResult(result);
    if (enqueued > 0) {
      void processPendingMediaUploads().catch((e) => {
        console.warn("[firestore:sync] media upload pass failed", {
          resultId: result.id,
          error: e,
        });
      });
    }
  }

  if (activityOk && leaderboardOk) {
    console.log("[firestore:sync] ok", {
      resultId: result.id,
      teamId: result.teamId,
    });
  } else {
    console.warn("[firestore:sync] partial — queued for retry", {
      resultId: result.id,
      activityOk,
      leaderboardOk,
    });
  }

  return { activityOk, leaderboardOk, queued };
}

export async function processPendingChallengeCloudSync(): Promise<{
  attempted: number;
  cleared: number;
}> {
  if (!isFirebaseConfigured || !db) {
    return { attempted: 0, cleared: 0 };
  }

  const queue = await readQueue();
  if (queue.length === 0) {
    return { attempted: 0, cleared: 0 };
  }

  const remaining: PendingChallengeCloudSync[] = [];

  for (const item of queue) {
    let leaderboardOk = item.leaderboardOk;
    let activityOk = item.activityOk;

    if (!activityOk && (await activitySubmissionExists(item.resultId))) {
      activityOk = true;
    }

    if (!leaderboardOk) {
      leaderboardOk = await pushResultToCloud(item.result);
    }
    if (!activityOk) {
      activityOk = await pushActivityToCloud(item.result);
    }

    if (!leaderboardOk || !activityOk) {
      remaining.push({
        ...item,
        result: item.result,
        leaderboardOk,
        activityOk,
      });
    }
  }

  await writeQueue(remaining);

  return {
    attempted: queue.length,
    cleared: queue.length - remaining.length,
  };
}

export async function getPendingChallengeCloudSyncCount(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}
