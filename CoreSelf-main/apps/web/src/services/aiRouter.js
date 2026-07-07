import { coreReply } from './coreReply';
import { retrieveRelevantMemories } from './memoryRetrieval';

function buildContext({ input, mode, memories, projects, goals, relevantMemories }) {
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
  };
}

async function callCoreApi(payload) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Core API failed with ${response.status}`);
  }

  return response.json();
}

export async function routeCoreRequest({ input, mode, memories = [], projects = [], goals = [] }) {
  const relevantMemories = retrieveRelevantMemories(input, memories, 6);
  const context = buildContext({ input, mode, memories, projects, goals, relevantMemories });

  try {
    const result = await callCoreApi(context);
    return {
      mode,
      provider: result.provider || 'openai-vercel-api',
      confidence: result.confidence || 0.76,
      reply: result.reply,
      source: 'remote-ai',
      error: null,
      contextUsed: {
        memories: memories.length,
        relevantMemories: relevantMemories.length,
        projects: projects.length,
        goals: goals.length,
      },
      relevantMemories,
    };
  } catch (error) {
    return {
      mode,
      provider: 'local-fallback',
      confidence: 0.44,
      reply: `${coreReply(input, mode, relevantMemories)}\n\nCore AI note: remote AI is not connected yet or failed safely. Add OPENAI_API_KEY in Vercel Environment Variables, then redeploy Genesis 0.0.9.`,
      source: 'local-fallback',
      error: error.message,
      contextUsed: {
        memories: memories.length,
        relevantMemories: relevantMemories.length,
        projects: projects.length,
        goals: goals.length,
      },
      relevantMemories,
    };
  }
}
