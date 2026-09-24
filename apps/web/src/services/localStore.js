const prefix = 'core-self-genesis:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(prefix + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  localStorage.setItem(prefix + key, JSON.stringify(value));
  // Fire-and-forget cloud sync. Local storage remains the source of truth offline.
  import('./cloudStore.js')
    .then(({ saveKeyToCloud }) => saveKeyToCloud(key, value).catch(() => null))
    .catch(() => null);
}

export function remove(key) {
  localStorage.removeItem(prefix + key);
}

export function exportCoreData() {
  return {
    version: 'Genesis 1.2',
    exportedAt: new Date().toISOString(),
    memories: load('memories', []),
    projects: load('projects', []),
    goals: load('goals', []),
    lifeGraphNodes: load('lifeGraphNodes', []),
    memorySuggestions: load('memorySuggestions', []),
    activityLog: load('activityLog', []),
    settings: load('settings', {}),
    messages: load('messages', []),
    auditLog: load('auditLog', []),
    identityProfile: load('identityProfile', null),
    identitySuggestions: load('identitySuggestions', []),
  };
}

function mergeCollection(existing = [], incoming = []) {
  const seen = new Set();
  return [...incoming, ...existing].filter((item) => {
    const key = item?.id || item?.content || item?.title || JSON.stringify(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeSeedIdentity(existing = {}, incoming = {}) {
  const incomingPrivate = incoming.privateContext || {};
  const existingPrivate = existing.privateContext || {};
  const privateContext = Object.fromEntries(
    [...new Set([...Object.keys(incomingPrivate), ...Object.keys(existingPrivate)])]
      .map((key) => [key, mergeCollection(existingPrivate[key] || [], incomingPrivate[key] || [])])
  );
  return {
    ...incoming,
    ...existing,
    human: { ...(incoming.human || {}), ...(existing.human || {}) },
    communication: { ...(incoming.communication || {}), ...(existing.communication || {}) },
    development: { ...(incoming.development || {}), ...(existing.development || {}) },
    privateContext,
    roles: mergeCollection(existing.roles || [], incoming.roles || []),
    values: mergeCollection(existing.values || [], incoming.values || []),
    traits: mergeCollection(existing.traits || [], incoming.traits || []),
    preferences: mergeCollection(existing.preferences || [], incoming.preferences || []),
    goals: mergeCollection(existing.goals || [], incoming.goals || []),
    projects: mergeCollection(existing.projects || [], incoming.projects || []),
    decisionRules: mergeCollection(existing.decisionRules || [], incoming.decisionRules || []),
    boundaries: mergeCollection(existing.boundaries || [], incoming.boundaries || []),
  };
}

export function importCoreData(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid Core data.');
  if (data.seedVault === true) {
    if (Array.isArray(data.memories)) save('memories', mergeCollection(load('memories', []), data.memories));
    if (Array.isArray(data.projects)) save('projects', mergeCollection(load('projects', []), data.projects));
    if (Array.isArray(data.goals)) save('goals', mergeCollection(load('goals', []), data.goals));
    if (data.identityProfile && typeof data.identityProfile === 'object') {
      save('identityProfile', mergeSeedIdentity(load('identityProfile', {}), data.identityProfile));
    }
    return;
  }
  if (Array.isArray(data.memories)) save('memories', data.memories);
  if (Array.isArray(data.projects)) save('projects', data.projects);
  if (Array.isArray(data.goals)) save('goals', data.goals);
  if (Array.isArray(data.lifeGraphNodes)) save('lifeGraphNodes', data.lifeGraphNodes);
  if (Array.isArray(data.memorySuggestions)) save('memorySuggestions', data.memorySuggestions);
  if (Array.isArray(data.activityLog)) save('activityLog', data.activityLog);
  if (data.settings) save('settings', data.settings);
  if (Array.isArray(data.messages)) save('messages', data.messages);
  if (Array.isArray(data.auditLog)) save('auditLog', data.auditLog);
  if (data.identityProfile && typeof data.identityProfile === 'object') save('identityProfile', data.identityProfile);
  if (Array.isArray(data.identitySuggestions)) save('identitySuggestions', data.identitySuggestions);
}
