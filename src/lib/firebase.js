// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// initialize firebase app
const app = initializeApp(firebaseConfig);

// 👉 Simple function to get messaging
export const getFirebaseMessaging = async () => {
  if (typeof window === "undefined") return null; // Only run on browser

  const supported = await isSupported(); // Check if supported
  if (supported) {
    return getMessaging(app); // Return messaging if supported
  } else {
    console.log('Firebase Messaging not supported');
    return null;
  }
};
