const safeDate = (value) => {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) && time > 0 ? time : 0;
};

const textOf = (item = {}) => [item.title, item.name, item.content, item.lesson, item.futureAction, item.detail, item.nextStep].filter(Boolean).join(' ');

function keywordScore(text = '') {
  const lower = String(text).toLowerCase();
  const signals = ['core', 'mission', 'family', 'project', 'goal', 'launch', 'build', 'roadmap', 'money', 'health', 'business', 'memory', 'tools', 'next'];
  return signals.reduce((score, word) => score + (lower.includes(word) ? 8 : 0), 0);
}

export function scoreMemory(memory = {}, now = Date.now()) {
  const ageDays = safeDate(memory.createdAt || memory.updatedAt) ? Math.floor((now - safeDate(memory.createdAt || memory.updatedAt)) / 86400000) : 999;
  let score = 35;
  if (memory.level === 'Permanent') score += 45;
  if (memory.level === 'Long-term') score += 30;
  if (memory.level === 'Active') score += 20;
  if (memory.importance === 'Critical') score += 45;
  if (memory.importance === 'High') score += 25;
  if (memory.livingMemory) score += 10;
  if (memory.status === 'Archived') score -= 40;
  if (ageDays < 2) score += 20;
  if (ageDays < 14) score += 10;
  if (ageDays > 90 && memory.level !== 'Permanent') score -= 15;
  score += Math.min(35, keywordScore(textOf(memory)));
  return Math.max(0, Math.min(100, score));
}

export function buildCompressedMemoryIndex({ memories = [], suggestions = [], messages = [], activityLog = [], queue = [] } = {}) {
  const rankedMemories = memories
    .map((memory) => ({ ...memory, compressionScore: scoreMemory(memory) }))
    .sort((a, b) => b.compressionScore - a.compressionScore);

  const permanent = rankedMemories.filter((m) => m.level === 'Permanent' || m.importance === 'Critical');
  const active = rankedMemories.filter((m) => m.level === 'Active' || m.compressionScore >= 70).slice(0, 12);
  const archiveReady = rankedMemories.filter((m) => m.compressionScore < 35 && m.level !== 'Permanent').slice(0, 12);
  const pending = suggestions.filter((item) => item.status === 'Pending');
  const openQueue = queue.filter((item) => item.status !== 'Done');
  const recentMessages = messages.slice(-8).filter((message) => String(message.text || '').length > 12);
  const recentActivity = activityLog.slice(0, 8);

  const summaryLines = [];
  if (permanent.length) summaryLines.push(`${permanent.length} permanent/core memory signal(s) should stay pinned.`);
  if (active.length) summaryLines.push(`${active.length} active memory signal(s) are useful for today.`);
  if (archiveReady.length) summaryLines.push(`${archiveReady.length} low-score item(s) can be compressed or archived later.`);
  if (pending.length) summaryLines.push(`${pending.length} pending suggestion(s) still need approval.`);
  if (openQueue.length) summaryLines.push(`${openQueue.length} open action(s) are still live.`);

  return {
    version: 'Genesis 0.9.2',
    generatedAt: new Date().toISOString(),
    totalMemories: memories.length,
    permanentCount: permanent.length,
    activeCount: active.length,
    archiveReadyCount: archiveReady.length,
    pendingSuggestionCount: pending.length,
    openQueueCount: openQueue.length,
    contextBudget: Math.min(100, 20 + permanent.length * 8 + active.length * 4 + pending.length * 3 + openQueue.length * 3),
    summary: summaryLines.length ? summaryLines.join(' ') : 'Not enough memory depth yet. Keep adding memories, projects, goals, and actions.',
    pinned: permanent.slice(0, 8),
    active,
    archiveReady,
    recentMessages,
    recentActivity,
  };
}

export function buildMemoryCompressionActions(index = {}) {
  const actions = [];
  if ((index.pendingSuggestionCount || 0) > 0) {
    actions.push({ title: 'Review pending memory suggestions', detail: 'Approve or reject suggested memories so Dylan has cleaner long-term context.', priority: 'High' });
  }
  if ((index.archiveReadyCount || 0) > 0) {
    actions.push({ title: 'Compress low-signal memories', detail: 'Low-score memories can be summarized later instead of filling active context.', priority: 'Medium' });
  }
  if ((index.permanentCount || 0) === 0) {
    actions.push({ title: 'Pin core identity memories', detail: 'Add permanent memory anchors for identity, mission, rules, and important people.', priority: 'High' });
  }
  if ((index.contextBudget || 0) > 85) {
    actions.push({ title: 'Reduce active context load', detail: 'Context budget is getting high. Compress old details before adding heavier agent tools.', priority: 'Medium' });
  }
  return actions;
}
