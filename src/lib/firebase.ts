import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
if (!firebaseConfig.firestoreDatabaseId) {
  console.error("Firestore Database ID is missing in firebase-applet-config.json. Firestore will not function correctly.");
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export async function testConnection() {
  if (!firebaseConfig.firestoreDatabaseId) return;
  try {
    // Attempt to force a server-side check
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
  } catch (error: any) {
    // Check for common connection errors
    if (error.code === 'unavailable') {
      console.warn("Firestore backend is currently unreachable. This often resolves itself in a few seconds. If it persists, check your project configuration.");
    } else if (error.message?.includes('the client is offline')) {
      console.error("The client is reported as offline. Please check your network connection.");
    } else if (error.code === 'permission-denied') {
      console.warn("Firestore connection test failed due to permission denied (this is expected if rules are strict).");
    } else {
      console.error("Firebase Connection Warning:", error.message || error);
    }
  }
}

testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
