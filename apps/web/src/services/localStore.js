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
}

export function remove(key) {
  localStorage.removeItem(prefix + key);
}

export function exportCoreData() {
  return {
    version: 'Genesis 0.0.6',
    exportedAt: new Date().toISOString(),
    memories: load('memories', []),
    projects: load('projects', []),
    goals: load('goals', []),
    lifeGraphNodes: load('lifeGraphNodes', []),
    activityLog: load('activityLog', []),
    settings: load('settings', {}),
    messages: load('messages', []),
  };
}

export function importCoreData(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid Core data.');
  if (Array.isArray(data.memories)) save('memories', data.memories);
  if (Array.isArray(data.projects)) save('projects', data.projects);
  if (Array.isArray(data.goals)) save('goals', data.goals);
  if (Array.isArray(data.lifeGraphNodes)) save('lifeGraphNodes', data.lifeGraphNodes);
  if (Array.isArray(data.activityLog)) save('activityLog', data.activityLog);
  if (data.settings) save('settings', data.settings);
  if (Array.isArray(data.messages)) save('messages', data.messages);
}
