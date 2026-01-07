// import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebase = initializeApp(firebaseConfig);
export const auth = getAuth(firebase);
console.log("");
if (import.meta.env.VITE_MODE == "dev") {
  console.log("Setting up emulator");
  const authEmulatorAPI = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST;
  connectAuthEmulator(auth, authEmulatorAPI);
}

export const db = getFirestore(firebase);
