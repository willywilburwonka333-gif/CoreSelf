import { presenceLine } from './presenceEngine';

export function coreReply(input, mode) {
  const text = input.toLowerCase();

  if (text.includes('next')) {
    return 'Next: connect Memory, Projects, Goals, and the Life Graph through the AI Router. That is how Dylan Core begins to think with context.';
  }

  if (text.includes('remember') || text.includes('save')) {
    return 'Memory noted. Store it in Memory Vault so I can use it as part of Dylan’s Life Graph.';
  }

  if (text.includes('why')) {
    return 'Because every part of Core Self must answer one question: does this help Dylan become closer to his highest potential?';
  }

  return presenceLine(mode);
}
