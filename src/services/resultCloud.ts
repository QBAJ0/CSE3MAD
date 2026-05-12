import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db, isFirebaseConfigured } from "@/src/firebase";

export type SaveResultToFirestoreOutcome =
  | { ok: true; skipped: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; skipped: false; reason: string };

const COLLECTION = "activity_results";

/** Matches the local SQLite activity result row shape on the data branch. */
export type ActivityResultForCloud = {
  id: number;
  teamId: number;
  activityId: string;
  activityName: string;
  score: number;
  sensorValue: number | null;
  notes: string | null;
  createdAt: string;
};

export async function saveResultToFirestore(
  result: ActivityResultForCloud,
): Promise<SaveResultToFirestoreOutcome> {
  if (!isFirebaseConfigured || !db) {
    return {
      ok: true,
      skipped: true,
      reason: "firebase_not_configured",
    };
  }

  try {
    const payload: Record<string, unknown> = {
      localResultId: result.id,
      teamId: result.teamId,
      activityId: result.activityId,
      activityName: result.activityName,
      score: result.score,
      createdAt: result.createdAt,
      savedAt: serverTimestamp(),
    };

    if (result.sensorValue !== null && result.sensorValue !== undefined) {
      payload.sensorValue = result.sensorValue;
    }
    if (result.notes !== null && result.notes !== undefined && result.notes !== "") {
      payload.notes = result.notes;
    }

    await addDoc(collection(db, COLLECTION), payload);
    return { ok: true, skipped: false };
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return { ok: false, skipped: false, reason };
  }
}
