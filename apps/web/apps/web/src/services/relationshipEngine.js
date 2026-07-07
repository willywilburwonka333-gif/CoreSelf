const keywordMap = [
  ['THE SYSTEM', ['system', 'fitness', 'rpg', 'app', 'google', 'apple', 'store', 'launch']],
  ['Core Self', ['core self', 'dylan core', 'memory', 'assistant', 'ai', 'genesis']],
  ['Reality Project', ['reality', 'hset', 'physics', 'math', 'research']],
  ['Family', ['family', 'wife', 'kids', 'children', 'rubie', 'kayla', 'hazel', 'macie', 'jennifer']],
  ['Wealth', ['money', 'wealth', 'income', 'business', 'funding', 'iba', 'asset']],
  ['Health', ['health', 'training', 'recovery', 'food', 'sleep', 'gym', 'energy']],
  ['Creation', ['song', 'music', 'anime', 'video', 'book', 'content', 'tiktok']],
];

export function normalizeText(value) {
  return String(value || '').toLowerCase();
}

export function detectRelationshipTags(text) {
  const haystack = normalizeText(text);
  return keywordMap
    .filter(([, terms]) => terms.some((term) => haystack.includes(term)))
    .map(([label]) => label);
}

export function buildRelationshipLinks({ memories = [], projects = [], goals = [], lifeGraphNodes = [] }) {
  const entities = [
    ...projects.map((item) => ({ type: 'Project', id: item.id, label: item.name, text: [item.name, item.purpose, item.nextAction, item.engine].join(' ') })),
    ...goals.map((item) => ({ type: 'Goal', id: item.id, label: item.title, text: [item.title, item.category, item.target].join(' ') })),
    ...lifeGraphNodes.map((item) => ({ type: 'Life Graph', id: item.id, label: item.title, text: [item.title, item.group, item.detail].join(' ') })),
  ];

  const links = [];

  memories.forEach((memory) => {
    const memoryText = [memory.title, memory.content, memory.lesson, memory.futureAction, memory.relationshipTags?.join(' ')].join(' ');
    const memoryTags = detectRelationshipTags(memoryText);

    entities.forEach((entity) => {
      const entityText = normalizeText(entity.text);
      const directNameMatch = entity.label && normalizeText(memoryText).includes(normalizeText(entity.label));
      const sharedTags = memoryTags.filter((tag) => entityText.includes(tag.toLowerCase()) || detectRelationshipTags(entity.text).includes(tag));
      const explicitLink = Array.isArray(memory.linkedEntityIds) && memory.linkedEntityIds.includes(entity.id);

      if (directNameMatch || sharedTags.length || explicitLink) {
        links.push({
          id: `${memory.id}-${entity.id}`,
          fromType: 'Memory',
          fromId: memory.id,
          fromLabel: memory.title || memory.content?.slice(0, 50) || 'Untitled memory',
          toType: entity.type,
          toId: entity.id,
          toLabel: entity.label,
          strength: explicitLink ? 'Manual' : directNameMatch ? 'Strong' : 'Inferred',
          reason: explicitLink ? 'Manually linked' : directNameMatch ? 'Name matched in memory' : `Shared context: ${sharedTags.join(', ')}`,
        });
      }
    });
  });

  return links;
}

export function summarizeRelationshipMap(data) {
  const links = buildRelationshipLinks(data);
  const grouped = links.reduce((acc, link) => {
    acc[link.toLabel] = (acc[link.toLabel] || 0) + 1;
    return acc;
  }, {});

  return {
    linkCount: links.length,
    links,
    strongestEntities: Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count })),
  };
}
