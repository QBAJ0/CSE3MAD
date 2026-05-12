export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export function readFirebaseConfig(): FirebaseWebConfig | null {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "";
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "";
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "";
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";
  const messagingSenderId =
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "";
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "";

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}
