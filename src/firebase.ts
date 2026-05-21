import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { readFirebaseConfig } from "@/src/config/env";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let cloudStorage: FirebaseStorage | null = null;

const config = readFirebaseConfig();

if (config) {
  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  cloudStorage = getStorage(app);
}

export { app, auth, cloudStorage, db };
export const isFirebaseConfigured = config !== null;
