import { coreReply } from './coreReply';
import { retrieveRelevantMemories } from './memoryRetrieval';

function wantsInternet(input = '') {
  return /\b(latest|today|current|internet|web|search|google|look up|news|price|prices|now|live|recent|verify|citation|source)\b/i.test(String(input));
}

function wantsDeep(input = '', reasoningMode = 'standard') {
  return reasoningMode === 'deep' || /\b(deep think|think hard|strategy|architecture|roadmap|business plan|code|coding|debug|decide|decision|analyse|analyze|compare|risk|legal|financial)\b/i.test(String(input));
}

function buildContext({ input, mode, memories, projects, goals, plans, messages, relevantMemories, reasoningMode }) {
  const deep = reasoningMode === 'deep';
  return {
    input,
    mode,
    reasoningMode,
    internetRequested: wantsInternet(input),
    relevantMemories: relevantMemories.map((memory) => ({
      title: memory.title,
      content: memory.content,
      lesson: memory.lesson,
      futureAction: memory.futureAction,
      relationshipTags: memory.relationshipTags || [],
    })),
    projects: projects.slice(0, deep ? 12 : 8).map((project) => ({
      name: project.name,
      title: project.title,
      status: project.status,
      priority: project.priority,
      purpose: project.purpose,
      nextAction: project.nextAction,
    })),
    goals: goals.slice(0, deep ? 12 : 8).map((goal) => ({
      title: goal.title,
      category: goal.category,
      priority: goal.priority,
      status: goal.status,
      target: goal.target,
    })),
    plans: plans.slice(0, deep ? 8 : 5).map((plan) => ({
      title: plan.title || plan.name,
      summary: plan.summary,
      nextAction: plan.nextAction,
      status: plan.status,
    })),
    messages: messages.slice(deep ? -14 : -8).map((message) => ({
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

export async function routeCoreRequest({ input, mode, memories = [], projects = [], goals = [], plans = [], messages = [], reasoningMode = 'standard' }) {
  const deep = wantsDeep(input, reasoningMode);
  const relevantMemories = retrieveRelevantMemories(input, memories, deep ? 12 : 8);
  const context = buildContext({ input, mode, memories, projects, goals, plans, messages, relevantMemories, reasoningMode: deep ? 'deep' : 'standard' });

  try {
    const result = await callCoreApi(context);
    return {
      mode,
      provider: result.provider || 'core-engine',
      model: result.model || 'core-routed',
      route: result.route || (deep ? 'deep_reasoning' : 'standard'),
      reasoningMode: result.reasoningMode || (deep ? 'deep' : 'standard'),
      internetIntent: Boolean(result.internetIntent || context.internetRequested),
      liveScanAvailable: Boolean(result.liveScanAvailable),
      confidence: result.confidence || 0.82,
      reply: result.reply,
      source: result.source || 'dylan-core-engine',
      latencyMs: result.latencyMs || null,
      error: null,
      contextUsed: {
        memories: memories.length,
        relevantMemories: relevantMemories.length,
        projects: projects.length,
        goals: goals.length,
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
      route: deep ? 'deep_fallback' : 'standard_fallback',
      reasoningMode: deep ? 'deep' : 'standard',
      internetIntent: context.internetRequested,
      liveScanAvailable: false,
      confidence: 0.44,
      reply: `${coreReply(input, mode, relevantMemories)}\n\nCore Engine failed safely.\n\nStatus: ${error.message}\n\nCheck:\n1. Vercel has OPENAI_API_KEY on the current deployment.\n2. The deployment was redeployed after adding the key.\n3. API billing/credits are active.\n4. OPENAI_MODEL / OPENAI_DEEP_MODEL are available.`,
      source: 'local-fallback',
      latencyMs: null,
      error: error.message,
      contextUsed: {
        memories: memories.length,
        relevantMemories: relevantMemories.length,
        projects: projects.length,
        goals: goals.length,
        plans: plans.length,
        messages: messages.length,
      },
      relevantMemories,
    };
  }
}
