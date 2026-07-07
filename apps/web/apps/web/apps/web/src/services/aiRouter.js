import { coreReply } from './coreReply';
import { retrieveRelevantMemories } from './memoryRetrieval';
import { coreSeedMemories } from '../data/coreSeeds';
import { defaultProjects, defaultGoals } from '../data/defaults';

function mergeById(primary = [], fallback = []) {
  const seen = new Set();
  return [...primary, ...fallback].filter((item) => {
    const key = item?.id || item?.title || item?.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function wantsDeepThink(input = '', explicitDeep = false) {
  if (explicitDeep) return true;
  return /deep think|deep mode|think deeply|architecture|strategy|business plan|funding|code|debug|fix|rewrite|roadmap|decision|compare|research/i.test(input);
}

function wantsInternet(input = '') {
  return /internet|web|search|google|latest|today|current|news|price|prices|live|look up|browse/i.test(input);
}

function buildContext({ input, mode, memories, projects, goals, plans, messages, relevantMemories, route }) {
  return {
    input,
    mode,
    route,
    relevantMemories: relevantMemories.map((memory) => ({
      title: memory.title,
      content: memory.content,
      lesson: memory.lesson,
      futureAction: memory.futureAction,
      relationshipTags: memory.relationshipTags || [],
      importance: memory.importance,
      level: memory.level,
    })),
    projects: projects.slice(0, 10).map((project) => ({
      name: project.name,
      status: project.status,
      priority: project.priority,
      purpose: project.purpose,
      nextAction: project.nextAction,
      engine: project.engine,
    })),
    goals: goals.slice(0, 10).map((goal) => ({
      title: goal.title,
      category: goal.category,
      priority: goal.priority,
      status: goal.status,
      target: goal.target,
    })),
    plans: plans.slice(0, 6).map((plan) => ({
      title: plan.title || plan.name,
      summary: plan.summary,
      nextAction: plan.nextAction,
      status: plan.status,
    })),
    messages: messages.slice(-10).map((message) => ({
      from: message.from,
      text: String(message.text || '').slice(0, 1200),
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

export async function routeCoreRequest({ input, mode, memories = [], projects = [], goals = [], plans = [], messages = [], deepThink = false }) {
  const memoryBank = mergeById(memories, coreSeedMemories);
  const projectBank = mergeById(projects, defaultProjects);
  const goalBank = mergeById(goals, defaultGoals);
  const route = {
    reasoning: wantsDeepThink(input, deepThink) ? 'deep' : 'standard',
    internetRequested: wantsInternet(input),
    internetAvailable: false,
    visionAvailable: false,
    version: 'Genesis 0.5.0',
  };

  const relevantMemories = retrieveRelevantMemories(input, memoryBank, route.reasoning === 'deep' ? 10 : 7);
  const context = buildContext({ input, mode, memories: memoryBank, projects: projectBank, goals: goalBank, plans, messages, relevantMemories, route });

  try {
    const result = await callCoreApi(context);
    return {
      mode,
      provider: result.provider || 'core-provider',
      model: result.model || 'core-engine',
      confidence: result.confidence || 0.86,
      reply: result.reply,
      source: result.source || 'dylan-core-engine',
      latencyMs: result.latencyMs || null,
      error: null,
      route: result.route || route,
      contextUsed: {
        memories: memoryBank.length,
        relevantMemories: relevantMemories.length,
        projects: projectBank.length,
        goals: goalBank.length,
        plans: plans.length,
        messages: messages.length,
      },
      relevantMemories,
    };
  } catch (error) {
    return {
      mode,
      provider: 'local-fallback',
      model: 'offline-core-reply',
      confidence: 0.44,
      reply: `${coreReply(input, mode, relevantMemories)}\n\nCore status: cloud reasoning failed safely.\n\n${error.message}\n\nNext check: Vercel environment variables, API billing/credits, and latest production deployment.`,
      source: 'local-fallback',
      latencyMs: null,
      error: error.message,
      route,
      contextUsed: {
        memories: memoryBank.length,
        relevantMemories: relevantMemories.length,
        projects: projectBank.length,
        goals: goalBank.length,
        plans: plans.length,
        messages: messages.length,
      },
      relevantMemories,
    };
  }
}
