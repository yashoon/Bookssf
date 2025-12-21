// // firebaseConfig.js
// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyBKvcJjSRCJWWydLS0mq1PFfhuaNqKPYZ4",
//   authDomain: "shepherd-s-staff.firebaseapp.com",
//   projectId: "shepherd-s-staff",
//   storageBucket: "shepherd-s-staff.appspot.com",
//   messagingSenderId: "Shepherd's-Staff",
//   appId: "1:824535204670:android:5073b6c781410cc3bd626f",
// };

// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app); 


// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} from "@env";


console.log(FIREBASE_API_KEY);

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};


// // ✅ Log to verify config is loading (remove in production)
// console.log("Firebase Config loaded:", {
//   apiKey: firebaseConfig.apiKey ? "✓" : "✗",
//   authDomain: firebaseConfig.authDomain ? "✓" : "✗",
//   projectId: firebaseConfig.projectId ? "✓" : "✗"
// });

console.log("🔥 Initializing Firebase...");

// Initialize app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

console.log(app.name ? `✅ Firebase app initialized: ${app.name}` : "❌ Firebase app initialization failed");

console.log("✅ Step 1: Firebase App initialized");

console.log("🔥 Step 2: Initializing Auth...");
let auth;

// Initialize auth with persistence
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log("✅ Step 2: Auth initialized with persistence");
} catch (error) {
  console.log("⚠️ Step 2 Error:", error.code);
  console.log("⚠️ Step 2 Message:", error.message);
  
  // If auth is already initialized, use getAuth instead
  if (error.code === 'auth/already-initialized') {
    console.log("🔄 Using existing auth instance...");
    auth = getAuth(app);
    console.log("✅ Step 2: Got existing auth instance");
  } else {
    throw error;
  }
}

const db = getFirestore(app);

console.log("✅ Firebase initialized successfully");
console.log("✅ Auth:", auth ? "Ready" : "Failed");
console.log("✅ DB:", db ? "Ready" : "Failed");

export { auth, db };

// // ✅ Enable persistent authentication for React Native
// const app = initializeApp(firebaseConfig);
// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(ReactNativeAsyncStorage)
// });

// const db = getFirestore(app);

// export { auth, db };

