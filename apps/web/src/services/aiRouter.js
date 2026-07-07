import { coreReply } from './coreReply';
import { retrieveRelevantMemories } from './memoryRetrieval';

function buildContext({ input, mode, memories, projects, goals, plans, messages, relevantMemories }) {
  return {
    input,
    mode,
    relevantMemories: relevantMemories.map((memory) => ({
      title: memory.title,
      content: memory.content,
      lesson: memory.lesson,
      futureAction: memory.futureAction,
      relationshipTags: memory.relationshipTags || [],
    })),
    projects: projects.slice(0, 8).map((project) => ({
      name: project.name,
      status: project.status,
      priority: project.priority,
      purpose: project.purpose,
      nextAction: project.nextAction,
    })),
    goals: goals.slice(0, 8).map((goal) => ({
      title: goal.title,
      category: goal.category,
      priority: goal.priority,
      status: goal.status,
      target: goal.target,
    })),
    plans: plans.slice(0, 5).map((plan) => ({
      title: plan.title || plan.name,
      summary: plan.summary,
      nextAction: plan.nextAction,
      status: plan.status,
    })),
    messages: messages.slice(-8).map((message) => ({
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

export async function routeCoreRequest({ input, mode, memories = [], projects = [], goals = [], plans = [], messages = [] }) {
  const relevantMemories = retrieveRelevantMemories(input, memories, 8);
  const context = buildContext({ input, mode, memories, projects, goals, plans, messages, relevantMemories });

  try {
    const result = await callCoreApi(context);
    return {
      mode,
      provider: result.provider || 'openai',
      model: result.model || 'configured-model',
      confidence: result.confidence || 0.82,
      reply: result.reply,
      source: result.source || 'real-ai-brain',
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
      confidence: 0.44,
      reply: `${coreReply(input, mode, relevantMemories)}\n\nCore AI note: Real AI failed safely.

Status: ${error.message}

What to check:
1. Vercel has OPENAI_API_KEY on the current deployment.
2. The deployment was redeployed after adding the key.
3. OpenAI API billing/credits are active.
4. The selected model is available.

I am using local Core fallback so the app does not crash.`,
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
