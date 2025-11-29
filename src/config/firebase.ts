// firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAtoQWP2_jr98HvYlWEVqa9OqW-6_RJOQw",
  authDomain: "dobbymarkets-4c444.firebaseapp.com",
  projectId: "dobbymarkets-4c444",
  storageBucket: "dobbymarkets-4c444.appspot.com",
  messagingSenderId: "351743120307",
  appId: "1:351743120307:web:44f3e233caa23ead7531c6",
  measurementId: "G-RVRNEQF7T5",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("✅ Firebase initialized:", app.name);