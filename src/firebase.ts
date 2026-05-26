import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { Platform } from "react-native";
import { readFirebaseConfig } from "@/src/config/env";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let cloudStorage: FirebaseStorage | null = null;

const config = readFirebaseConfig();

if (config) {
  app = getApps().length ? getApp() : initializeApp(config);

  if (Platform.OS === "web") {
    auth = getAuth(app);
  } else {
    const authModule = require("firebase/auth") as {
      initializeAuth?: (
        appInstance: FirebaseApp,
        options: { persistence: unknown },
      ) => Auth;
      getReactNativePersistence?: (storage: unknown) => unknown;
    };

    if (
      typeof authModule.initializeAuth === "function" &&
      typeof authModule.getReactNativePersistence === "function"
    ) {
      try {
        auth = authModule.initializeAuth(app, {
          persistence: authModule.getReactNativePersistence(AsyncStorage),
        });
      } catch {
        auth = getAuth(app);
      }
    } else {
      auth = getAuth(app);
    }
  }

  db = getFirestore(app);
  cloudStorage = getStorage(app);
}

export { app, auth, cloudStorage, db };
/** @deprecated Use cloudStorage — alias for media upload helper */
export const storage = cloudStorage;
export const isFirebaseConfigured = config !== null;
export const isFirebaseStorageReady =
  isFirebaseConfigured && cloudStorage !== null;
