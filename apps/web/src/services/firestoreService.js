/**
 * Firestore preparation layer.
 * Genesis 0.0.6 does not connect to Firebase yet.
 * These functions define the shape we will replace with real Firestore calls.
 */

export const firestoreStatus = {
  connected: false,
  authReady: false,
  message: 'Firestore is prepared but not connected. Add Firebase config in a future build.',
};

export async function saveMemoryToCloud(memory) {
  console.info('[Firestore Prep] saveMemoryToCloud', memory);
  return { ok: false, reason: 'Firestore not connected yet.' };
}

export async function loadMemoriesFromCloud() {
  console.info('[Firestore Prep] loadMemoriesFromCloud');
  return { ok: false, memories: [], reason: 'Firestore not connected yet.' };
}

export async function saveLifeGraphToCloud(nodes) {
  console.info('[Firestore Prep] saveLifeGraphToCloud', nodes);
  return { ok: false, reason: 'Firestore not connected yet.' };
}
