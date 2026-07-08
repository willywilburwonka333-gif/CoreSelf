import { buildReasoningSnapshot } from './reasoningEngine';
import { buildTodayContext, buildMemoryTimeline } from './livingMemoryEngine';

function normalise(value = '') {
  return String(value || '').toLowerCase();
}

function hasAny(text, terms) {
  const haystack = normalise(text);
  return terms.some((term) => haystack.includes(term));
}

function latest(items = [], limit = 5) {
  return [...items]
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || b.completedAt || b.at || 0) - new Date(a.createdAt || a.updatedAt || a.completedAt || a.at || 0))
    .slice(0, limit);
}

function inferOperatingStyle({ memories = [], messages = [], activityLog = [] } = {}) {
  const text = [...memories, ...messages, ...activityLog]
    .map((item) => [item.title, item.content, item.detail, item.message, item.futureAction, item.action].join(' '))
    .join(' ');

  const style = [];
  if (hasAny(text, ['single file', 'replacement', 'only files that actually change'])) style.push('Only provide files that actually changed.');
  if (hasAny(text, ['commands', 'build', 'commit', 'push', 'deploy'])) style.push('Always include exact commands after code changes.');
  if (hasAny(text, ['roadmap', 'how far', 'progress', 'finishing'])) style.push('Always state roadmap progress and next milestone.');
  if (hasAny(text, ['latest zip', 'source of truth', 'uploaded zip'])) style.push('Treat the latest ZIP/build as source of truth.');
  if (hasAny(text, ['not local', 'vercel', 'deployed'])) style.push('Prioritise deployed-site validation over local-only testing.');

  return style.length ? style : [
    'Be direct and execution-first.',
    'Give the next practical move, not generic advice.',
    'State uncertainty instead of pretending a tool or connection is live.',
  ];
}

function buildBlindSpots({ suggestions = [], queue = [], goals = [], projects = [], memories = [] } = {}) {
  const openQueue = queue.filter((item) => item.status !== 'Done');
  const pendingSuggestions = suggestions.filter((item) => item.status === 'Pending');
  const inactiveGoals = goals.filter((goal) => normalise(goal.status).includes('hold') || normalise(goal.status).includes('paused'));
  const projectsWithoutNext = projects.filter((project) => !project.nextAction);
  const coreMemories = memories.filter((memory) => memory.level === 'Permanent' || memory.importance === 'Critical');
  const blindSpots = [];

  if (pendingSuggestions.length) blindSpots.push(`${pendingSuggestions.length} pending memory suggestion(s) may weaken recall.`);
  if (openQueue.length > 6) blindSpots.push(`${openQueue.length} open queued actions may create noise.`);
  if (projectsWithoutNext.length) blindSpots.push(`${projectsWithoutNext.length} project(s) need a concrete next action.`);
  if (!coreMemories.length) blindSpots.push('No critical/permanent memory has been confirmed yet.');
  if (inactiveGoals.length) blindSpots.push(`${inactiveGoals.length} paused goal(s) should be reviewed before planning around them.`);
  if (!blindSpots.length) blindSpots.push('No major blind spot detected. Keep logging decisions and completions.');

  return blindSpots.slice(0, 5);
}

function buildNextResponseRules({ operatingStyle = [], reasoning, today }) {
  const rules = [...operatingStyle];
  if (reasoning.activeQueueCount > 0) rules.push('When asked “next”, continue from the open queue before inventing a new track.');
  if (today.pendingSuggestionCount > 0) rules.push('Before major planning, ask the user to approve or reject memory suggestions.');
  if (reasoning.strongestMove) rules.push(`Default next move: ${reasoning.strongestMove}`);
  return [...new Set(rules)].slice(0, 7);
}

export function buildAssistantBehaviourProfile(context = {}) {
  const {
    memories = [], projects = [], goals = [], plans = [], suggestions = [], activityLog = [], messages = [], queue = [], lifeGraphNodes = [],
  } = context;

  const reasoning = buildReasoningSnapshot({ memories, projects, goals, plans, suggestions, activityLog, messages, queue, lifeGraphNodes });
  const today = buildTodayContext({ memories, projects, goals, plans, suggestions, activityLog });
  const timeline = buildMemoryTimeline({ memories, messages, activityLog, suggestions }, 8);
  const operatingStyle = inferOperatingStyle({ memories, messages, activityLog });
  const blindSpots = buildBlindSpots({ suggestions, queue, goals, projects, memories });
  const recentCompletions = latest(queue.filter((item) => item.status === 'Done'), 3);
  const activeContinuity = latest([
    ...queue.filter((item) => item.status !== 'Done'),
    ...timeline.filter((item) => hasAny([item.title, item.detail].join(' '), ['next', 'continue', 'finish', 'fix', 'deploy', 'build']))
  ], 4);

  const completionScore = Math.min(100, Math.round(
    35 +
    Math.min(memories.length, 20) * 1.2 +
    Math.min(queue.filter((item) => item.status === 'Done').length, 10) * 3 +
    Math.min(projects.filter((item) => item.nextAction).length, 8) * 3 +
    Math.min(goals.length, 8) * 2 -
    Math.min(suggestions.filter((item) => item.status === 'Pending').length, 10) * 2
  ));

  return {
    version: 'Genesis 0.8.1',
    operatingStyle,
    blindSpots,
    nextResponseRules: buildNextResponseRules({ operatingStyle, reasoning, today }),
    activeContinuity,
    recentCompletions,
    completionScore,
    mode: completionScore >= 85 ? 'Companion Loop stabilising' : completionScore >= 70 ? 'Companion Loop active' : 'Companion Loop learning',
    behaviourSummary: 'Dylan Core now checks how it should respond, what it should continue, what risks could derail context, and what the next useful move should be before acting.',
  };
}

export function buildSelfReviewChecklist(profile = {}) {
  return [
    `Continue the right thread: ${profile.activeContinuity?.[0]?.title || 'No active thread detected yet.'}`,
    `Respect workflow: ${profile.operatingStyle?.[0] || 'Be direct and practical.'}`,
    `Check blind spot: ${profile.blindSpots?.[0] || 'No blind spot detected.'}`,
    `Use next rule: ${profile.nextResponseRules?.[0] || 'Choose the highest-value action.'}`,
  ];
}
