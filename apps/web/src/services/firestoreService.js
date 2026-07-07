import { loadKeyFromCloud, saveKeyToCloud } from './cloudStore';
import { currentCoreUser } from './authService';

export const firestoreStatus = {
  connected: true,
  authReady: true,
  message: 'Firestore Cloud Brain connected through Firebase Auth. Data is stored under users/{uid}/core/{key}.',
};

export async function saveMemoryToCloud(memory) {
  const existing = await loadKeyFromCloud('memories', []);
  const memories = Array.isArray(existing.value) ? existing.value : [];
  const next = [memory, ...memories.filter((item) => item.id !== memory.id)];
  return saveKeyToCloud('memories', next);
}

export async function loadMemoriesFromCloud() {
  const result = await loadKeyFromCloud('memories', []);
  return { ok: result.ok, memories: result.value || [], reason: result.reason };
}

export async function saveLifeGraphToCloud(nodes) {
  return saveKeyToCloud('lifeGraphNodes', nodes);
}

export function getCloudBrainUser() {
  const user = currentCoreUser();
  return user ? { uid: user.uid, email: user.email } : null;
}
