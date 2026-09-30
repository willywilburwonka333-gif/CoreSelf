const STOP_WORDS = new Set(['the','and','for','with','that','this','from','have','what','when','where','your','you','are','was','were','but','not','into','about']);

function normalise(value = '') {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(value = '') {
  return normalise(value).split(' ').filter((term) => term.length > 2 && !STOP_WORDS.has(term));
}

function memoryText(memory = {}) {
  return [
    memory.title,
    memory.content,
    memory.lesson,
    memory.futureAction,
    memory.type,
    memory.level,
    memory.importance,
    ...(memory.relationshipTags || []),
  ].filter(Boolean).join(' ');
}

function recencyScore(memory = {}, now = Date.now()) {
  const raw = memory.updatedAt || memory.createdAt;
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  if (!Number.isFinite(time)) return 0;
  const ageDays = Math.max(0, (now - time) / 86400000);
  if (ageDays <= 2) return 4;
  if (ageDays <= 14) return 2;
  if (ageDays <= 60) return 1;
  return 0;
}

function importanceScore(memory = {}) {
  let score = 0;
  const importance = normalise(memory.importance);
  const level = normalise(memory.level);
  if (importance === 'critical') score += 7;
  else if (importance === 'high') score += 4;
  else if (importance === 'medium') score += 2;
  if (level === 'permanent') score += 6;
  else if (level === 'long term' || level === 'long-term') score += 4;
  else if (level === 'active') score += 3;
  if (memory.truthStatus === 'Confirmed by Dylan') score += 2;
  return score;
}

function relationshipBoost(memory = {}, queryTokens = []) {
  const tags = tokens((memory.relationshipTags || []).join(' '));
  return queryTokens.reduce((score, token) => score + (tags.includes(token) ? 4 : 0), 0);
}

function phraseBoost(query = '', haystack = '') {
  const q = normalise(query);
  const h = normalise(haystack);
  if (!q || q.length < 6) return 0;
  if (h.includes(q)) return 12;

  const phrases = q.split(' ').filter((_, index, all) => index < all.length - 1)
    .map((word, index, all) => `${word} ${all[index + 1]}`);
  return phrases.reduce((score, phrase) => score + (h.includes(phrase) ? 3 : 0), 0);
}

function lexicalScore(queryTokens = [], haystack = '') {
  const words = tokens(haystack);
  const set = new Set(words);
  return queryTokens.reduce((score, token) => {
    if (set.has(token)) return score + 4;
    if (words.some((word) => word.startsWith(token) || token.startsWith(word))) return score + 1;
    return score;
  }, 0);
}

export function scoreRelevantMemory(input, memory = {}, now = Date.now()) {
  const queryTokens = [...new Set(tokens(input))];
  const haystack = memoryText(memory);
  const lexical = lexicalScore(queryTokens, haystack);
  const phrase = phraseBoost(input, haystack);
  const relationship = relationshipBoost(memory, queryTokens);
  const importance = importanceScore(memory);
  const recency = recencyScore(memory, now);

  // Permanent/critical memories should remain retrievable, but relevance still dominates.
  const relevanceGate = lexical + phrase + relationship;
  const anchorBonus = relevanceGate > 0 ? importance + recency : Math.min(3, importance);

  return {
    score: relevanceGate + anchorBonus,
    lexical,
    phrase,
    relationship,
    importance,
    recency,
  };
}

export function retrieveRelevantMemories(input, memories = [], limit = 7) {
  const query = String(input || '').trim();
  if (!query) {
    return [...memories]
      .map((memory) => ({ memory, ...scoreRelevantMemory('', memory) }))
      .sort((a, b) => (b.importance + b.recency) - (a.importance + a.recency))
      .slice(0, limit)
      .map((item) => item.memory);
  }

  const scored = memories
    .map((memory) => ({ memory, ...scoreRelevantMemory(query, memory) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const selected = [];
  const seen = new Set();

  for (const item of scored) {
    const fingerprint = normalise(item.memory.content || item.memory.title).slice(0, 140);
    if (fingerprint && seen.has(fingerprint)) continue;
    if (fingerprint) seen.add(fingerprint);
    selected.push(item.memory);
    if (selected.length >= limit) break;
  }

  return selected;
}

export function explainMemoryRetrieval(input, memories = [], limit = 7) {
  return memories
    .map((memory) => ({ memory, ...scoreRelevantMemory(input, memory) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ memory, ...scores }) => ({
      id: memory.id,
      title: memory.title || 'Untitled memory',
      ...scores,
    }));
}
