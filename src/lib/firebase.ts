import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  type User as FirebaseUser, 
  setPersistence, 
  browserLocalPersistence, 
  indexedDBLocalPersistence, 
  browserPopupRedirectResolver,
  signInAnonymously 
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, getDocs, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, getDoc, serverTimestamp, limit } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

export { 
  initializeApp, 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  FirebaseUser, 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  getDoc, 
  serverTimestamp, 
  setPersistence, 
  browserLocalPersistence, 
  indexedDBLocalPersistence, 
  limit, 
  signInAnonymously 
};

// Singleton instances
let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;

const getFirebaseApp = () => {
  if (!appInstance) {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || (firebaseConfigJson as any).apiKey;
    if (!apiKey) {
      console.warn('Firebase configuration is missing.');
      return null;
    }

    const firebaseConfig = {
      apiKey: apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseConfigJson as any).authDomain,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (firebaseConfigJson as any).projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseConfigJson as any).storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseConfigJson as any).messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || (firebaseConfigJson as any).appId,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || (firebaseConfigJson as any).measurementId || ''
    };
    appInstance = initializeApp(firebaseConfig);
  }
  return appInstance;
};

export const getAuthService = () => {
  if (!authInstance) {
    const app = getFirebaseApp();
    if (!app) return null;
    
    // Robust Auth initialization for Android and storage-partitioned environments:
    // Prioritizes indexedDBLocalPersistence which is NOT cleared during mobile tab switches,
    // backed up by browserLocalPersistence and explicit popup/redirect resolvers.
    try {
      authInstance = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
        popupRedirectResolver: browserPopupRedirectResolver
      });
    } catch {
      authInstance = getAuth(app);
      setPersistence(authInstance, indexedDBLocalPersistence).catch(() => {
        setPersistence(authInstance, browserLocalPersistence).catch(err => {
          console.warn("Auth persistence fallback notice:", err);
        });
      });
    }
  }
  return authInstance;
};

export const getDbService = () => {
  if (!dbInstance) {
    const app = getFirebaseApp();
    if (!app) return null;
    const dbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseConfigJson as any).firestoreDatabaseId;
    dbInstance = dbId && dbId.trim() ? getFirestore(app, dbId) : getFirestore(app);
  }
  return dbInstance;
};

export const googleProvider = new GoogleAuthProvider();
// On desktop, allow prompt: 'select_account' for choosing specific accounts.
// On Android and mobile devices, omitting prompt: 'select_account' allows single-tap instant authentication with the device's Google account without extra redirection cycles.
if (typeof navigator !== 'undefined' && !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)) {
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

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

  // Report critical database incidents (avoiding recursion if reporting alerts itself errors)
  if (path && !path.includes('system_alerts') && !path.includes('alert_emails')) {
    import('../services/incidentService').then(({ reportIncident }) => {
      reportIncident({
        error,
        service: 'Firestore Database',
        endpoint: `${operationType.toUpperCase()} ${path}`,
        details: errInfo,
        userEmail: auth?.currentUser?.email || undefined
      }).catch(() => {});
    }).catch(() => {});
  }

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
