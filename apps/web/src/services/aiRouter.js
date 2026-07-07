import { coreReply } from './coreReply';
import { retrieveRelevantMemories } from './memoryRetrieval';

const SEED_MEMORIES = [
  {
    id: 'seed-dylan-core-purpose',
    title: 'Dylan Core purpose',
    content: 'Dylan is building Core Self / Dylan Core as a persistent digital second self and personal AI operating system.',
    lesson: 'Do not behave like a fresh generic chatbot. Use Dylan/project context immediately.',
    futureAction: 'Help Dylan build, debug, plan, deploy, and improve his systems with direct next steps.',
    relationshipTags: ['identity', 'core-self', 'dylan'],
    status: 'Seed',
  },
  {
    id: 'seed-workflow',
    title: 'Preferred build workflow',
    content: 'Dylan prefers either latest ZIP drops or single-file TXT replacements, then npm build, Vercel deploy, git commit, and git push.',
    lesson: 'Be concrete. Give exact commands and exact file paths.',
    futureAction: 'When Dylan asks for fixes, provide only changed files unless he asks for a full ZIP.',
    relationshipTags: ['workflow', 'coding', 'deployment'],
    status: 'Seed',
  },
  {
    id: 'seed-coding-capability',
    title: 'Coding support expectation',
    content: 'Dylan expects Dylan Core to help with code, file replacements, debugging, build errors, deploy commands, architecture, and feature stacks.',
    lesson: 'Never answer coding requests with a dead-end refusal like “I cannot build code directly.”',
    futureAction: 'Explain the practical coding path and produce implementation-ready changes when requested.',
    relationshipTags: ['coding', 'debugging', 'builds'],
    status: 'Seed',
  },
];

const SEED_PROJECTS = [
  {
    id: 'seed-project-core-self',
    name: 'Core Self / Dylan Core',
    status: 'Active Genesis build',
    priority: 'Critical',
    purpose: 'Build a persistent personal AI operating system and digital second self for Dylan Corr.',
    nextAction: 'Finish seed memory, coding capability, live internet scan, model router, and action engine.',
  },
  {
    id: 'seed-project-the-system',
    name: 'THE SYSTEM',
    status: 'Active product/app launch',
    priority: 'High',
    purpose: 'Gamified fitness/RPG life app with ranks, dungeons, AI coach, lore, stores, and marketing.',
    nextAction: 'Keep release stability, store readiness, marketing, and future wearable/action roadmap aligned.',
  },
  {
    id: 'seed-project-dungeon-protocol',
    name: 'Dungeon Protocol',
    status: 'Active game layer',
    priority: 'Medium',
    purpose: 'Inner RPG/battle layer connected to THE SYSTEM universe.',
    nextAction: 'Improve gameplay feel, animations, mobs, bosses, room scale, and battle identity.',
  },
  {
    id: 'seed-project-reality',
    name: 'Reality Project / HSET',
    status: 'Research track',
    priority: 'Medium',
    purpose: 'Investigate reality through rigorous formalisation, comparison with mathematics/physics, and careful theory development.',
    nextAction: 'Formalise definitions before making stronger claims.',
  },
];

const SEED_GOALS = [
  {
    id: 'seed-goal-dylan-maximiser',
    title: 'Maximise Dylan Corr',
    category: 'Core Life System',
    priority: 'Critical',
    status: 'Active',
    target: 'Use Core Self to improve family time, work output, product building, financial freedom, health, knowledge, and long-term control.',
  },
  {
    id: 'seed-goal-useful-ai',
    title: 'Make Dylan Core useful, not just chatty',
    category: 'Product',
    priority: 'Critical',
    status: 'Active',
    target: 'Add seed memory, coding support, internet scan, model routing, memory retrieval, and tool/action capability.',
  },
  {
    id: 'seed-goal-cheap-best-ai',
    title: 'Use the best AI stack cheaply',
    category: 'Architecture',
    priority: 'High',
    status: 'Active',
    target: 'Cheap fast model by default, stronger Deep Think only when needed, internet only when needed, memory every time.',
  },
];

const SEED_PLANS = [
  {
    id: 'seed-plan-core-roadmap',
    title: 'Core Self Genesis roadmap',
    status: 'Active',
    summary: '0.5.2 seed memory + coding capability, 0.5.3 live internet scan, 0.6 model router/deep think, 0.6.1 action engine + memory approval.',
    nextAction: 'Build Action Engine foundation and approve/reject useful memory suggestions from Talk.',
  },
];

function activeOnly(items = []) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item && item.status !== 'Archived' && item.status !== 'Rejected');
}


function wantsLiveInternet(input = '') {
  return /\b(today|latest|current|news|search|internet|google|look up|price|prices|release|version|now|2026|recent|live|web)\b/i.test(input || '');
}

function wantsCodingHelp(input = '') {
  return /\b(code|coding|build|fix|debug|bug|zip|replacement|file|deploy|vercel|firebase|github|commit|push|npm|react|vite|api|javascript|jsx|css|html|typescript|node)\b/i.test(input || '');
}

function wantsDeepReasoning(input = '') {
  return /\b(deep|strategy|architecture|roadmap|business plan|funding|refactor|complex|compare|decide|analyse|analyze|reason|system design|model router|action engine|hard problem)\b/i.test(input || '');
}


function actionTypeFor(input = '') {
  const lower = String(input || '').toLowerCase();
  if (/\b(remind|reminder|tomorrow|later|next week|tonight|morning|afternoon|evening)\b/.test(lower)) return 'reminder';
  if (/\b(task|todo|to-do|do this|need to)\b/.test(lower)) return 'task';
  if (/\b(project|feature|build|fix|code|debug|deploy|commit|zip|replacement)\b/.test(lower)) return 'code_plan';
  if (/\b(goal|target|aim|objective)\b/.test(lower)) return 'goal_update';
  return 'note';
}

function buildPreparedActions(input = '', routeProfile = 'standard') {
  const clean = String(input || '').trim();
  if (!clean) return [];
  const type = actionTypeFor(clean);
  const actions = [];

  if (type === 'reminder') {
    actions.push({
      id: `action-${Date.now()}-reminder`,
      type: 'reminder',
      title: 'Prepare reminder',
      detail: clean,
      status: 'prepared',
      nextStep: 'Confirm the exact time/date before turning this into a real reminder.',
    });
  }

  if (type === 'task') {
    actions.push({
      id: `action-${Date.now()}-task`,
      type: 'task',
      title: 'Create task',
      detail: clean,
      status: 'prepared',
      nextStep: 'Save this to the action queue or convert it into a goal/project task.',
    });
  }

  if (type === 'code_plan') {
    actions.push({
      id: `action-${Date.now()}-code`,
      type: 'code_plan',
      title: 'Prepare code/build plan',
      detail: clean,
      status: 'prepared',
      nextStep: 'Identify changed files, give exact replacements, then run build, deploy, commit and push.',
    });
  }

  if (type === 'goal_update') {
    actions.push({
      id: `action-${Date.now()}-goal`,
      type: 'goal_update',
      title: 'Update goal',
      detail: clean,
      status: 'prepared',
      nextStep: 'Save this as a goal update after Dylan confirms the wording.',
    });
  }

  if (!actions.length && (routeProfile === 'deep-think' || routeProfile === 'internet-scan')) {
    actions.push({
      id: `action-${Date.now()}-review`,
      type: 'review',
      title: 'Review answer for next action',
      detail: clean,
      status: 'prepared',
      nextStep: 'If useful, save the conclusion as memory, task, project update, or goal update.',
    });
  }

  return actions.slice(0, 3);
}

function routeProfileFor(input, deepThink) {
  if (wantsLiveInternet(input)) return 'internet-scan';
  if (deepThink) return 'deep-think';
  if (wantsCodingHelp(input)) return 'coding-standard';
  if (wantsDeepReasoning(input)) return 'standard-deep-recommended';
  return 'standard';
}

function mergeSeeds(seedItems, userItems, key = 'id') {
  const existing = activeOnly(userItems);
  const existingKeys = new Set(existing.map((item) => item?.[key] || item?.title || item?.name));
  const seedsToAdd = seedItems.filter((item) => !existingKeys.has(item?.[key] || item?.title || item?.name));
  return [...seedsToAdd, ...existing];
}

function buildContext({ input, mode, memories, projects, goals, plans, messages, relevantMemories, deepThink }) {
  return {
    input,
    mode,
    deepThink: Boolean(deepThink),
    routeProfile: routeProfileFor(input, deepThink),
    preparedActions: buildPreparedActions(input, routeProfileFor(input, deepThink)),
    deepRecommended: wantsDeepReasoning(input) || wantsCodingHelp(input),
    codingRequest: wantsCodingHelp(input),
    internetNeeded: wantsLiveInternet(input),
    relevantMemories: relevantMemories.map((memory) => ({
      title: memory.title,
      content: memory.content,
      lesson: memory.lesson,
      futureAction: memory.futureAction,
      relationshipTags: memory.relationshipTags || [],
    })),
    projects: projects.slice(0, 10).map((project) => ({
      name: project.name || project.title,
      status: project.status,
      priority: project.priority,
      purpose: project.purpose || project.description,
      nextAction: project.nextAction,
    })),
    goals: goals.slice(0, 10).map((goal) => ({
      title: goal.title,
      category: goal.category,
      priority: goal.priority,
      status: goal.status,
      target: goal.target || goal.description,
    })),
    plans: plans.slice(0, 6).map((plan) => ({
      title: plan.title || plan.name,
      summary: plan.summary,
      nextAction: plan.nextAction,
      status: plan.status,
    })),
    messages: messages.slice(-10).map((message) => ({
      from: message.from,
      text: message.text,
    })),
  };
}

async function callCoreApi(payload) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Core API failed with ${response.status}`);
  }

  return data;
}

function codingAwareFallback(input, mode, relevantMemories) {
  if (/\b(code|coding|build|fix|debug|bug|zip|replacement|deploy|vercel|firebase|github|commit|push|npm|react|vite|api|javascript|jsx|css|html)\b/i.test(input || '')) {
    return `Yes. I can help with the coding workflow.

What I can do here:
1. read the error or feature request,
2. identify the file/layer that needs changing,
3. give exact replacement code or commands,
4. guide build, deploy, commit, and push.

Next step: send the exact error, screenshot, or feature stack and I’ll turn it into file-level changes.`;
  }

  return coreReply(input, mode, relevantMemories);
}

export async function routeCoreRequest({ input, mode, memories = [], projects = [], goals = [], plans = [], messages = [], deepThink = false }) {
  const mergedMemories = mergeSeeds(SEED_MEMORIES, memories, 'id');
  const mergedProjects = mergeSeeds(SEED_PROJECTS, projects, 'id');
  const mergedGoals = mergeSeeds(SEED_GOALS, goals, 'id');
  const mergedPlans = mergeSeeds(SEED_PLANS, plans, 'id');
  const relevantMemories = retrieveRelevantMemories(input, mergedMemories, deepThink ? 12 : 8);
  const context = buildContext({
    input,
    mode,
    memories: mergedMemories,
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
      internetNeeded: Boolean(result.internetNeeded),
      internetUsed: Boolean(result.internetUsed),
      sources: Array.isArray(result.sources) ? result.sources : [],
      codingRequest: Boolean(result.codingRequest),
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

Core AI note: Real AI failed safely.

Status: ${error.message}

What to check:
1. Vercel has OPENAI_API_KEY on the current deployment.
2. The deployment was redeployed after adding the key.
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
