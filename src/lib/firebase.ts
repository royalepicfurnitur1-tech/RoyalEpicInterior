import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const metaEnv = (import.meta as any).env || {};

// Royal Epic Interior Firebase Configuration
export const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyAxMtqzGmaZ1Dzr54IYwcarbj--qJwDT-E",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "royal-epic-interior.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "royal-epic-interior",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "royal-epic-interior.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "448757684943",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:448757684943:web:1cdd30e1b3d85c4de975ba",
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || "G-3EGD91CHGW"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics Initialization (Safely handled for SSR/iframe environments)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported in this environment
  });
}

export default app;
