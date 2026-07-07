export function retrieveRelevantMemories(input, memories = [], limit = 5) {
  const terms = String(input || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((term) => term.length > 2);

  if (!terms.length) return memories.slice(0, limit);

  return memories
    .map((memory) => {
      const haystack = [
        memory.title,
        memory.content,
        memory.lesson,
        memory.futureAction,
        memory.type,
        memory.level,
        memory.importance,
      ].join(' ').toLowerCase();

      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0)
        + (memory.importance === 'Critical' ? 2 : 0)
        + (memory.level === 'Permanent' ? 2 : 0);

      return { memory, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.memory);
}
