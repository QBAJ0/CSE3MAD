import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace these values with your Firebase project config.
// Go to Firebase Console → Project Settings → Your Apps → Web App → SDK setup
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

const app = isConfigured
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0]
  : null;

export const db = app ? getFirestore(app) : null;
export { isConfigured };
