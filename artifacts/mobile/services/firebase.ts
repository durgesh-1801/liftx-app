import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize the Firebase app once — getApps() returns [] on first run
const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApps()[0];

// Auth setup:
// - On web: getAuth() uses localStorage automatically (no extra config needed)
// - On native: initializeAuth with AsyncStorage persistence so the session
//   survives app restarts. Only call initializeAuth on first init; on hot
//   reload the app already exists so we just getAuth() from it.
let auth: ReturnType<typeof getAuth>;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else if (isNewApp) {
  // First initialization — set up AsyncStorage persistence
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  // Hot reload or second render — auth already initialized, just grab the instance
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;
