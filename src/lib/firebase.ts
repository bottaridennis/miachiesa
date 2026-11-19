import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

export const useEmulator = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true';
const config = useEmulator ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-miachiesa', appId: 'demo' } as FirebaseAppletConfig : __FIREBASE_CONFIG__;

export const isFirebaseConfigured = !!config?.apiKey;

if (!isFirebaseConfigured) {
  console.error('Configurazione Firebase mancante. Vedi README.');
}

export const SUPER_ADMIN_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'dennisbottari@gmail.com').toLowerCase();

export const app = initializeApp({
  apiKey: config?.apiKey,
  authDomain: config?.authDomain,
  projectId: config?.projectId,
  appId: config?.appId,
  storageBucket: config?.storageBucket,
  messagingSenderId: config?.messagingSenderId,
});

export const db = initializeFirestore(
  app,
  {
    // Rileva automaticamente le reti che bloccano i WebSocket (es. iframe di AI Studio)
    experimentalAutoDetectLongPolling: true,
    // Cache offline: l'app resta consultabile anche senza connessione
    localCache: useEmulator ? memoryLocalCache() : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  },
  config?.firestoreDatabaseId || '(default)',
);

// initializeAuth SENZA popupRedirectResolver: getAuth() precaricherebbe lo script di Google
// (apis.google.com) ad ogni visita, inviando l'IP del visitatore a Google anche se non accede.
// Lo script viene caricato solo quando l'utente sceglie di accedere (vedi loginWithGoogle).
export const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });

// Sviluppo locale con l'emulatore Firebase: `npm run dev:emulator`
if (useEmulator) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  // Accesso rapido per test automatici: l'emulatore accetta token Google non firmati
  (window as any).__emulatorLogin = (email: string, name = email) =>
    signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true, name })));
}
auth.languageCode = 'it';

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return (await signInWithPopup(auth, provider, browserPopupRedirectResolver)).user;
}

export const logout = () => signOut(auth);
