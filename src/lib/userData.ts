import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { browserPopupRedirectResolver, deleteUser, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, type User } from 'firebase/auth';
import { db, useEmulator } from './firebase';

/** Raccoglie i dati dell'utente (diritto di accesso e portabilità, artt. 15 e 20 GDPR) */
export async function exportUserData(user: User) {
  const own = async (name: string) =>
    (await getDocs(query(collection(db, name), where('userId', '==', user.uid)))).docs.map((d) => ({ id: d.id, ...d.data() }));
  const single = async (name: string) => {
    const s = await getDoc(doc(db, name, user.uid));
    return s.exists() ? s.data() : null;
  };
  const [profile, settings, favorites, submissions, groups] = await Promise.all([
    single('users'),
    single('user_settings'),
    own('user_favorites'),
    own('form_submissions'),
    own('group_members'),
  ]);
  const data = {
    exportedAt: new Date().toISOString(),
    account: { uid: user.uid, email: user.email, name: user.displayName, provider: 'Google' },
    profile,
    settings,
    favorites,
    registrations: submissions,
    groupMemberships: groups,
    note: "Le richieste inviate alla segreteria non sono consultabili dall'area personale: per riceverne copia scrivi al titolare (vedi informativa privacy).",
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `miachiesa-dati-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Elimina l'account (diritto alla cancellazione, art. 17 GDPR): profilo, preferenze, preferiti,
 * abilitazioni ai gruppi e account di accesso. Le iscrizioni alle attività restano alla parrocchia
 * per l'organizzazione: la loro cancellazione si chiede alla segreteria.
 */
export async function deleteAccount(user: User) {
  // Firebase richiede un accesso recente per eliminare l'account: lo chiediamo PRIMA di cancellare i dati
  if (useEmulator) {
    // solo sviluppo/test con l'emulatore (rimosso dalla build di produzione)
    await reauthenticateWithCredential(user, GoogleAuthProvider.credential(JSON.stringify({ sub: user.email, email: user.email, email_verified: true })));
  } else {
    await reauthenticateWithPopup(user, new GoogleAuthProvider(), browserPopupRedirectResolver);
  }
  const ownDocs = async (name: string) => (await getDocs(query(collection(db, name), where('userId', '==', user.uid)))).docs;
  const [favs, groups] = await Promise.all([ownDocs('user_favorites'), ownDocs('group_members')]);
  await Promise.all([...favs, ...groups].map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'user_settings', user.uid));
  await deleteDoc(doc(db, 'users', user.uid));
  await deleteUser(user);
  try {
    ['home_filter', 'visitor_id'].forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
