import { load, save } from './localStore';
import { logActivity } from './activityLog';

export const OUTCOME_KEY = 'executionOutcomes';

function normalise(value = '') {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
}

function inferSignals(action = {}, result = {}) {
  const text = normalise([
    action.title, action.detail, action.nextStep, action.type, action.source,
    result.note, result.result,
  ].filter(Boolean).join(' '));

  const signals = [];
  if (/family|wife|jen|daughter|kids|children/.test(text)) signals.push('family');
  if (/money|income|business|sales|customer|wealth|revenue/.test(text)) signals.push('wealth');
  if (/build|code|app|github|firebase|vercel|deploy/.test(text)) signals.push('build');
  if (/song|music|wilbur|creative|video|image|story/.test(text)) signals.push('creative');
  if (/health|sleep|training|recovery|energy/.test(text)) signals.push('health');
  if (/memory|identity|core self|dylan core/.test(text)) signals.push('core-self');
  return [...new Set(signals)];
}

export function loadExecutionOutcomes() {
  return load(OUTCOME_KEY, []);
}

export function recordExecutionOutcome(action = {}, result = {}) {
  const outcomes = loadExecutionOutcomes();
  const item = {
    id: crypto.randomUUID(),
    actionId: action.id || null,
    title: action.title || action.type || 'Action',
    type: action.type || 'Action',
    source: action.source || 'Action Queue',
    result: result.result || 'Completed',
    note: result.note || '',
    success: result.success !== false,
    signals: inferSignals(action, result),
    startedAt: action.startedAt || null,
    completedAt: result.completedAt || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  save(OUTCOME_KEY, [item, ...outcomes].slice(0, 300));
  logActivity({
    engine: 'Execution Learning',
    action: 'Recorded outcome',
    detail: `${item.title}: ${item.success ? 'success' : 'needs review'}`,
    level: item.success ? 'Info' : 'Warning',
  });
  return item;
}

export function buildExecutionLearning(outcomes = loadExecutionOutcomes()) {
  const total = outcomes.length;
  const successes = outcomes.filter((item) => item.success).length;
  const failures = total - successes;
  const signalMap = outcomes.reduce((acc, item) => {
    (item.signals || []).forEach((signal) => {
      if (!acc[signal]) acc[signal] = { signal, total: 0, successes: 0 };
      acc[signal].total += 1;
      if (item.success) acc[signal].successes += 1;
    });
    return acc;
  }, {});

  const patterns = Object.values(signalMap)
    .map((item) => ({
      ...item,
      successRate: item.total ? Math.round((item.successes / item.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total || b.successRate - a.successRate);

  return {
    total,
    successes,
    failures,
    successRate: total ? Math.round((successes / total) * 100) : 0,
    patterns,
    strongestPattern: patterns[0] || null,
    maturity: total >= 50 ? 'Behaviour model forming'
      : total >= 20 ? 'Useful execution history'
        : total >= 5 ? 'Early learning'
          : 'Needs outcomes',
  };
}

export function buildDecisionEvidence(action = {}, outcomes = loadExecutionOutcomes()) {
  const targetSignals = inferSignals(action, {});
  const relevant = outcomes.filter((item) => (item.signals || []).some((signal) => targetSignals.includes(signal)));
  const successes = relevant.filter((item) => item.success).length;
  return {
    samples: relevant.length,
    successRate: relevant.length ? Math.round((successes / relevant.length) * 100) : null,
    signals: targetSignals,
    confidence: relevant.length >= 10 ? 'High' : relevant.length >= 4 ? 'Medium' : 'Low',
  };
}
