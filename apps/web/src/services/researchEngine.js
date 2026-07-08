const CORE_STACK = ['React/Vite frontend', 'Vercel deployment', 'Firebase Auth/Firestore', 'OpenAI API brain', 'local/cloud memory', 'future server-side tool routes'];

const HYPE_FLAGS = [
  { regex: /\b\$?\d+\s*(ai|agent|assistant).*\b(esp32|microcontroller|risc-v|gpio|pwm|sensor|iot)\b/i, warning: 'Embedded/IoT tool. Interesting, but probably not useful for Core Self\'s web app unless building hardware later.' },
  { regex: /\b(fully autonomous|no dependencies|runs on \$?\d+|under \d+\s*(mb|kb)|replaces chatgpt)\b/i, warning: 'Strong marketing claim. Verify repo activity, docs, licensing and real API fit before adopting.' },
  { regex: /\b(local|offline|ollama|llama|deepseek|mistral)\b/i, warning: 'Local model path. Useful later for cost/privacy, but Dylan\'s current hosted app still needs server-side orchestration.' },
];

function scoreCapability(text = '') {
  const lower = text.toLowerCase();
  let score = 0;
  if (/openai|responses|tool calling|function calling|api|sdk/.test(lower)) score += 4;
  if (/vercel|serverless|edge|node|react|vite|javascript/.test(lower)) score += 3;
  if (/firebase|firestore|auth|database|storage/.test(lower)) score += 3;
  if (/github|repo|commit|pull request|ci|deployment/.test(lower)) score += 3;
  if (/image|video|music|voice|document|pdf|docx/.test(lower)) score += 2;
  if (/esp32|microcontroller|gpio|sensor|iot|risc-v/.test(lower)) score -= 3;
  if (/dead|archived|deprecated|unmaintained/.test(lower)) score -= 5;
  return Math.max(0, Math.min(10, score));
}

function fitLabel(score) {
  if (score >= 8) return 'Strong fit';
  if (score >= 5) return 'Possible fit';
  if (score >= 3) return 'Later/limited fit';
  return 'Poor fit';
}

export function buildResearchPlan({ input = '', sources = [] } = {}) {
  const sourceText = Array.isArray(sources)
    ? sources.map((source) => `${source.title || ''} ${source.url || ''}`).join(' ')
    : '';
  const text = `${input} ${sourceText}`;
  const score = scoreCapability(text);
  const flags = HYPE_FLAGS.filter((flag) => flag.regex.test(text)).map((flag) => flag.warning);

  return {
    version: 'milestone-2-research',
    stack: CORE_STACK,
    requested: Boolean(input),
    fitScore: score,
    fitLabel: fitLabel(score),
    flags,
    comparisonRules: [
      'Compare every recommendation to React/Vite + Firebase + Vercel + OpenAI.',
      'Prefer tools that can be called from secure server routes.',
      'Reject novelty tools that do not improve Dylan\'s actual workflow.',
      'Separate now, later, and skip.',
      'Cite web sources when web results are present.',
    ],
    outputShape: ['Best options now', 'Useful later', 'Skip/ignore', 'Implementation order', 'What to save or do next'],
  };
}

export function summarizeResearchPlan(plan = {}) {
  if (!plan.requested) return 'Research plan idle.';
  return `${plan.fitLabel || 'Unknown fit'} against Core Self stack • ${plan.flags?.length || 0} caution flag(s)`;
}
