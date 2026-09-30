import { scoreMemory } from './memoryCompressionEngine';

const STOP = new Set(['the','and','that','this','with','from','have','your','into','about','what','when','were','been','they','them','then','than','dylan','core']);

function norm(value = '') {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function memoryText(memory = {}) {
  return [memory.title,memory.content,memory.lesson,memory.futureAction,(memory.relationshipTags || []).join(' ')].filter(Boolean).join(' ');
}

function tokenSet(value = '') {
  return new Set(norm(value).split(' ').filter((word) => word.length > 2 && !STOP.has(word)));
}

function overlap(a = new Set(), b = new Set()) {
  if (!a.size || !b.size) return 0;
  const shared = [...a].filter((item) => b.has(item)).length;
  return shared / Math.max(1, new Set([...a, ...b]).size);
}

function polarity(text = '') {
  const t = norm(text);
  let score = 0;
  if (/\b(always|love|like|prefer|want|yes|should|will|is|are)\b/.test(t)) score += 1;
  if (/\b(never|hate|dislike|avoid|don t|do not|no|shouldn t|should not|won t|will not|isn t|is not|aren t|are not)\b/.test(t)) score -= 1;
  return Math.sign(score);
}

function recency(memory = {}) {
  const raw = memory.updatedAt || memory.createdAt;
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

export function findMemoryDuplicates(memories = []) {
  const findings = [];
  for (let i = 0; i < memories.length; i += 1) {
    const left = memories[i];
    const leftTokens = tokenSet(memoryText(left));
    for (let j = i + 1; j < memories.length; j += 1) {
      const right = memories[j];
      const similarity = overlap(leftTokens, tokenSet(memoryText(right)));
      const titleMatch = norm(left.title) && norm(left.title) === norm(right.title);
      if (similarity >= 0.58 || titleMatch) {
        const keep = recency(left) >= recency(right) ? left : right;
        const review = keep.id === left.id ? right : left;
        findings.push({
          id: `duplicate-${left.id}-${right.id}`,
          type: 'Duplicate',
          confidence: Math.min(99, Math.round((similarity + (titleMatch ? .3 : 0)) * 100)),
          left,
          right,
          keep,
          review,
          reason: titleMatch ? 'Same normalized title.' : `${Math.round(similarity * 100)}% content overlap.`,
        });
      }
    }
  }
  return findings.sort((a, b) => b.confidence - a.confidence).slice(0, 20);
}

export function findMemoryContradictions(memories = []) {
  const findings = [];
  for (let i = 0; i < memories.length; i += 1) {
    const left = memories[i];
    const leftText = memoryText(left);
    const leftTokens = tokenSet(leftText);
    const leftPolarity = polarity(leftText);
    if (!leftPolarity) continue;

    for (let j = i + 1; j < memories.length; j += 1) {
      const right = memories[j];
      const rightText = memoryText(right);
      const rightPolarity = polarity(rightText);
      if (!rightPolarity || leftPolarity === rightPolarity) continue;

      const similarity = overlap(leftTokens, tokenSet(rightText));
      const sharedTags = (left.relationshipTags || []).filter((tag) => (right.relationshipTags || []).includes(tag));
      if (similarity >= 0.32 || sharedTags.length >= 2) {
        findings.push({
          id: `conflict-${left.id}-${right.id}`,
          type: 'Possible contradiction',
          confidence: Math.min(95, Math.round(similarity * 100 + sharedTags.length * 10 + 20)),
          left,
          right,
          reason: `Opposing language over shared context${sharedTags.length ? `: ${sharedTags.join(', ')}` : ''}.`,
        });
      }
    }
  }
  return findings.sort((a, b) => b.confidence - a.confidence).slice(0, 12);
}

export function buildMemoryIntelligence(memories = [], suggestions = []) {
  const duplicates = findMemoryDuplicates(memories);
  const contradictions = findMemoryContradictions(memories);
  const ranked = memories.map((memory) => ({ memory, score: scoreMemory(memory) }));
  const stale = ranked
    .filter(({ memory, score }) => score < 35 && memory.level !== 'Permanent' && memory.status !== 'Archived')
    .sort((a, b) => a.score - b.score)
    .slice(0, 20);

  const permanent = memories.filter((item) => item.level === 'Permanent' || item.importance === 'Critical').length;
  const confirmed = memories.filter((item) => item.truthStatus === 'Confirmed by Dylan').length;
  const pending = suggestions.filter((item) => item.status === 'Pending').length;
  const tagged = memories.filter((item) => (item.relationshipTags || []).length).length;

  const quality = Math.max(0, Math.min(100,
    30
    + Math.min(25, memories.length * 1.4)
    + Math.min(15, permanent * 3)
    + Math.min(12, confirmed * 1.2)
    + Math.min(10, tagged * .8)
    - Math.min(12, duplicates.length * 2)
    - Math.min(10, contradictions.length * 2)
    - Math.min(8, pending)
  ));

  return {
    version: 'Genesis 1.4',
    quality: Math.round(quality),
    total: memories.length,
    permanent,
    confirmed,
    tagged,
    pending,
    duplicates,
    contradictions,
    stale,
    reviewCount: duplicates.length + contradictions.length + stale.length + pending,
    state: quality >= 85 ? 'High-integrity memory'
      : quality >= 70 ? 'Strong memory foundation'
        : quality >= 50 ? 'Usable with review'
          : 'Developing memory model',
  };
}
