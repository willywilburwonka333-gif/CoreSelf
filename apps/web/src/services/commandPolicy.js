const DIRECT_ACTION_VERBS = ['make', 'create', 'generate', 'draw', 'design', 'render', 'produce', 'build'];
const IMAGE_TARGETS = ['image', 'picture', 'photo', 'thumbnail', 'cover', 'poster', 'logo', 'banner', 'mockup', 'visual', 'artwork', 'wallpaper', 'icon', 'graphic'];
const ANALYSIS_WORDS = ['analyse', 'analyze', 'inspect', 'read', 'identify', 'what is', "what's", 'describe', 'explain', 'look at'];

export const COMMAND_POLICY = {
  automatic: [
    'answer questions',
    'generate images',
    'analyse uploaded files',
    'read PDFs and documents when the analyser route supports them',
    'draft code, plans, prompts, documents and marketing copy',
    'search or reason when a safe route exists',
  ],
  requiresApproval: [
    'send email or messages',
    'spend money or change accounts',
    'delete or overwrite important data',
    'push to GitHub, deploy to production, or modify Firebase/Vercel',
    'contact another person',
    'run background automations while Dylan is away',
  ],
};

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

export function isDirectImageCommand(input = '') {
  const text = String(input || '').toLowerCase();
  if (!text.trim()) return false;
  const hasCreateVerb = DIRECT_ACTION_VERBS.some((verb) => new RegExp(`\\b${verb}\\b`, 'i').test(text));
  const hasImageTarget = hasAny(text, IMAGE_TARGETS);
  const analysisOnly = hasAny(text, ANALYSIS_WORDS) && !hasCreateVerb;
  return hasCreateVerb && hasImageTarget && !analysisOnly;
}

export function requiresHumanApproval(input = '') {
  const text = String(input || '').toLowerCase();
  return /\b(send|email|message|sms|call|contact|buy|purchase|pay|spend|delete|wipe|remove permanently|push|deploy|publish|firebase|vercel|github|background|automatic|automate|remind me|schedule)\b/.test(text);
}

export function stripApprovalNoise(text = '') {
  return String(text || '')
    .split('\n')
    .filter((line) => {
      const clean = line.toLowerCase();
      if (clean.includes('approve') && clean.includes('image')) return false;
      if (clean.includes('approval') && clean.includes('image')) return false;
      if (clean.includes('pending approval')) return false;
      if (clean.includes('you\'ll need to approve')) return false;
      if (clean.includes('need your approval') && clean.includes('generate')) return false;
      if (clean.includes('ui once') && clean.includes('ready')) return false;
      if (clean.includes('/api/create-image') && clean.includes('approve')) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
