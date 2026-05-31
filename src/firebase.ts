import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  connectAuthEmulator
} from "firebase/auth";
import {
  getFirestore,
  type Firestore,
  connectFirestoreEmulator
} from "firebase/firestore";
import {
  getStorage,
  type FirebaseStorage,
  connectStorageEmulator
} from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const OWNER_EMAIL =
  import.meta.env.VITE_OWNER_EMAIL || "ronnywoods77@gmail.com";

export const firebaseReady = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;

if (firebaseReady) {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  storageInstance = getStorage(app);

  if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
    connectAuthEmulator(authInstance, "http://127.0.0.1:9099", {
      disableWarnings: true
    });
    connectFirestoreEmulator(dbInstance, "127.0.0.1", 8080);
    connectStorageEmulator(storageInstance, "127.0.0.1", 9199);
  }
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
