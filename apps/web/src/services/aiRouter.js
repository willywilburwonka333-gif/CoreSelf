import { coreReply } from './coreReply';
import { retrieveRelevantMemories } from './memoryRetrieval';

function activeOnly(items = []) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => {
    const status = String(item.status || '').toLowerCase();
    return !status.includes('archived') && !status.includes('done') && !status.includes('complete');
  });
}

function buildContext({ input, mode, memories, projects, goals, plans, messages, relevantMemories, deepThink }) {
  const activeProjects = activeOnly(projects);
  const activeGoals = activeOnly(goals);
  const activePlans = activeOnly(plans);

  return {
    input,
    mode,
    deepThink: Boolean(deepThink),
    relevantMemories: relevantMemories.map((memory) => ({
      title: memory.title,
      content: memory.content,
      lesson: memory.lesson,
      futureAction: memory.futureAction,
      relationshipTags: memory.relationshipTags || [],
    })),
    projects: activeProjects.slice(0, 10).map((project) => ({
      name: project.name,
      status: project.status,
      priority: project.priority,
      purpose: project.purpose,
      nextAction: project.nextAction,
    })),
    goals: activeGoals.slice(0, 10).map((goal) => ({
      title: goal.title,
      category: goal.category,
      priority: goal.priority,
      status: goal.status,
      target: goal.target,
    })),
    plans: activePlans.slice(0, 6).map((plan) => ({
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

export async function routeCoreRequest({ input, mode, memories = [], projects = [], goals = [], plans = [], messages = [], deepThink = false }) {
  const relevantMemories = retrieveRelevantMemories(input, memories, deepThink ? 12 : 8);
  const context = buildContext({ input, mode, memories, projects, goals, plans, messages, relevantMemories, deepThink });

  try {
    const result = await callCoreApi(context);
    return {
      mode,
      provider: result.provider || 'core-provider',
      model: result.model || 'configured-model',
      confidence: result.confidence || 0.84,
      reply: result.reply,
      source: result.source || 'dylan-core-engine',
      latencyMs: result.latencyMs || null,
      error: null,
      internetNeeded: Boolean(result.internetNeeded),
      contextUsed: {
        memories: memories.length,
        relevantMemories: relevantMemories.length,
        projects: context.projects.length,
        goals: context.goals.length,
        plans: context.plans.length,
        messages: context.messages.length,
      },
      relevantMemories,
    };
  } catch (error) {
    return {
      mode,
      provider: 'local-fallback',
      model: 'offline-core-reply',
      confidence: 0.44,
      reply: `${coreReply(input, mode, relevantMemories)}\n\nDylan Core note: provider route failed safely.\n\nStatus: ${error.message}\n\nCheck Vercel env vars, billing/credits, deployment, and /api/chat logs.`,
      source: 'local-fallback',
      latencyMs: null,
      error: error.message,
      internetNeeded: false,
      contextUsed: {
        memories: memories.length,
        relevantMemories: relevantMemories.length,
        projects: activeOnly(projects).length,
        goals: activeOnly(goals).length,
        plans: activeOnly(plans).length,
        messages: messages.length,
      },
      relevantMemories,
    };
  }
}
