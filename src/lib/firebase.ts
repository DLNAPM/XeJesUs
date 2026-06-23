import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User as FirebaseUser, setPersistence, browserLocalPersistence, indexedDBLocalPersistence, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, getDocs, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, getDoc, serverTimestamp, limit } from 'firebase/firestore';

export { initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, FirebaseUser, getFirestore, doc, getDocFromServer, collection, getDocs, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, getDoc, serverTimestamp, setPersistence, browserLocalPersistence, limit, signInAnonymously };

// Singleton instances
let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;

const getFirebaseApp = () => {
  if (!appInstance) {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
      console.warn('Firebase configuration is missing. Please set environment variables in the Settings menu.');
      return null;
    }

    const firebaseConfig = {
      apiKey: apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };
    appInstance = initializeApp(firebaseConfig);
  }
  return appInstance;
};

export const getAuthService = () => {
  if (!authInstance) {
    const app = getFirebaseApp();
    if (!app) return null;
    authInstance = getAuth(app);
    // Fix for mobile/Safari "missing initial state" error
    // Set persistence to LOCAL to ensure state is maintained
    setPersistence(authInstance, browserLocalPersistence).catch(err => {
      console.error("Auth persistence setup failed:", err);
    });
  }
  return authInstance;
};

export const getDbService = () => {
  if (!dbInstance) {
    const app = getFirebaseApp();
    if (!app) return null;
    const dbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
    dbInstance = dbId && dbId.trim() ? getFirestore(app, dbId) : getFirestore(app);
  }
  return dbInstance;
};

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const auth = getAuthService();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    const db = getDbService();
    if (!db) {
      console.warn("Firebase is unconfigured or inactive. Skipping connection test.");
      return;
    }
    const docContext = doc(db, 'test', 'connection');
    await getDocFromServer(docContext);
    console.log("Firebase connection successful");
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    } else {
      console.warn("Firebase connection inactive (check config in Settings):", error.message);
    }
  }
}
