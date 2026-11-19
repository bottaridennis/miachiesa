import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logout, SUPER_ADMIN_EMAIL } from './firebase';
import { useDocData } from './useCol';
import type { UserProfile } from '../types';
import { useToast } from '../components/ui/Toast';
import { useConsent } from './consent';

interface Session {
  user: User | null | undefined;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, authLoading] = useAuthState(auth);
  const { data: profile, loading: profileLoading } = useDocData<UserProfile>(user ? doc(db, 'users', user.uid) : null);
  const toast = useToast();
  const syncedUid = useRef<string | null>(null);

  // Aggiorna il profilo una sola volta per sessione (prima veniva fatto due volte ad ogni render)
  useEffect(() => {
    if (!user || syncedUid.current === user.uid) return;
    syncedUid.current = user.uid;
    setDoc(
      doc(db, 'users', user.uid),
      {
        name: user.displayName ?? '',
        email: user.email ?? '',
        photoUrl: user.photoURL ?? '',
        lastLogin: new Date().toISOString(),
      },
      { merge: true },
    ).catch((e) => console.error('Aggiornamento profilo fallito', e));
  }, [user]);

  // Conteggio visitatori unici: SOLO con il consenso "statistiche" (cookie banner).
  // Il documento contiene solo un timestamp: nessun IP, nessun dato dell'utente.
  const consent = useConsent();
  useEffect(() => {
    if (!consent?.statistics) return;
    try {
      if (localStorage.getItem('visitor_id')) return;
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      localStorage.setItem('visitor_id', id);
      setDoc(doc(db, 'visitors', id), { timestamp: Date.now() }).catch(() => {});
    } catch {
      /* storage non disponibile */
    }
  }, [consent?.statistics]);

  const isSuperAdmin = !!user?.email && user.email.toLowerCase() === SUPER_ADMIN_EMAIL;
  const isAdmin = isSuperAdmin || profile?.isAdmin === true;

  const value = useMemo<Session>(
    () => ({
      user,
      profile,
      loading: authLoading || (!!user && profileLoading),
      isAdmin,
      isSuperAdmin,
      login: async () => {
        try {
          const u = await loginWithGoogle();
          toast.success(`Benvenuto, ${u.displayName?.split(' ')[0] ?? ''}!`);
        } catch (e: any) {
          if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') return;
          if (e?.code === 'auth/popup-blocked') {
            toast.error('Il browser ha bloccato la finestra di accesso. Consenti i popup e riprova.');
            return;
          }
          console.error(e);
          toast.error('Accesso non riuscito. Riprova.');
        }
      },
      logout: async () => {
        await logout();
        syncedUid.current = null;
        toast.info('Sei uscito dal tuo account.');
      },
    }),
    [user, profile, authLoading, profileLoading, isAdmin, isSuperAdmin, toast],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession deve essere usato dentro SessionProvider');
  return ctx;
}
