import { load, save } from './localStore';

const OPERATOR_LOG_KEY = 'operatorWorkLog';

export function loadOperatorLog() {
  return load(OPERATOR_LOG_KEY, []);
}

export function addOperatorLog(entry = {}) {
  const next = [
    {
      id: entry.id || crypto.randomUUID(),
      status: entry.status || 'done',
      title: entry.title || 'Operator action',
      detail: entry.detail || '',
      intent: entry.intent || 'general',
      at: entry.at || new Date().toISOString(),
      ...entry,
    },
    ...loadOperatorLog(),
  ].slice(0, 100);
  save(OPERATOR_LOG_KEY, next);
  return next;
}

export function clearOperatorLog() {
  save(OPERATOR_LOG_KEY, []);
  return [];
}
