import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/src/firebase";
import { ActivityResult } from "../types";
import { ensureFirebaseAuth } from "./authSession";
import { STORAGE_KEYS } from "../utils/storage";
import {
  buildMediaStoragePath,
  collectMediaEvidenceFromResult,
  MediaEvidenceRef,
} from "./mediaEvidence";
import { patchActivityEvidenceAfterUpload } from "./activityFirestorePatch";
import { uploadLocalMediaToStorage } from "./mediaUpload";
import { checkBatteryGuard } from "../utils/batteryGuard";

export type PendingMediaUpload = {
  id: string;
  resultId: string;
  challengeId: number;
  teamId: string;
  prototypeIndex: number;
  measurementKey: string;
  localUri: string;
  downloadUrl?: string;
  attempts: number;
  queuedAt: string;
};

const MAX_ATTEMPTS = 5;
const DEFAULT_CONCURRENCY = 2;

/** Prevents two concurrent processPendingMediaUploads calls from running at the same time. */
let _isProcessing = false;
/** Tracks IDs of items currently being uploaded within an active processor run. */
const _inFlight = new Set<string>();

async function readQueue(): Promise<PendingMediaUpload[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_MEDIA_UPLOAD);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingMediaUpload[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("[mediaUploadQueue] readQueue failed:", e);
    return [];
  }
}

async function writeQueue(queue: PendingMediaUpload[]): Promise<void> {
  try {
    if (queue.length === 0) {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_MEDIA_UPLOAD);
      return;
    }
    await AsyncStorage.setItem(
      STORAGE_KEYS.PENDING_MEDIA_UPLOAD,
      JSON.stringify(queue),
    );
  } catch (e) {
    console.warn("[mediaUploadQueue] writeQueue failed:", e);
  }
}

function queueItemId(ref: MediaEvidenceRef): string {
  return `${ref.resultId}:${ref.prototypeIndex}:${ref.measurementKey}`;
}

function toQueueItem(ref: MediaEvidenceRef): PendingMediaUpload {
  return {
    id: queueItemId(ref),
    resultId: ref.resultId,
    challengeId: ref.challengeId,
    teamId: ref.teamId,
    prototypeIndex: ref.prototypeIndex,
    measurementKey: ref.measurementKey,
    localUri: ref.localUri,
    attempts: 0,
    queuedAt: new Date().toISOString(),
  };
}

export async function enqueueMediaUploadsForResult(
  result: ActivityResult,
): Promise<number> {
  const evidence = collectMediaEvidenceFromResult(result);
  if (evidence.length === 0) return 0;

  const queue = await readQueue();
  const byId = new Map(queue.map((item) => [item.id, item]));
  let added = 0;

  for (const ref of evidence) {
    const id = queueItemId(ref);
    const existing = byId.get(id);
    if (existing?.downloadUrl) continue;

    if (existing) {
      if (existing.localUri !== ref.localUri) {
        byId.set(id, { ...toQueueItem(ref), attempts: 0 });
        added++;
      }
      continue;
    }

    byId.set(id, toQueueItem(ref));
    added++;
  }

  await writeQueue(Array.from(byId.values()));
  return added;
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  let index = 0;
  const poolSize = Math.min(Math.max(1, limit), items.length);

  await Promise.all(
    Array.from({ length: poolSize }, async () => {
      while (index < items.length) {
        const current = items[index];
        index += 1;
        await worker(current);
      }
    }),
  );
}

export async function processPendingMediaUploads(options?: {
  concurrency?: number;
}): Promise<{ attempted: number; completed: number; remaining: number }> {
  if (_isProcessing) {
    return { attempted: 0, completed: 0, remaining: 0 };
  }
  _isProcessing = true;

  try {
    const queue = await readQueue();
    const pending = queue.filter((item) => !item.downloadUrl);
    if (pending.length === 0) {
      return { attempted: 0, completed: 0, remaining: 0 };
    }

    const batteryCheck = await checkBatteryGuard();
    if (batteryCheck.defer) {
      const pct =
        batteryCheck.batteryLevel !== null
          ? `${Math.round(batteryCheck.batteryLevel * 100)}%`
          : "unknown";
      console.log("[mediaUploadQueue] deferred — battery constraint", {
        reason: batteryCheck.reason,
        batteryLevel: pct,
        queued: pending.length,
      });
      return { attempted: 0, completed: 0, remaining: pending.length };
    }

    try {
      await ensureFirebaseAuth();
    } catch {
      return { attempted: 0, completed: 0, remaining: pending.length };
    }

    const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;
    const outcomes = new Map<string, PendingMediaUpload>();

    for (const item of queue) {
      outcomes.set(item.id, item);
    }

    await runWithConcurrency(pending, concurrency, async (item) => {
      if (_inFlight.has(item.id)) {
        return;
      }
      _inFlight.add(item.id);

      try {
        const ownerUid = auth?.currentUser?.uid;
        if (!ownerUid) {
          outcomes.set(item.id, item);
          return;
        }

        const current = outcomes.get(item.id) ?? item;

        const storagePath = buildMediaStoragePath(
          {
            resultId: item.resultId,
            challengeId: item.challengeId,
            teamId: item.teamId,
            prototypeIndex: item.prototypeIndex,
            measurementKey: item.measurementKey,
            localUri: item.localUri,
          },
          ownerUid,
        );
        const attempt = await uploadLocalMediaToStorage(item.localUri, storagePath);

        if (attempt.ok) {
          const patched = await patchActivityEvidenceAfterUpload(item.resultId, {
            prototypeIndex: item.prototypeIndex,
            measurementKey: item.measurementKey,
            localUri: item.localUri,
            downloadUrl: attempt.downloadUrl,
            storagePath,
          });
          if (!patched) {
            console.warn("[mediaUploadQueue] Firestore patch failed, keeping downloadUrl in queue", { id: item.id });
            outcomes.set(item.id, {
              ...current,
              downloadUrl: attempt.downloadUrl,
              attempts: current.attempts,
            });
            return;
          }
          outcomes.delete(item.id);
          return;
        }

        if (attempt.reason === "storage_unavailable") {
          console.warn("[mediaUploadQueue] storage unavailable, deferring", { id: item.id });
          outcomes.set(item.id, current);
          return;
        }

        if (attempt.reason === "file_missing") {
          console.warn("[mediaUploadQueue] drop file_missing", { id: item.id, localUri: item.localUri });
          outcomes.delete(item.id);
          return;
        }

        const nextAttempts = current.attempts + 1;
        if (nextAttempts >= MAX_ATTEMPTS) {
          console.warn("[mediaUploadQueue] drop after max attempts", { id: item.id, attempts: nextAttempts });
          outcomes.delete(item.id);
          return;
        }

        console.warn("[mediaUploadQueue] upload failed, will retry", { id: item.id, nextAttempts });
        outcomes.set(item.id, {
          ...current,
          attempts: nextAttempts,
        });
      } finally {
        _inFlight.delete(item.id);
      }
    });

    const nextQueue = Array.from(outcomes.values()).filter(
      (item) => !item.downloadUrl,
    );
    const completed = pending.length - nextQueue.length;
    await writeQueue(nextQueue);

    return {
      attempted: pending.length,
      completed,
      remaining: nextQueue.length,
    };
  } finally {
    _isProcessing = false;
  }
}

export async function getPendingMediaUploadCount(): Promise<number> {
  const queue = await readQueue();
  return queue.filter((item) => !item.downloadUrl).length;
}

/** @internal Only for use in tests — resets module-level processing state. */
export function _resetInternalStateForTests(): void {
  _isProcessing = false;
  _inFlight.clear();
}
