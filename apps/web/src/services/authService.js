import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebaseClient';

const OFFLINE_SESSION_KEY = 'core-self-genesis:offlineSession';

function loadOfflineSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(OFFLINE_SESSION_KEY) || 'null');
    return saved?.uid ? { ...saved, offline: true } : null;
  } catch {
    return null;
  }
}

function rememberSession(user) {
  if (!user?.uid) return;
  localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({ uid: user.uid, displayName: user.displayName || 'Dylan', lastVerifiedAt: new Date().toISOString() }));
}

export function observeCoreUser(callback) {
  let active = true;
  let resolved = false;
  const offlineSession = loadOfflineSession();
  const emit = (user) => {
    if (!active) return;
    resolved = true;
    if (user) rememberSession(user);
    callback(user || (!navigator.onLine ? offlineSession : null));
  };
  const unsubscribe = onAuthStateChanged(auth, emit, () => emit(!navigator.onLine ? offlineSession : null));
  const timeout = window.setTimeout(() => {
    if (!resolved && !navigator.onLine) emit(offlineSession);
  }, 1800);
  return () => {
    active = false;
    window.clearTimeout(timeout);
    unsubscribe();
  };
}

export async function signInCore(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function createCoreAccount(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutCore() {
  localStorage.removeItem(OFFLINE_SESSION_KEY);
  return signOut(auth);
}

export function currentCoreUser() {
  return auth.currentUser;
}
