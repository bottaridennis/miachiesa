/// <reference types="vite/client" />

interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

declare const __FIREBASE_CONFIG__: FirebaseAppletConfig | null;

interface ImportMetaEnv {
  readonly VITE_SUPER_ADMIN_EMAIL?: string;
  readonly VITE_USE_EMULATOR?: string;
}
