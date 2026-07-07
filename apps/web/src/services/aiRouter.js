import { coreReply } from './coreReply';

/**
 * Genesis AI Router placeholder.
 * Later this becomes the model router:
 * - OpenAI / Gemini / Claude / Kimi / local models
 * - memory retrieval
 * - tool routing
 * - engine selection
 */
export async function routeCoreRequest({ input, mode, memories = [], projects = [], goals = [] }) {
  return {
    mode,
    provider: 'local-genesis-placeholder',
    confidence: 0.35,
    reply: coreReply(input, mode),
    contextUsed: {
      memories: memories.length,
      projects: projects.length,
      goals: goals.length,
    },
  };
}
