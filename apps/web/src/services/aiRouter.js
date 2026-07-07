import { coreReply } from './coreReply';
import { retrieveRelevantMemories } from './memoryRetrieval';

/**
 * Genesis AI Router placeholder.
 * Later this becomes the model router:
 * - OpenAI / Gemini / Claude / Kimi / local models
 * - memory retrieval
 * - tool routing
 * - engine selection
 */
export async function routeCoreRequest({ input, mode, memories = [], projects = [], goals = [] }) {
  const relevantMemories = retrieveRelevantMemories(input, memories, 5);

  return {
    mode,
    provider: 'local-genesis-placeholder',
    confidence: 0.42,
    reply: coreReply(input, mode, relevantMemories),
    contextUsed: {
      memories: memories.length,
      relevantMemories: relevantMemories.length,
      projects: projects.length,
      goals: goals.length,
    },
    relevantMemories,
  };
}
