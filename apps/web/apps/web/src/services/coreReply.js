import { presenceLine } from './presenceEngine';

export function coreReply(input, mode, relevantMemories = []) {
  const text = input.toLowerCase();

  if (text.includes('next')) {
    return 'Next: use the Planning Engine. I can now connect memories, projects, goals, and Life Graph context into a practical next-action stack.';
  }

  if (text.includes('remember') || text.includes('save')) {
    return 'Memory detected. I can suggest it for Memory Vault, then link it to projects, goals, and Life Graph context.';
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
