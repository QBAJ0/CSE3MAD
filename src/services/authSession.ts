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
    const signIn = signInAnonymously(auth).then(() => undefined);
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Firebase auth timed out")), 12_000);
    });

    ensurePromise = Promise.race([signIn, timeout]).catch((e) => {
      ensurePromise = null;
      console.warn("[authSession] anonymous sign-in failed:", e);
    });
  }

  await ensurePromise;
}
