function normalizeId(value = '') {
  return String(value || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'item';
}

function toNode(type, item = {}, index = 0) {
  const label = item.title || item.name || item.content || `${type} ${index + 1}`;
  return {
    id: `${type}-${item.id || normalizeId(label) || index}`,
    type,
    label: String(label).slice(0, 120),
    status: item.status || item.level || 'Active',
    priority: item.priority || item.importance || 'Normal',
    nextAction: item.nextAction || item.futureAction || item.target || item.summary || '',
  };
}

export function buildKnowledgeGraph({ memories = [], projects = [], goals = [], plans = [] } = {}) {
  const projectNodes = projects.slice(0, 12).map((item, index) => toNode('project', item, index));
  const goalNodes = goals.slice(0, 12).map((item, index) => toNode('goal', item, index));
  const planNodes = plans.slice(0, 8).map((item, index) => toNode('plan', item, index));
  const memoryNodes = memories.slice(0, 18).map((item, index) => toNode('memory', item, index));
  const nodes = [...projectNodes, ...goalNodes, ...planNodes, ...memoryNodes];

  const edges = [];
  for (const project of projectNodes) {
    for (const goal of goalNodes.slice(0, 4)) edges.push({ from: project.id, to: goal.id, type: 'supports' });
    for (const plan of planNodes.slice(0, 3)) edges.push({ from: project.id, to: plan.id, type: 'planned-by' });
  }
  for (const memory of memoryNodes.slice(0, 8)) {
    const linkedProject = projectNodes.find((project) => memory.label.toLowerCase().includes(project.label.toLowerCase().split(' ')[0] || '')) || projectNodes[0];
    if (linkedProject) edges.push({ from: memory.id, to: linkedProject.id, type: 'context-for' });
  }

  const highestPriority = nodes
    .filter((node) => /critical|s-tier|high|a-tier/i.test(`${node.priority} ${node.status}`))
    .slice(0, 8);

  return {
    version: 'milestone-2-knowledge-graph',
    nodes: nodes.slice(0, 50),
    edges: edges.slice(0, 80),
    counts: {
      memories: memoryNodes.length,
      projects: projectNodes.length,
      goals: goalNodes.length,
      plans: planNodes.length,
      edges: edges.length,
    },
    highestPriority,
    summary: `${projectNodes.length} projects • ${goalNodes.length} goals • ${planNodes.length} plans • ${memoryNodes.length} memories linked for context.`,
  };
}
