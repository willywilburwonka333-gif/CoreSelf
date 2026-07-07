import { presenceLine } from './presenceEngine';

export function coreReply(input, mode, relevantMemories = []) {
  const text = input.toLowerCase();

  if (text.includes('next')) {
    return 'Next: connect Memory, Life Graph, Projects, and Goals through the AI Router. That is how Dylan Core begins to think with context.';
  }

  if (text.includes('remember') || text.includes('save')) {
    return 'Memory noted. Store it in Memory Vault so I can use it as part of Dylan’s Life Graph.';
  }

  if (text.includes('what do you know') || text.includes('about me')) {
    if (!relevantMemories.length) {
      return 'I only know what has been saved into Memory, Projects, Goals, and Life Graph. Add more memories so I can become more Dylan.';
    }
    return `I found ${relevantMemories.length} relevant saved memory item(s). The strongest one is: ${relevantMemories[0].title || relevantMemories[0].content}`;
  }

  if (text.includes('why')) {
    return 'Because every part of Core Self must answer one question: does this help Dylan become closer to his highest potential?';
  }

  return presenceLine(mode);
}
