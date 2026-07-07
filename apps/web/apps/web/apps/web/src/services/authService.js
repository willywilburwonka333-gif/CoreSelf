import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebaseClient';

export function observeCoreUser(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInCore(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function createCoreAccount(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutCore() {
  return signOut(auth);
}

export function currentCoreUser() {
  return auth.currentUser;
}
