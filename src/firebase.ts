import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target provisioned Firestore Database instance
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

/**
 * Validate Connection to Firestore
 * Critical constraint: call getDocFromServer on app initialization
 */
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    // Document does not exist error is expected and confirms connection to server is alive
    return true;
  }
}

export interface TravelerUser {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export function getLocalTravelerUid(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    let id = localStorage.getItem('aethervoyage_uid');
    if (!id) {
      id = `bd_traveler_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('aethervoyage_uid', id);
    }
    return id;
  }
  return 'bd_traveler_guest';
}

/**
 * Ensures the traveler has an authenticated session via Firebase Auth or persistent traveler identity
 */
export function subscribeToAuth(callback: (user: User | TravelerUser | null) => void): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      try {
        const cred = await signInAnonymously(auth);
        callback(cred.user);
      } catch {
        // Fallback gracefully to stable local session if Anonymous Auth provider is disabled in Firebase console
        const localUid = getLocalTravelerUid();
        callback({
          uid: localUid,
          displayName: 'Verified BD Traveler',
          email: 'traveler@aethervoyage.bd',
        });
      }
    } else {
      callback(user);
    }
  });
}

export type { User };

export {
  doc,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
};
