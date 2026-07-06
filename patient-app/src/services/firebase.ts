import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// TODO: switch to initializeAuth + getReactNativePersistence(AsyncStorage) once wiring
// up a real Firebase project, so login survives app restarts. getAuth() alone only
// keeps the session in memory for this scaffold.
export const auth = getAuth(app);

export const db = getFirestore(app);
export default app;
