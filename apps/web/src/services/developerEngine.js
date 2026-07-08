const DEVELOPER_WORKFLOWS = [
  {
    id: 'zip-audit',
    label: 'ZIP / Repo Audit',
    regex: /\b(zip|uploaded zip|latest zip|repo|repository|audit|inspect|source of truth|baseline)\b/i,
    output: 'audit first, identify existing architecture, then change only required files',
    needsFileContext: true,
  },
  {
    id: 'bug-fix',
    label: 'Bug Fix / Crash Triage',
    regex: /\b(bug|crash|error|broken|stuck|blank screen|white screen|console|terminal|failed|doesn\'?t work|not working)\b/i,
    output: 'diagnosis from the exact error, minimal fix, test commands and fallback step',
    needsFileContext: true,
  },
  {
    id: 'feature-build',
    label: 'Feature Build',
    regex: /\b(add|build|create|implement|update|upgrade|phase|milestone|stack|feature|screen|engine|route|api)\b/i,
    output: 'safe stack, changed files only, build/check commands, commit message and next milestone',
    needsFileContext: true,
  },
  {
    id: 'deployment',
    label: 'Deploy / Release Ops',
    regex: /\b(deploy|vercel|production|preview|commit|push|github|firebase|env|api key|build|npm run build|npm run check)\b/i,
    output: 'exact command sequence, environment checks and release validation',
    needsFileContext: false,
  },
  {
    id: 'single-file-replacements',
    label: 'Single-file Replacement Workflow',
    regex: /\b(single file|single-file|replacement|txt file|changed files|copy|paste|filename|file names|create file)\b/i,
    output: 'individual replacement filenames, exact project paths, new vs existing file separation',
    needsFileContext: false,
  },
];

const PROJECT_STACK_RULES = [
  'Use the latest uploaded ZIP or latest committed repo as source of truth.',
  'Inspect before changing; do not recreate systems that already exist.',
  'Only change files that genuinely need changing.',
  'For new files, provide the exact path and exact filename.',
  'For replacement files, provide individual TXT files or exact copy targets when Dylan asks for them.',
  'Always include npm run build and npm run check before commit when the web app changes.',
  'Commit from repo root, not apps/web.',
  'Do not claim a build/check passed unless it was actually run.',
  'Never put API keys in frontend code.',
  'External write tools such as GitHub/Vercel/Firebase need explicit setup and approval gates.',
];

const KNOWN_STACK = [
  'React + Vite frontend in apps/web',
  'Vercel serverless API routes in apps/web/api',
  'Firebase/Auth/Firestore service layer already present',
  'OpenAI key stored server-side as OPENAI_API_KEY',
  'Core app uses local/cloud storage, memory, projects, goals, plans, actions, tools and Talk screen',
];

function unique(items = []) {
  return [...new Set(items.filter(Boolean))];
}

export function detectDeveloperWorkflows(input = '') {
  const text = String(input || '');
  return DEVELOPER_WORKFLOWS.filter((workflow) => workflow.regex.test(text));
}

export function isDeveloperRequest(input = '') {
  return detectDeveloperWorkflows(input).length > 0 || /\b(code|coding|debug|javascript|jsx|css|html|node|vite|react|api|firebase|vercel|github|terminal|command)\b/i.test(String(input || ''));
}

export function buildDeveloperPlan({ input = '', projects = [], goals = [], tools = [] } = {}) {
  const workflows = detectDeveloperWorkflows(input);
  const isRequest = isDeveloperRequest(input);
  const primary = workflows[0] || (isRequest ? DEVELOPER_WORKFLOWS.find((workflow) => workflow.id === 'feature-build') : null);

  const relatedProjects = projects
    .filter((project) => /core self|dylan core|system|dungeon|app|firebase|vercel|github|ios|android|pwa/i.test(`${project.name || project.title || ''} ${project.purpose || project.description || ''}`))
    .slice(0, 6)
    .map((project) => project.name || project.title)
    .filter(Boolean);

  const relevantTools = tools
    .filter((tool) => /developer|github|vercel|firebase|code|file|web|memory|orchestrator/i.test(`${tool.id} ${tool.name} ${tool.category} ${tool.aliases?.join(' ') || ''}`))
    .map((tool) => ({ id: tool.id, name: tool.name, status: tool.status, permission: tool.permission, risk: tool.risk }))
    .slice(0, 10);

  const nextActions = [];
  if (isRequest) {
    nextActions.push({
      id: `developer-${Date.now()}-audit`,
      title: primary?.label || 'Developer request',
      detail: input,
      nextStep: primary?.id === 'deployment'
        ? 'Give the exact deploy/build output or current Vercel/GitHub state, then run the safest command sequence.'
        : 'Use latest source of truth, identify changed files only, then run build/check before commit.',
      priority: 'High',
    });
  }

  return {
    version: 'milestone-4-developer-platform',
    isDeveloperRequest: isRequest,
    primaryWorkflow: primary?.id || 'none',
    primaryLabel: primary?.label || 'No developer workflow detected',
    output: primary?.output || 'No developer workflow required.',
    workflows,
    relatedProjects,
    relevantTools,
    knownStack: KNOWN_STACK,
    rules: PROJECT_STACK_RULES,
    answerContract: isRequest ? [
      'Start with the practical diagnosis or build decision.',
      'Separate existing files to replace from new files to create.',
      'List exact project paths and exact filenames.',
      'Provide npm/build/check commands and commit/push commands when code changes.',
      'Do not ask Dylan to redo setup that the context says is already complete.',
      'Do not claim file inspection, build, check, deploy or push happened unless a tool/runtime result confirms it.',
      'When unsure, give the next command that reveals the missing information instead of guessing.',
    ] : [],
    safeStackSize: isRequest ? '2-5 tightly related files by default; more only when same layer and build can be verified.' : 'Not applicable',
    nextActions,
    summary: isRequest
      ? `${primary?.label || 'Developer request'} detected. Use changed-files-only workflow with build/check and clear commands.`
      : 'No developer workflow needed for this request.',
  };
}

export function summarizeDeveloperPlan(plan = {}) {
  if (!plan.isDeveloperRequest) return 'Developer Platform idle.';
  const workflows = (plan.workflows || []).map((workflow) => workflow.label).join(' • ');
  return `${plan.primaryLabel} • ${workflows || 'general code/build support'} • ${plan.safeStackSize}`;
}

export function buildDeveloperChecklist(plan = {}) {
  if (!plan.isDeveloperRequest) return [];
  return unique([
    'Confirm latest source of truth.',
    'Identify exact files/layer.',
    'Change only required files.',
    'Run npm run build.',
    'Run npm run check.',
    'Commit from repo root.',
    ...(plan.primaryWorkflow === 'deployment' ? ['Confirm Vercel deployment status.'] : []),
  ]);
}
