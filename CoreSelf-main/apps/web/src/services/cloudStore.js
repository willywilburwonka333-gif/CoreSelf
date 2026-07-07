import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebaseClient';
import { currentCoreUser } from './authService';

const CORE_KEYS = [
  'memories',
  'projects',
  'goals',
  'lifeGraphNodes',
  'memorySuggestions',
  'activityLog',
  'settings',
  'messages',
  'auditLog',
];

export function cloudPath(uid, key) {
  return doc(db, 'users', uid, 'core', key);
}

export async function saveKeyToCloud(key, value) {
  const user = currentCoreUser();
  if (!user) return { ok: false, reason: 'No authenticated Core user.' };
  await setDoc(cloudPath(user.uid, key), {
    key,
    value,
    updatedAt: serverTimestamp(),
    version: 'Genesis 0.1.2',
  }, { merge: true });
  return { ok: true };
}

export async function loadKeyFromCloud(key, fallback) {
  const user = currentCoreUser();
  if (!user) return { ok: false, value: fallback, reason: 'No authenticated Core user.' };
  const snap = await getDoc(cloudPath(user.uid, key));
  if (!snap.exists()) return { ok: true, value: fallback, missing: true };
  return { ok: true, value: snap.data().value ?? fallback };
}

export async function pushLocalCoreToCloud(localData) {
  const user = currentCoreUser();
  if (!user) return { ok: false, reason: 'Sign in first.' };
  await Promise.all(CORE_KEYS.map((key) => saveKeyToCloud(key, localData[key] ?? (key === 'settings' ? {} : []))));
  return { ok: true, keys: CORE_KEYS.length };
}

export async function pullCloudCoreToLocal(loadKey, saveKey) {
  const user = currentCoreUser();
  if (!user) return { ok: false, reason: 'Sign in first.' };
  const loaded = {};
  for (const key of CORE_KEYS) {
    const fallback = key === 'settings' ? {} : [];
    const result = await loadKeyFromCloud(key, fallback);
    if (result.ok && !result.missing) {
      loaded[key] = result.value;
      saveKey(key, result.value);
    } else {
      loaded[key] = loadKey(key, fallback);
    }
  }
  return { ok: true, loaded };
}

export { CORE_KEYS };
