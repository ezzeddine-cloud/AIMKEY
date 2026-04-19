import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

/** Mode développement local : Auth + Firestore émulateurs (aucune clé cloud requise). */
export function isEmulatorMode(): boolean {
  return process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true";
}

const DEMO_PROJECT_ID = "demo-dima-gabes";

function buildFirebaseOptions(): FirebaseOptions {
  if (isEmulatorMode()) {
    const pid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEMO_PROJECT_ID;
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key-local-only",
      authDomain: `${pid}.firebaseapp.com`,
      projectId: pid,
      storageBucket: `${pid}.appspot.com`,
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:local-emulator-dima-gabes",
    };
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    ...(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
      ? { measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID }
      : {}),
  };
}

const requiredKeys: (keyof FirebaseOptions)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

export function isFirebaseConfigured(): boolean {
  if (isEmulatorMode()) {
    return true;
  }
  const opts = buildFirebaseOptions();
  return requiredKeys.every((k) => {
    const v = opts[k];
    return typeof v === "string" && v.length > 0;
  });
}

let app: FirebaseApp | undefined;
let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;

function emulatorHost(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1";
}

function authEmulatorPort(): number {
  return Number(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT) || 9099;
}

function firestoreEmulatorPort(): number {
  return Number(process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT) || 8080;
}

/**
 * Instance Firebase (client). À n’utiliser que lorsque {@link isFirebaseConfigured} est vrai.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase n'est pas configuré : mode émulateur (NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true), ou variables NEXT_PUBLIC_FIREBASE_* en local (.env.local) / en production (hébergeur + rebuild).",
    );
  }
  if (!app) {
    const options = buildFirebaseOptions() as FirebaseOptions;
    app = getApps().length ? getApp() : initializeApp(options);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  const auth = getAuth(getFirebaseApp());
  if (typeof window !== "undefined" && isEmulatorMode() && !authEmulatorConnected) {
    const host = emulatorHost();
    const port = authEmulatorPort();
    connectAuthEmulator(auth, `http://${host}:${port}`, { disableWarnings: true });
    authEmulatorConnected = true;
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  const db = getFirestore(getFirebaseApp());
  if (typeof window !== "undefined" && isEmulatorMode() && !firestoreEmulatorConnected) {
    const host = emulatorHost();
    const port = firestoreEmulatorPort();
    connectFirestoreEmulator(db, host, port);
    firestoreEmulatorConnected = true;
  }
  return db;
}
