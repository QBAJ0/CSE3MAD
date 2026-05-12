import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/src/firebase";

export async function registerWithEmail(
  email: string,
  password: string,
): Promise<User> {
  if (!auth) throw new Error("Firebase is not configured. Add a .env file.");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  if (!auth) throw new Error("Firebase is not configured. Add a .env file.");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}
