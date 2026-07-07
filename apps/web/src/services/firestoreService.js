/**
 * Firestore preparation layer.
 * Genesis 0.0.5 does not connect to Firebase yet.
 * These functions define the shape we will replace with real Firestore calls.
 */

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
