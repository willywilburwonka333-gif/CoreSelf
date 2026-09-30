import { buildReasoningSnapshot } from './reasoningEngine';
import { buildCompressedMemoryIndex } from './memoryCompressionEngine';
import { summarizeRelationshipMap } from './relationshipEngine';
import { buildToolReadiness, loadToolRegistry } from './toolRegistry';
import { buildStabilityReport } from './stabilityEngine';
import { ensureIdentityProfile, identityProgress } from './identityCore';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

function completed(items = []) {
  return items.filter((item) => ['done', 'complete', 'completed', 'closed'].includes(String(item.status || '').toLowerCase())).length;
}

function active(items = []) {
  return items.filter((item) => !['done', 'complete', 'completed', 'closed', 'archived'].includes(String(item.status || '').toLowerCase())).length;
}

function percentage(done, total) {
  return total ? clamp((done / total) * 100) : 0;
}

function privateDepth(profile = {}) {
  return Object.values(profile.privateContext || {}).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
}

function buildCapabilityScores({ profile, memories, projects, goals, plans, queue, tools, relationshipMap, reasoning, compression, stability, outcomes = [] }) {
  const identity = identityProgress(profile, memories.length);
  const privateFacts = privateDepth(profile);
  const openQueue = active(queue);
  const finishedQueue = completed(queue);
  const completedRatio = percentage(finishedQueue, queue.length || 1);
  const toolReadiness = buildToolReadiness(tools);
  const externalTools = tools.filter((tool) => ['External', 'Developer', 'Creator'].includes(tool.category));
  const configuredExternal = externalTools.filter((tool) => tool.status === 'Ready').length;
  const graphCoverage = Math.min(100, relationshipMap.linkCount * 3 + relationshipMap.strongestEntities.length * 8);
  const projectCoverage = Math.min(100, projects.length * 10 + goals.length * 8 + plans.length * 7);
  const memoryQuality = Math.min(100,
    memories.length * 3
    + compression.permanentCount * 5
    + compression.activeCount * 2
    + Math.min(15, privateFacts / 4)
  );

  const scores = {
    identity: clamp(identity.score + Math.min(20, privateFacts / 8)),
    memory: clamp(memoryQuality),
    reasoning: clamp(
      38
      + Math.min(18, reasoning.rankedProjects.length * 4)
      + Math.min(12, reasoning.themes.length * 3)
      + Math.min(12, goals.length * 2)
      + Math.min(10, relationshipMap.linkCount)
      + Math.min(10, completedRatio / 5)
    ),
    operator: clamp(
      30
      + Math.min(35, toolReadiness.runnable ? toolReadiness.runnable * 2 : toolReadiness.executable * 2)
      + Math.min(25, configuredExternal * 4)
      + (stability.score >= 85 ? 10 : 0)
    ),
    autonomy: clamp(
      24
      + Math.min(22, queue.length * 3)
      + Math.min(18, finishedQueue * 4)
      + Math.min(12, outcomes.length * 2)
      + Math.min(14, plans.length * 4)
      + Math.min(12, openQueue ? 8 : 0)
      + (toolReadiness.executable >= 7 ? 10 : 0)
    ),
    lifeGraph: clamp(30 + Math.min(45, graphCoverage / 1.5) + Math.min(25, projectCoverage / 2)),
    offline: 58,
    projectIntelligence: clamp(40 + Math.min(35, projectCoverage / 1.7) + Math.min(25, relationshipMap.linkCount * 2)),
    lifeOS: clamp(
      34
      + Math.min(18, projects.length * 3)
      + Math.min(14, goals.length * 3)
      + Math.min(12, plans.length * 3)
      + Math.min(12, openQueue * 2)
      + Math.min(10, relationshipMap.strongestEntities.length * 2)
    ),
  };

  scores.secondSelf = clamp(
    scores.identity * 0.17
    + scores.memory * 0.15
    + scores.reasoning * 0.16
    + scores.operator * 0.14
    + scores.autonomy * 0.12
    + scores.lifeGraph * 0.09
    + scores.offline * 0.05
    + scores.projectIntelligence * 0.06
    + scores.lifeOS * 0.06
  );

  return scores;
}

function bottleneck(scores = {}, tools = []) {
  const labels = {
    identity: 'Identity model',
    memory: 'Memory intelligence',
    reasoning: 'Dylan reasoning',
    operator: 'Tool/operator runtime',
    autonomy: 'Autonomous task runtime',
    lifeGraph: 'Life graph / digital twin',
    offline: 'Offline reasoning',
    projectIntelligence: 'Cross-project intelligence',
    lifeOS: 'Life operating system',
  };

  const ranked = Object.entries(scores)
    .filter(([key]) => key !== 'secondSelf')
    .sort((a, b) => a[1] - b[1]);

  const [key, score] = ranked[0] || ['operator', 0];
  const setupTools = tools.filter((tool) => tool.status === 'Needs setup' || tool.permission === 'Blocked');

  return {
    key,
    label: labels[key] || key,
    score,
    next: key === 'operator' && setupTools.length
      ? `Connect the next real external capability: ${setupTools[0].name}.`
      : key === 'autonomy'
        ? 'Complete more queued actions and record outcomes so Core Self can learn execution patterns.'
        : key === 'offline'
          ? 'Add a local language-model runtime; the current offline brain is deterministic.'
          : key === 'memory'
            ? 'Grow confirmed memory depth and consolidate duplicate/contradictory memories.'
            : 'Add more real outcome data so the runtime can improve this layer.',
  };
}

export function buildSecondSelfRuntime({
  memories = [],
  projects = [],
  goals = [],
  plans = [],
  suggestions = [],
  activityLog = [],
  messages = [],
  queue = [],
  lifeGraphNodes = [],
  identityProfile,
  tools,
  outcomes = [],
} = {}) {
  const profile = identityProfile || ensureIdentityProfile();
  const toolRegistry = tools || loadToolRegistry();
  const reasoning = buildReasoningSnapshot({
    memories, projects, goals, plans, suggestions, activityLog, messages, queue, lifeGraphNodes, outcomes,
  });
  const compression = buildCompressedMemoryIndex({ memories, suggestions, messages, activityLog, queue });
  const relationshipMap = summarizeRelationshipMap({ memories, projects, goals, lifeGraphNodes });
  const stability = buildStabilityReport({
    memories, projects, goals, suggestions, activityLog, messages, queue, tools: toolRegistry,
  });
  const readiness = buildToolReadiness(toolRegistry);
  const scores = buildCapabilityScores({
    profile, memories, projects, goals, plans, queue, tools: toolRegistry,
    relationshipMap, reasoning, compression, stability, outcomes,
  });
  const weakest = bottleneck(scores, toolRegistry);

  const openQueue = queue.filter((item) => item.status !== 'Done');
  const pendingSuggestions = suggestions.filter((item) => item.status === 'Pending');

  return {
    version: 'Genesis 1.4',
    generatedAt: new Date().toISOString(),
    profile,
    scores,
    weakest,
    reasoning,
    compression,
    relationshipMap,
    stability,
    readiness,
    metrics: {
      confirmedMemories: memories.length,
      privateFacts: privateDepth(profile),
      activeProjects: active(projects),
      activeGoals: active(goals),
      plans: plans.length,
      openActions: openQueue.length,
      completedActions: completed(queue),
      pendingLearnings: pendingSuggestions.length,
      graphLinks: relationshipMap.linkCount,
      executableTools: readiness.executable,
      toolRuntime: readiness.runtime?.runnable || readiness.executable,
    },
    loop: [
      { id: 'perceive', label: 'Perceive', state: messages.length || activityLog.length ? 'Live' : 'Ready', detail: 'Conversation, activity and project state become inputs.' },
      { id: 'remember', label: 'Remember', state: memories.length ? 'Live' : 'Learning', detail: 'Confirmed memory + identity + private Seed Vault.' },
      { id: 'reason', label: 'Reason', state: reasoning.rankedProjects.length ? 'Live' : 'Learning', detail: 'Ranked goals, projects, risks and strategic themes.' },
      { id: 'plan', label: 'Plan', state: goals.length || plans.length ? 'Live' : 'Learning', detail: 'Goals become practical steps and priority stacks.' },
      { id: 'act', label: 'Act', state: readiness.executable ? 'Guarded' : 'Setup', detail: 'Internal tools run now; external actions stay permission-gated.' },
      { id: 'reflect', label: 'Reflect', state: completed(queue) ? 'Learning' : 'Waiting', detail: 'Completed outcomes should feed future memory and decisions.' },
    ],
    currentMission: reasoning.rankedProjects[0]?.title || projects[0]?.name || 'Build Core Self',
    strongestMove: reasoning.strongestMove,
    status: scores.secondSelf >= 85
      ? 'Trusted second-self runtime'
      : scores.secondSelf >= 70
        ? 'Advanced partner runtime'
        : scores.secondSelf >= 55
          ? 'Integrated second-self foundation'
          : 'Developing second-self foundation',
  };
}

export function runtimeScoreRows(runtime = {}) {
  const s = runtime.scores || {};
  return [
    ['Identity', s.identity || 0],
    ['Memory', s.memory || 0],
    ['Reasoning', s.reasoning || 0],
    ['Operator', s.operator || 0],
    ['Autonomy', s.autonomy || 0],
    ['Life Graph', s.lifeGraph || 0],
    ['Offline', s.offline || 0],
    ['Projects', s.projectIntelligence || 0],
    ['Life OS', s.lifeOS || 0],
  ];
}
