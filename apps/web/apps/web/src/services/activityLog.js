import { load, save } from './localStore';

export function logActivity({ engine = 'Core', action, detail, level = 'Info' }) {
  const current = load('activityLog', []);
  const entry = {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    engine,
    action,
    detail,
    level,
  };
  const next = [entry, ...current].slice(0, 200);
  save('activityLog', next);
  return entry;
}

export function getActivityLog() {
  return load('activityLog', []);
}

export function clearActivityLog() {
  save('activityLog', []);
}
