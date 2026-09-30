const keywordMap = [
  ['THE SYSTEM', ['the system', 'fitness rpg', 'fitness', 'rpg', 'training soundtrack', 'dungeon protocol', 'system go', 'app store']],
  ['Core Self', ['core self', 'dylan core', 'second self', 'memory', 'identity core', 'cloud brain', 'genesis']],
  ['Reality Project', ['reality project', 'hset', 'physics', 'math', 'research']],
  ['Family', ['family', 'wife', 'kids', 'children', 'rubie', 'kayla', 'hazel', 'macie', 'jennifer', 'jen']],
  ['Wilbur Wonka', ['wilbur wonka', 'stay staunch', 'song', 'album', 'artist', 'music', 'suno']],
  ['THE EMPATH', ['the empath', 'subject seven', 'subject 07', 'subject zero', 'cleaners', 'arc i']],
  ['Business Lifeline', ['business lifeline', 'business recovery', 'diagnose business', 'small business recovery']],
  ['CorrWealth', ['corrwealth', 'corrshield', 'corrmarket', 'corrpay', 'corrbusiness', 'corrcapital']],
  ['Career', ['freedom pools', 'dogman', 'crane', 'business development', 'bdm', 'career', 'work']],
  ['Wealth', ['money', 'wealth', 'income', 'business', 'funding', 'iba', 'asset', 'revenue', 'sales']],
  ['Health', ['health', 'training', 'recovery', 'food', 'sleep', 'gym', 'energy', 'adhd', 'anxiety']],
  ['Creation', ['song', 'music', 'anime', 'video', 'book', 'content', 'tiktok', 'film', 'series']],
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

function entityText(item = {}, fields = []) {
  return fields.map((field) => item[field]).filter(Boolean).join(' ');
}

export function buildRelationshipLinks({ memories = [], projects = [], goals = [], lifeGraphNodes = [] }) {
  const entities = [
    ...projects.map((item) => ({
      type: 'Project',
      id: item.id || item.name,
      label: item.name || item.title,
      text: entityText(item, ['name', 'title', 'purpose', 'nextAction', 'engine', 'status']),
    })),
    ...goals.map((item) => ({
      type: 'Goal',
      id: item.id || item.title,
      label: item.title || item.name,
      text: entityText(item, ['title', 'name', 'category', 'target', 'status']),
    })),
    ...lifeGraphNodes.map((item) => ({
      type: 'Life Graph',
      id: item.id || item.title,
      label: item.title,
      text: entityText(item, ['title', 'group', 'detail']),
    })),
  ];

  const links = [];
  memories.forEach((memory) => {
    const memoryText = [
      memory.title,
      memory.content,
      memory.lesson,
      memory.futureAction,
      memory.relationshipTags?.join(' '),
    ].filter(Boolean).join(' ');
    const memoryTags = detectRelationshipTags(memoryText);

    entities.forEach((entity) => {
      if (!entity.id || !memory.id) return;
      const entityTextValue = normalizeText(entity.text);
      const directNameMatch = entity.label && normalizeText(memoryText).includes(normalizeText(entity.label));
      const entityTags = detectRelationshipTags(entity.text);
      const sharedTags = memoryTags.filter((tag) => entityTextValue.includes(tag.toLowerCase()) || entityTags.includes(tag));
      const explicitLink = Array.isArray(memory.linkedEntityIds) && memory.linkedEntityIds.includes(entity.id);

      if (directNameMatch || sharedTags.length || explicitLink) {
        const strength = explicitLink ? 'Manual' : directNameMatch ? 'Strong' : sharedTags.length > 1 ? 'Strong' : 'Inferred';
        links.push({
          id: `${memory.id}-${entity.id}`,
          fromType: 'Memory',
          fromId: memory.id,
          fromLabel: memory.title || memory.content?.slice(0, 50) || 'Untitled memory',
          toType: entity.type,
          toId: entity.id,
          toLabel: entity.label,
          strength,
          weight: explicitLink ? 100 : directNameMatch ? 90 : sharedTags.length > 1 ? 78 : 60,
          reason: explicitLink ? 'Manually linked' : directNameMatch ? 'Name matched in memory' : `Shared context: ${sharedTags.join(', ')}`,
        });
      }
    });
  });

  const deduped = new Map();
  links.forEach((link) => {
    const previous = deduped.get(link.id);
    if (!previous || link.weight > previous.weight) deduped.set(link.id, link);
  });
  return [...deduped.values()];
}

export function summarizeRelationshipMap(data) {
  const links = buildRelationshipLinks(data);
  const grouped = links.reduce((acc, link) => {
    if (!acc[link.toLabel]) acc[link.toLabel] = { label: link.toLabel, count: 0, weight: 0, types: new Set() };
    acc[link.toLabel].count += 1;
    acc[link.toLabel].weight += link.weight || 50;
    acc[link.toLabel].types.add(link.toType);
    return acc;
  }, {});

  return {
    linkCount: links.length,
    links,
    strongestEntities: Object.values(grouped)
      .map((item) => ({
        label: item.label,
        count: item.count,
        averageStrength: Math.round(item.weight / item.count),
        types: [...item.types],
      }))
      .sort((a, b) => b.count - a.count || b.averageStrength - a.averageStrength)
      .slice(0, 8),
  };
}
