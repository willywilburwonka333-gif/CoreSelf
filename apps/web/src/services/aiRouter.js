import { coreReply } from './coreReply';
import { retrieveRelevantMemories } from './memoryRetrieval';
import { load, save } from './localStore';
import { coreSeedMemories } from '../data/coreSeeds';
import { defaultGoals, defaultProjects } from '../data/defaults';

const SEED_MEMORIES = [
  ...coreSeedMemories,
  {
    id: 'seed-build-workflow-commands',
    title: 'Core Self build workflow rule',
    type: 'Workflow',
    level: 'Permanent',
    importance: 'Critical',
    content: 'Dylan wants Core Self coding replies to include the exact replacement files, terminal commands, what changed, and how far the project is from completion.',
    lesson: 'Always be practical and file-level when building Core Self.',
    futureAction: 'When giving code/build help, include files, commands, summary, and progress.',
    relationshipTags: ['workflow', 'coding', 'commands', 'Core Self'],
    status: 'Seed',
  },
  {
    id: 'seed-no-code-refusal',
    title: 'Coding capability expectation',
    type: 'Capability',
    level: 'Permanent',
    importance: 'Critical',
    content: 'Dylan expects Dylan Core to help write code, prepare single-file replacements, inspect bugs, debug builds, explain terminal commands, deploy, commit, and push.',
    lesson: 'Never use dead-end wording like “I cannot build code directly.” Explain the practical path instead.',
    futureAction: 'For feature requests, produce a safe stack and exact next commands.',
    relationshipTags: ['coding', 'debugging', 'replacement files'],
    status: 'Seed',
  },
  {
    id: 'seed-all-engines-roadmap',
    title: 'Dylan Core engine roadmap',
    type: 'Architecture',
    level: 'Permanent',
    importance: 'Critical',
    content: 'Dylan Core should become a personal AI OS with memory, projects, goals, plans, live internet, Deep Think, model routing, vision/files, action queue, reminders, calendar, email, GitHub, Firebase, Vercel and notifications.',
    lesson: 'Build useful engines, not just chat polish.',
    futureAction: 'Keep stacking shippable Genesis releases toward action-capable second-self behaviour.',
    relationshipTags: ['roadmap', 'AI OS', 'engines'],
    status: 'Seed',
  },
];

const SEED_PROJECTS = [
  ...defaultProjects,
  {
    id: 'dungeon-protocol',
    name: 'Dungeon Protocol',
    status: 'Active',
    priority: 'A-Tier',
    engine: 'Creation / Game Layer',
    purpose: 'Inner RPG battle/game layer connected to THE SYSTEM universe.',
    nextAction: 'Improve battle feel, animations, mobs, boss encounters, map scale, and identity.',
  },
  {
    id: 'music-marketing',
    name: 'Music / Marketing Assets',
    status: 'Active',
    priority: 'A-Tier',
    engine: 'Creation / Growth',
    purpose: 'Songs, film clips, TikTok posts, launch promos, lore and brand storytelling.',
    nextAction: 'Use assets to market THE SYSTEM and build Core Self identity.',
  },
];

const SEED_GOALS = [
  ...defaultGoals,
  {
    id: 'goal-dylan-core-useful',
    title: 'Make Dylan Core genuinely useful',
    category: 'Product',
    priority: 'S-Tier',
    status: 'Active',
    target: 'Move from generic chat to persistent AI OS with memory, internet, model routing, actions and tool execution.',
  },
  {
    id: 'goal-cheap-best-ai-stack',
    title: 'Use the best AI stack cheaply',
    category: 'Architecture',
    priority: 'High',
    status: 'Active',
    target: 'Use cheap standard model by default, Deep Think only when useful, Internet Scan only when needed, and memory every time.',
  },
];

const SEED_PLANS = [
  {
    id: 'seed-plan-core-roadmap-070',
    title: 'Core Self Genesis roadmap',
    status: 'Active',
    summary: '0.7.0 focuses on Dylan Core intelligence: seed context, action queue, better routing, internet status and mobile usability.',
    nextAction: 'Test Dylan Core with code help, latest web search, action queue and memory questions.',
  },
];

function activeOnly(items = []) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item && item.status !== 'Archived' && item.status !== 'Rejected');
}

function itemKey(item = {}) {
  return item.id || item.title || item.name || item.content;
}

function mergeSeeds(seedItems, userItems) {
  const existing = activeOnly(userItems);
  const existingKeys = new Set(existing.map(itemKey).filter(Boolean));
  const seedsToAdd = seedItems.filter((item) => !existingKeys.has(itemKey(item)));
  return [...seedsToAdd, ...existing];
}

export function seedCoreSelfData() {
  const memories = load('memories', []);
  const projects = load('projects', []);
  const goals = load('goals', []);
  const plans = load('plans', []);

  const nextMemories = mergeSeeds(SEED_MEMORIES, memories);
  const nextProjects = mergeSeeds(SEED_PROJECTS, projects);
  const nextGoals = mergeSeeds(SEED_GOALS, goals);
  const nextPlans = mergeSeeds(SEED_PLANS, plans);

  save('memories', nextMemories);
  save('projects', nextProjects);
  save('goals', nextGoals);
  save('plans', nextPlans);

  return {
    memories: nextMemories.length,
    projects: nextProjects.length,
    goals: nextGoals.length,
    plans: nextPlans.length,
  };
}

function wantsLiveInternet(input = '') {
  return /\b(today|latest|current|news|search|internet|google|look up|price|prices|release|version|now|2026|recent|live|web|source|sources|verify|check online)\b/i.test(input || '');
}

function wantsCodingHelp(input = '') {
  return /\b(code|coding|build|fix|debug|bug|zip|replacement|file|deploy|vercel|firebase|github|commit|push|npm|react|vite|api|javascript|jsx|css|html|typescript|node|terminal|command)\b/i.test(input || '');
}

function wantsDeepReasoning(input = '') {
  return /\b(deep|strategy|architecture|roadmap|business plan|funding|refactor|complex|compare|decide|analyse|analyze|reason|system design|model router|action engine|hard problem|best option)\b/i.test(input || '');
}

function actionTypeFor(input = '') {
  const lower = String(input || '').toLowerCase();
  if (/\b(remind|reminder|tomorrow|later|next week|tonight|morning|afternoon|evening)\b/.test(lower)) return 'reminder';
  if (/\b(task|todo|to-do|do this|need to)\b/.test(lower)) return 'task';
  if (/\b(project|feature|build|fix|code|debug|deploy|commit|zip|replacement|terminal|command)\b/.test(lower)) return 'code_plan';
  if (/\b(goal|target|aim|objective)\b/.test(lower)) return 'goal_update';
  if (/\b(memory|remember|save this|learn this)\b/.test(lower)) return 'memory_update';
  return 'note';
}

function buildPreparedActions(input = '', routeProfile = 'standard') {
  const clean = String(input || '').trim();
  if (!clean) return [];
  const type = actionTypeFor(clean);
  const actions = [];
  const idBase = Date.now();

  const add = (action) => actions.push({ id: `action-${idBase}-${actions.length}`, status: 'prepared', ...action });

  if (type === 'reminder') add({ type: 'reminder', title: 'Prepare reminder', detail: clean, nextStep: 'Confirm exact date/time, then save it as a real reminder when reminder tools are connected.' });
  if (type === 'task') add({ type: 'task', title: 'Create task', detail: clean, nextStep: 'Save this to Action Queue or convert it into a project task.' });
  if (type === 'code_plan') add({ type: 'code_plan', title: 'Prepare code/build plan', detail: clean, nextStep: 'List changed files, provide replacements, run build, deploy, commit, and push.' });
  if (type === 'goal_update') add({ type: 'goal_update', title: 'Update goal', detail: clean, nextStep: 'Save this as a goal update after confirming wording.' });
  if (type === 'memory_update') add({ type: 'memory_update', title: 'Save memory', detail: clean, nextStep: 'Convert this into a permanent memory if it will matter later.' });
  if (!actions.length && (routeProfile === 'deep-think' || routeProfile === 'internet-scan')) add({ type: 'review', title: 'Review for next action', detail: clean, nextStep: 'Save the useful conclusion as memory, task, goal or project update.' });

  return actions.slice(0, 3);
}

function routeProfileFor(input, deepThink) {
  if (wantsLiveInternet(input)) return deepThink ? 'deep-internet-scan' : 'internet-scan';
  if (deepThink) return 'deep-think';
  if (wantsCodingHelp(input)) return 'coding-standard';
  if (wantsDeepReasoning(input)) return 'standard-deep-recommended';
  return 'standard';
}

function buildContext({ input, mode, projects, goals, plans, messages, relevantMemories, deepThink }) {
  const routeProfile = routeProfileFor(input, deepThink);
  return {
    input,
    mode,
    deepThink: Boolean(deepThink),
    routeProfile,
    preparedActions: buildPreparedActions(input, routeProfile),
    deepRecommended: wantsDeepReasoning(input) || wantsCodingHelp(input),
    codingRequest: wantsCodingHelp(input),
    internetNeeded: wantsLiveInternet(input),
    relevantMemories: relevantMemories.map((memory) => ({
      title: memory.title,
      type: memory.type,
      level: memory.level,
      importance: memory.importance,
      content: memory.content,
      lesson: memory.lesson,
      futureAction: memory.futureAction,
      relationshipTags: memory.relationshipTags || [],
    })),
    projects: projects.slice(0, 12).map((project) => ({
      name: project.name || project.title,
      status: project.status,
      priority: project.priority,
      purpose: project.purpose || project.description,
      nextAction: project.nextAction,
    })),
    goals: goals.slice(0, 12).map((goal) => ({
      title: goal.title,
      category: goal.category,
      priority: goal.priority,
      status: goal.status,
      target: goal.target || goal.description,
    })),
    plans: plans.slice(0, 8).map((plan) => ({
      title: plan.title || plan.name,
      summary: plan.summary,
      nextAction: plan.nextAction,
      status: plan.status,
    })),
    messages: messages.slice(-12).map((message) => ({ from: message.from, text: message.text })),
  };
}

async function callCoreApi(payload) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Core API failed with ${response.status}`);
  return data;
}

function codingAwareFallback(input, mode, relevantMemories) {
  if (wantsCodingHelp(input)) {
    return `Yes. I can help with this build.

What I can do:
1. identify the exact files/layer,
2. write replacement code,
3. give build/deploy/commit commands,
4. diagnose screenshots and terminal errors,
5. keep changes small and shippable.

Next step: send the latest ZIP, file, screenshot, or error and I’ll turn it into exact replacements.`;
  }
  return coreReply(input, mode, relevantMemories);
}

export async function routeCoreRequest({ input, mode, memories = [], projects = [], goals = [], plans = [], messages = [], deepThink = false }) {
  const mergedMemories = mergeSeeds(SEED_MEMORIES, memories);
  const mergedProjects = mergeSeeds(SEED_PROJECTS, projects);
  const mergedGoals = mergeSeeds(SEED_GOALS, goals);
  const mergedPlans = mergeSeeds(SEED_PLANS, plans);
  const relevantMemories = retrieveRelevantMemories(input, mergedMemories, deepThink ? 14 : 9);

  const context = buildContext({
    input,
    mode,
    projects: mergedProjects,
    goals: mergedGoals,
    plans: mergedPlans,
    messages,
    relevantMemories,
    deepThink,
  });

  try {
    const result = await callCoreApi(context);
    return {
      mode,
      provider: result.provider || 'dylan-core',
      model: result.model || (deepThink ? 'deep-think-configured' : 'standard-configured'),
      confidence: result.confidence || 0.88,
      reply: result.reply,
      source: result.source || 'dylan-core-engine',
      routeProfile: result.diagnostics?.routeProfile || routeProfileFor(input, deepThink),
      preparedActions: result.preparedActions || context.preparedActions || [],
      deepRecommended: Boolean(result.diagnostics?.deepRecommended || wantsDeepReasoning(input) || wantsCodingHelp(input)),
      latencyMs: result.latencyMs || null,
      error: result.internetError || null,
      internetNeeded: Boolean(result.internetNeeded || context.internetNeeded),
      internetUsed: Boolean(result.internetUsed),
      sources: Array.isArray(result.sources) ? result.sources : [],
      codingRequest: Boolean(result.codingRequest || context.codingRequest),
      contextUsed: {
        memories: mergedMemories.length,
        relevantMemories: relevantMemories.length,
        projects: mergedProjects.length,
        goals: mergedGoals.length,
        plans: mergedPlans.length,
        messages: messages.length,
        seededMemories: SEED_MEMORIES.length,
        seededProjects: SEED_PROJECTS.length,
        seededGoals: SEED_GOALS.length,
      },
      relevantMemories,
    };
  } catch (error) {
    return {
      mode,
      provider: 'local-fallback',
      model: 'offline-core-reply',
      confidence: 0.48,
      reply: `${codingAwareFallback(input, mode, relevantMemories)}

Core AI note: real AI failed safely.

Status: ${error.message}

What to check:
1. Vercel has OPENAI_API_KEY on the current deployment.
2. The deployment was redeployed after adding/changing the key.
3. OpenAI API billing/credits are active.
4. The selected model is available.`,
      source: 'local-fallback',
      routeProfile: routeProfileFor(input, deepThink),
      preparedActions: context.preparedActions || [],
      deepRecommended: wantsDeepReasoning(input) || wantsCodingHelp(input),
      latencyMs: null,
      error: error.message,
      internetNeeded: wantsLiveInternet(input),
      internetUsed: false,
      sources: [],
      codingRequest: wantsCodingHelp(input),
      contextUsed: {
        memories: mergedMemories.length,
        relevantMemories: relevantMemories.length,
        projects: mergedProjects.length,
        goals: mergedGoals.length,
        plans: mergedPlans.length,
        messages: messages.length,
        seededMemories: SEED_MEMORIES.length,
        seededProjects: SEED_PROJECTS.length,
        seededGoals: SEED_GOALS.length,
      },
      relevantMemories,
    };
  }
}
