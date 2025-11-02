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
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKvcJjSRCJWWydLS0mq1PFfhuaNqKPYZ4",
  authDomain: "shepherd-s-staff.firebaseapp.com",
  projectId: "shepherd-s-staff",
  storageBucket: "shepherd-s-staff.appspot.com",
  messagingSenderId: "Shepherd's-Staff",
  appId: "1:824535204670:android:5073b6c781410cc3bd626f",
};

// ✅ Enable persistent authentication for React Native
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { auth, db };

