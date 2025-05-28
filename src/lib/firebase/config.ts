// src/lib/firebase/config.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from "firebase/analytics";

// Ensure you have a .env.local file in your project root with your Firebase credentials.
// Example .env.local:
// NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
// NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAcsY4-INaEI9iAixbteH6uck2m5R3fbYI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hashdash-6d31a.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hashdash-6d31a",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hashdash-6d31a.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "807763472777",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:807763472777:web:1868233cee9171a937b158",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-BNQJW5N56X",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | undefined;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

if (typeof window !== 'undefined') {
  // Initialize Analytics only on the client side
  if (app) { // Ensure app is initialized before getting analytics
     analytics = getAnalytics(app);
  }
}

export { app, auth, db, analytics };
