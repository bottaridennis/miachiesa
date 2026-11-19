// Test delle regole di sicurezza Firestore. Esegui con: npm run test:rules
import { after, before, beforeEach, describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where } from 'firebase/firestore';

let env;
const SUPER = { email: 'dennisbottari@gmail.com', email_verified: true };

const anon = () => env.unauthenticatedContext().firestore();
const userDb = (uid, extra = {}) => env.authenticatedContext(uid, { email: `${uid}@test.it`, email_verified: true, ...extra }).firestore();
const superDb = () => env.authenticatedContext('super', SUPER).firestore();
const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

const notice = (over = {}) => ({ title: 'Titolo', content: 'Testo', category: 'Avviso', groupId: 'g1', authorId: 'alice', parish: 'Oppeano', timestamp: 1, ...over });

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-miachiesa',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await seed(async (db) => {
    await setDoc(doc(db, 'groups/g1'), { name: 'Giovani', parish: 'Oppeano' });
    await setDoc(doc(db, 'users/admin1'), { name: 'Admin', email: 'admin1@test.it', isAdmin: true });
    await setDoc(doc(db, 'users/bob'), { name: 'Bob', email: 'bob@test.it' });
    await setDoc(doc(db, 'group_members/g1_alice'), { groupId: 'g1', userId: 'alice', isVerified: true });
    await setDoc(doc(db, 'forms/f1'), { title: 'Grest', deadline: '2099-01-01', fields: [] });
  });
});

describe('utenti', () => {
  test('un utente non può crearsi come admin', async () => {
    await assertFails(setDoc(doc(userDb('eve'), 'users/eve'), { name: 'Eve', isAdmin: true }));
    await assertSucceeds(setDoc(doc(userDb('eve'), 'users/eve'), { name: 'Eve' }));
  });
  test('un utente non può promuoversi admin con un update', async () => {
    await assertFails(updateDoc(doc(userDb('bob'), 'users/bob'), { isAdmin: true }));
    await assertSucceeds(setDoc(doc(userDb('bob'), 'users/bob'), { lastLogin: 'x' }, { merge: true }));
  });
  test('le email degli utenti non sono pubbliche', async () => {
    await assertFails(getDoc(doc(anon(), 'users/bob')));
    await assertFails(getDoc(doc(userDb('eve'), 'users/bob')));
    await assertSucceeds(getDoc(doc(userDb('bob'), 'users/bob')));
    await assertSucceeds(getDoc(doc(userDb('admin1'), 'users/bob')));
  });
  test('solo il super admin può nominare admin', async () => {
    await assertFails(updateDoc(doc(userDb('admin1'), 'users/bob'), { isAdmin: true }));
    await assertSucceeds(updateDoc(doc(superDb(), 'users/bob'), { isAdmin: true }));
  });
  test("l'utente può eliminare il proprio profilo, non quello altrui (art. 17)", async () => {
    await assertFails(deleteDoc(doc(userDb('eve'), 'users/bob')));
    await assertSucceeds(deleteDoc(doc(userDb('bob'), 'users/bob')));
  });
  test('richiesta alla segreteria con registro dei consensi accettata', async () => {
    await assertSucceeds(addDoc(collection(anon(), 'messages'), { name: 'Mario', email: 'm@x.it', service: 'Certificato', message: '', status: 'nuova', userId: null, consents: { privacyAck: true, privacyVersion: '2026-11-19', at: 1 }, timestamp: 1 }));
  });
  test('email del super admin non verificata = nessun privilegio', async () => {
    const db = env.authenticatedContext('fake', { email: SUPER.email, email_verified: false }).firestore();
    await assertFails(updateDoc(doc(db, 'users/bob'), { isAdmin: true }));
  });
});

describe('avvisi', () => {
  test('lettura pubblica', async () => {
    await seed((db) => setDoc(doc(db, 'notices/n1'), notice()));
    await assertSucceeds(getDoc(doc(anon(), 'notices/n1')));
  });
  test('membro verificato può pubblicare per il suo gruppo, ma non fissarlo', async () => {
    await assertSucceeds(addDoc(collection(userDb('alice'), 'notices'), notice()));
    await assertFails(addDoc(collection(userDb('alice'), 'notices'), notice({ pinned: true })));
    await assertFails(addDoc(collection(userDb('alice'), 'notices'), notice({ groupId: 'admin' })));
  });
  test('utente non verificato o che si spaccia per altri non può pubblicare', async () => {
    await assertFails(addDoc(collection(userDb('bob'), 'notices'), notice({ authorId: 'bob' })));
    await assertFails(addDoc(collection(userDb('bob'), 'notices'), notice({ authorId: 'alice' })));
  });
  test('avviso non valido rifiutato', async () => {
    await assertFails(addDoc(collection(userDb('admin1'), 'notices'), notice({ authorId: 'admin1', title: '' })));
    await assertFails(addDoc(collection(userDb('admin1'), 'notices'), notice({ authorId: 'admin1', category: 'Spam' })));
  });
  test("l'autore non può cambiare autore; gli altri non possono modificare", async () => {
    await seed((db) => setDoc(doc(db, 'notices/n1'), notice()));
    await assertSucceeds(updateDoc(doc(userDb('alice'), 'notices/n1'), { title: 'Nuovo' }));
    await assertFails(updateDoc(doc(userDb('alice'), 'notices/n1'), { authorId: 'bob' }));
    await assertFails(updateDoc(doc(userDb('bob'), 'notices/n1'), { title: 'Hack' }));
    await assertFails(deleteDoc(doc(userDb('bob'), 'notices/n1')));
    await assertSucceeds(deleteDoc(doc(userDb('admin1'), 'notices/n1')));
  });
});

describe('abilitazioni ai gruppi', () => {
  test("un utente può chiedere l'adesione ma non auto-verificarsi", async () => {
    const db = userDb('bob');
    await assertFails(setDoc(doc(db, 'group_members/g1_bob'), { groupId: 'g1', userId: 'bob', isVerified: true }));
    await assertSucceeds(setDoc(doc(db, 'group_members/g1_bob'), { groupId: 'g1', userId: 'bob', isVerified: false }));
    await assertFails(updateDoc(doc(db, 'group_members/g1_bob'), { isVerified: true }));
  });
  test('id della richiesta non manipolabile', async () => {
    await assertFails(setDoc(doc(userDb('bob'), 'group_members/qualsiasi'), { groupId: 'g1', userId: 'bob', isVerified: false }));
  });
  test('le richieste altrui non sono leggibili', async () => {
    await assertFails(getDoc(doc(userDb('bob'), 'group_members/g1_alice')));
    await assertSucceeds(getDocs(query(collection(userDb('alice'), 'group_members'), where('userId', '==', 'alice'))));
  });
});

describe('segreteria e iscrizioni', () => {
  const msg = { name: 'Mario', email: 'm@x.it', service: 'Certificato', message: 'ciao', status: 'nuova', userId: null, timestamp: 1 };
  test('chiunque invia una richiesta, ma non può leggerla/modificarla/cancellarla', async () => {
    const ref = await assertSucceeds(addDoc(collection(anon(), 'messages'), msg));
    await assertFails(getDoc(doc(anon(), `messages/${ref.id}`)));
    await assertFails(updateDoc(doc(anon(), `messages/${ref.id}`), { status: 'completata' }));
    await assertFails(deleteDoc(doc(anon(), `messages/${ref.id}`)));
    await assertSucceeds(updateDoc(doc(userDb('admin1'), `messages/${ref.id}`), { status: 'completata' }));
  });
  test('richiesta con stato forzato o campi vuoti rifiutata', async () => {
    await assertFails(addDoc(collection(anon(), 'messages'), { ...msg, status: 'completata' }));
    await assertFails(addDoc(collection(anon(), 'messages'), { ...msg, name: '' }));
  });
  test('iscrizioni: invio libero, lettura solo propria, niente cancellazioni altrui', async () => {
    const sub = { formId: 'f1', userId: 'bob', userEmail: 'bob@test.it', data: { Nome: 'Bob' }, timestamp: 1 };
    const ref = await assertSucceeds(addDoc(collection(userDb('bob'), 'form_submissions'), sub));
    await assertFails(addDoc(collection(userDb('eve'), 'form_submissions'), sub)); // userId altrui
    await assertFails(addDoc(collection(anon(), 'form_submissions'), { ...sub, userId: 'anonymous', formId: 'inesistente' }));
    await assertSucceeds(getDoc(doc(userDb('bob'), `form_submissions/${ref.id}`)));
    await assertFails(getDoc(doc(userDb('eve'), `form_submissions/${ref.id}`)));
    await assertFails(deleteDoc(doc(anon(), `form_submissions/${ref.id}`)));
  });
});

describe('contenuti amministrati', () => {
  for (const c of ['events', 'mass_times', 'liturgy', 'forms', 'site_config', 'community_members', 'groups']) {
    test(`${c}: lettura pubblica, scrittura solo admin`, async () => {
      await assertSucceeds(getDocs(collection(anon(), c)));
      await assertFails(setDoc(doc(userDb('bob'), `${c}/x`), { a: 1 }));
      await assertSucceeds(setDoc(doc(userDb('admin1'), `${c}/x`), { a: 1 }));
    });
  }
  test('visitatori: solo creazione con timestamp', async () => {
    await assertSucceeds(setDoc(doc(anon(), 'visitors/v1'), { timestamp: 1 }));
    await assertFails(setDoc(doc(anon(), 'visitors/v2'), { timestamp: 1, x: 'spam' }));
    await assertFails(getDocs(collection(anon(), 'visitors')));
  });
});
