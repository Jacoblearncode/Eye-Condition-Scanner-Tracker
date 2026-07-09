import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-expect-error - firebase's package.json "exports" field omits RN-specific types,
// but getReactNativePersistence exists at runtime (Metro resolves the "react-native" condition).
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Photos are uploaded to Cloudinary (see cloudinaryService.ts), not Firebase Storage -
// Firebase Storage now requires the paid Blaze plan even for free-tier-sized usage.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth can only be called once per app; on Fast Refresh (or if firebase.ts
// gets re-evaluated) it throws "already initialized", so fall back to getAuth() in that case.
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}
export const auth = authInstance;

export const db = getFirestore(app);
export default app;
