import { signInAnonymously } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/src/firebase";

let ensurePromise: Promise<void> | null = null;

/**
 * Ensures a Firebase Auth user exists for Firestore/Storage rules that require ownerUid.
 * Uses anonymous sign-in so students are not prompted for email/password during onboarding.
 */
export async function ensureFirebaseAuth(): Promise<void> {
  if (!isFirebaseConfigured || !auth) return;

  if (auth.currentUser) return;

  if (!ensurePromise) {
    ensurePromise = signInAnonymously(auth)
      .then(() => undefined)
      .catch((e) => {
        ensurePromise = null;
        console.warn("[authSession] anonymous sign-in failed:", e);
        throw e;
      });
  }

  await ensurePromise;
}
