import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import firebaseConfigData from '../firebase-applet-config.json';

const firebaseConfig = {
  projectId: "spheric-splicer-wf4nj",
  appId: "1:722885323704:web:7b6a4ea363358909807d4d",
  apiKey: "AIzaSyBYfgzqygjgh3kqVcb7b7EHxbsH8k7oUXs",
  authDomain: "spheric-splicer-wf4nj.firebaseapp.com",
  storageBucket: "spheric-splicer-wf4nj.firebasestorage.app",
  messagingSenderId: "722885323704",
};

export const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfigData.firestoreDatabaseId);
export const auth = getAuth(app);

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    await setDoc(doc(db, 'users', result.user.uid), {
      name: result.user.displayName,
      email: result.user.email,
      photoUrl: result.user.photoURL,
      lastLogin: new Date().toISOString()
    }, { merge: true });
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
