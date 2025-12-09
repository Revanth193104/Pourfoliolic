import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, type User } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    return null;
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
