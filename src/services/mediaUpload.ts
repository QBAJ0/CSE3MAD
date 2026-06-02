import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import * as FileSystem from "expo-file-system/legacy";
import { isFirebaseStorageReady, storage } from "@/src/firebase";

export type MediaUploadAttempt = {
  ok: true;
  downloadUrl: string;
} | {
  ok: false;
  reason: "storage_unavailable" | "file_missing" | "upload_failed";
};

export async function uploadLocalMediaToStorage(
  localUri: string,
  storagePath: string,
): Promise<MediaUploadAttempt> {
  if (!isFirebaseStorageReady || !storage) {
    return { ok: false, reason: "storage_unavailable" };
  }

  try {
    const info = await FileSystem.getInfoAsync(localUri);
    if (!info.exists) {
      return { ok: false, reason: "file_missing" };
    }

    const response = await fetch(localUri);
    if (!response.ok) {
      return { ok: false, reason: "upload_failed" };
    }

    const blob = await response.blob();
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    console.log("[storage:upload] ok", { storagePath });
    return { ok: true, downloadUrl };
  } catch (e) {
    console.warn("[storage:upload] fail", storagePath, e instanceof Error ? e.message : e);
    return { ok: false, reason: "upload_failed" };
  }
}
