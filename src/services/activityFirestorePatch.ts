import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/src/firebase";
import {
  type ActivityFirestoreDoc,
  type EvidenceUploadPatch,
  mergeEvidenceUpload,
} from "./activityFirestore";

export type { EvidenceUploadPatch } from "./activityFirestore";

/** Writes download URL + upload status back to `activities/{resultId}.evidence` only. */
export async function patchActivityEvidenceAfterUpload(
  resultId: string,
  patch: EvidenceUploadPatch,
): Promise<boolean> {
  if (!db) {
    console.warn("[firestore:evidence] skipped — Firestore not configured");
    return false;
  }

  const path = `activities/${resultId}`;
  try {
    const ref = doc(db, "activities", resultId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.warn("[firestore:evidence] fail — activity doc missing", { path });
      return false;
    }

    const data = snap.data() as ActivityFirestoreDoc;
    const uploadedAt = patch.uploadedAt ?? new Date().toISOString();
    const evidence = mergeEvidenceUpload(data.evidence, patch, uploadedAt);

    await setDoc(
      ref,
      {
        evidence,
        updatedAt: uploadedAt,
      },
      { merge: true },
    );

    console.log("[firestore:evidence] ok", {
      path,
      uploadStatus: evidence.uploadStatus,
      measurementKey: patch.measurementKey,
    });
    return true;
  } catch (e) {
    console.warn("[firestore:evidence] fail", { path, error: e });
    return false;
  }
}
