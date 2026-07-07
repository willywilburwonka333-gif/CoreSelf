import { retrieveRelevantMemories } from './memoryRetrieval';

const permanentSignals = ['always', 'never', 'permanent', 'family', 'wife', 'children', 'core self', 'dylan core', 'identity', 'mission'];
const longTermSignals = ['project', 'roadmap', 'business', 'goal', 'plan', 'build', 'launch', 'funding', 'health', 'money'];
const activeSignals = ['today', 'tomorrow', 'next', 'current', 'now', 'this week', 'update', 'fix'];
const shortTermSignals = ['maybe', 'later', 'temporary', 'test', 'draft'];

function includesAny(text, words) {
  const lower = String(text || '').toLowerCase();
  return words.some((word) => lower.includes(word));
}

export function classifyLivingMemory(memoryOrText = {}) {
  const text = typeof memoryOrText === 'string'
    ? memoryOrText
    : [memoryOrText.title, memoryOrText.content, memoryOrText.lesson, memoryOrText.futureAction, memoryOrText.type].join(' ');
  const lower = String(text || '').toLowerCase();

  if (includesAny(lower, permanentSignals)) return { level: 'Permanent', importance: 'Critical', reason: 'Identity, family, mission, or permanent preference signal.' };
  if (includesAny(lower, longTermSignals)) return { level: 'Long-term', importance: 'High', reason: 'Long-range project, business, goal, health, or money signal.' };
  if (includesAny(lower, activeSignals)) return { level: 'Active', importance: 'High', reason: 'Current action or near-term execution signal.' };
  if (includesAny(lower, shortTermSignals)) return { level: 'Short-term', importance: 'Medium', reason: 'Temporary or low-certainty signal.' };
  return { level: 'Active', importance: 'Medium', reason: 'Useful general memory.' };
}

export function enrichLivingMemory(memory) {
  const classification = classifyLivingMemory(memory);
  return {
    ...memory,
    level: memory.level || classification.level,
    importance: memory.importance || classification.importance,
    livingMemory: true,
    memoryClass: classification.level,
    memoryReason: memory.memoryReason || classification.reason,
    lastRecalledAt: memory.lastRecalledAt || null,
  };
}

export function buildMemoryTimeline({ memories = [], messages = [], activityLog = [], suggestions = [] } = {}, limit = 30) {
  const memoryEvents = memories.map((memory) => ({
    id: `memory-${memory.id}`,
    kind: 'Memory',
    title: memory.title || 'Untitled memory',
    detail: memory.content || memory.lesson || memory.futureAction || '',
    importance: memory.importance || 'Medium',
    at: memory.createdAt || memory.updatedAt || new Date().toISOString(),
  }));

  const messageEvents = messages
    .filter((message) => message?.from === 'dylan' && String(message.text || '').trim().length > 24)
    .slice(-12)
    .map((message, index) => ({
      id: `message-${message.at || index}`,
      kind: 'Conversation',
      title: 'Dylan said',
      detail: String(message.text || '').slice(0, 180),
      importance: 'Medium',
      at: message.at || new Date().toISOString(),
    }));

  const activityEvents = activityLog.slice(0, 16).map((log, index) => ({
    id: `activity-${log.at || index}`,
    kind: log.engine || 'Activity',
    title: log.action || 'Activity logged',
    detail: log.detail || '',
    importance: log.level === 'Warning' ? 'High' : 'Medium',
    at: log.at || new Date().toISOString(),
  }));

  const suggestionEvents = suggestions
    .filter((item) => item.status === 'Pending')
    .map((item) => ({
      id: `suggestion-${item.id}`,
      kind: 'Pending Suggestion',
      title: item.title || 'Suggested memory',
      detail: item.content || '',
      importance: item.importance || 'High',
      at: item.createdAt || new Date().toISOString(),
    }));

  return [...memoryEvents, ...messageEvents, ...activityEvents, ...suggestionEvents]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

export function buildTodayContext({ memories = [], projects = [], goals = [], plans = [], suggestions = [], activityLog = [] } = {}) {
  const activeMemories = memories.filter((m) => ['Permanent', 'Long-term', 'Active'].includes(m.level)).slice(0, 5);
  const pendingSuggestions = suggestions.filter((s) => s.status === 'Pending');
  const latestActivity = activityLog.slice(0, 3);
  const activeProjects = projects.filter((p) => p.status !== 'Archived').slice(0, 3);
  const activeGoals = goals.filter((g) => g.status !== 'Archived').slice(0, 3);

  return {
    memoryCount: memories.length,
    activeMemoryCount: activeMemories.length,
    pendingSuggestionCount: pendingSuggestions.length,
    projectCount: activeProjects.length,
    goalCount: activeGoals.length,
    planCount: plans.length,
    activeMemories,
    activeProjects,
    activeGoals,
    latestActivity,
    headline: activeProjects[0]?.nextAction || activeGoals[0]?.nextAction || activeMemories[0]?.futureAction || 'Build the next Core Self layer.',
  };
}

export function buildDailyReflection(context = {}) {
  const today = buildTodayContext(context);
  const memoryLine = today.memoryCount
    ? `${today.memoryCount} memories loaded, with ${today.pendingSuggestionCount} suggestion(s) waiting.`
    : 'No confirmed memories yet.';
  const projectLine = today.activeProjects[0]
    ? `Highest project signal: ${today.activeProjects[0].name || today.activeProjects[0].title}.`
    : 'No active project has been selected yet.';
  const goalLine = today.activeGoals[0]
    ? `Active goal: ${today.activeGoals[0].name || today.activeGoals[0].title}.`
    : 'Add or confirm a goal so Dylan Core can aim better.';

  return {
    greeting: 'Morning Dylan.',
    summary: `${memoryLine} ${projectLine} ${goalLine}`,
    recommendedAction: today.headline,
    question: 'Do you want to continue the strongest unfinished thread from yesterday?',
  };
}

export function recallLivingMemory(query, memories = [], limit = 5) {
  const direct = retrieveRelevantMemories(query, memories, limit);
  const lower = String(query || '').toLowerCase();
  const boosted = memories
    .map((memory) => {
      const haystack = [memory.title, memory.content, memory.lesson, memory.futureAction, memory.relationshipTags?.join(' ')].join(' ').toLowerCase();
      let score = direct.some((item) => item.id === memory.id) ? 5 : 0;
      if (lower.includes('last') || lower.includes('recent')) score += memory.createdAt ? Math.max(0, 3 - Math.floor((Date.now() - new Date(memory.createdAt).getTime()) / 86400000)) : 0;
      if (memory.level === 'Permanent') score += 2;
      if (memory.importance === 'Critical') score += 2;
      lower.split(/[^a-z0-9]+/i).filter((term) => term.length > 2).forEach((term) => {
        if (haystack.includes(term)) score += 1;
      });
      return { memory, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => ({ ...item.memory, lastRecalledAt: new Date().toISOString() }));

  return boosted.length ? boosted : direct;
}
