const DEV_PATTERNS = {
  zipAudit: /\b(zip|uploaded zip|latest zip|source of truth|inspect|audit)\b/i,
  bugFix: /\b(bug|error|crash|blank screen|not working|stuck|failed|fix it|broken)\b/i,
  replacement: /\b(single file|replacement|txt file|changed files|copy|paste|file path)\b/i,
  buildDeploy: /\b(build|deploy|vercel|npm run|commit|push|github|firebase|rules|env|environment variable)\b/i,
  feature: /\b(add|create|update|next update|phase|milestone|stack|feature)\b/i,
};

function has(pattern, input = '') {
  return pattern.test(String(input || ''));
}

function detectProject(input = '') {
  const text = String(input || '').toLowerCase();
  if (text.includes('core self') || text.includes('coreself') || text.includes('dylan core')) return 'Core Self / Dylan Core';
  if (text.includes('system') || text.includes('daily hunter')) return 'THE SYSTEM';
  if (text.includes('dungeon protocol')) return 'Dungeon Protocol';
  if (text.includes('firebase')) return 'Firebase layer';
  if (text.includes('vercel')) return 'Vercel deployment';
  if (text.includes('github')) return 'GitHub repo';
  return 'Current active project';
}

function buildWorkflow(input = '') {
  const steps = [];
  if (has(DEV_PATTERNS.zipAudit, input)) steps.push('Treat the latest uploaded ZIP as the only source of truth.');
  if (has(DEV_PATTERNS.bugFix, input)) steps.push('Read the screenshot/error first, identify the failing layer, then patch only the affected files.');
  if (has(DEV_PATTERNS.feature, input)) steps.push('Group compatible changes into one safe stack and avoid unrelated rewrites.');
  if (has(DEV_PATTERNS.replacement, input)) steps.push('Return individual TXT replacement files with exact destination paths.');
  if (has(DEV_PATTERNS.buildDeploy, input)) steps.push('Include build, check, deploy/auto-deploy, commit and push commands.');
  if (!steps.length) steps.push('Use the standard developer workflow: identify files, patch minimal code, build/check, explain changes, then commit/push.');
  return steps;
}

export function buildDeveloperPlan({ input = '', projects = [], memories = [] } = {}) {
  const isDeveloperRequest = Object.values(DEV_PATTERNS).some((pattern) => has(pattern, input));
  const project = detectProject(input);
  const workflow = buildWorkflow(input);
  const lower = String(input || '').toLowerCase();
  const requestType = has(DEV_PATTERNS.bugFix, input) ? 'Bug fix / triage'
    : has(DEV_PATTERNS.zipAudit, input) ? 'ZIP audit / source-of-truth build'
    : has(DEV_PATTERNS.buildDeploy, input) ? 'Build / deploy / release ops'
    : has(DEV_PATTERNS.replacement, input) ? 'Single-file replacement workflow'
    : has(DEV_PATTERNS.feature, input) ? 'Feature stack'
    : 'Developer support';

  const relevantProjects = projects
    .filter((projectItem) => String(projectItem.name || projectItem.title || '').toLowerCase().includes('core') || lower.includes(String(projectItem.name || '').toLowerCase()))
    .slice(0, 3)
    .map((item) => item.name || item.title);

  const memoryRules = memories
    .filter((memory) => /workflow|coding|replacement|zip|deploy|commit|source of truth/i.test(`${memory.title || ''} ${memory.content || ''} ${memory.lesson || ''}`))
    .slice(0, 4)
    .map((memory) => memory.title || memory.content);

  return {
    isDeveloperRequest,
    requestType,
    project,
    workflow,
    outputContract: [
      'Use the latest uploaded project state; do not reset to old roadmap steps.',
      'List only files that actually change.',
      'Give exact file paths and exact commands.',
      'Say what changed and what to test.',
      'Do not claim build/check passed unless it was actually performed by the environment.',
    ],
    replacementRules: [
      'Existing files: replace the real project file with the TXT contents.',
      'New files: provide the exact name and folder before the TXT link.',
      'Do not give ZIPs of TXT files when Dylan asks for individual TXT files.',
    ],
    commandTemplate: {
      build: 'cd /workspaces/CoreSelf/apps/web && npm run build && npm run check',
      commit: 'cd /workspaces/CoreSelf && git add . && git commit -m "<message>" && git push',
      cleanRepo: 'Remove accidental nested ZIPs before release if they are sitting in the repo root.',
    },
    relevantProjects,
    memoryRules,
    nextActions: isDeveloperRequest ? [
      { id: `dev-${Date.now()}-1`, title: `${requestType}: identify changed files`, nextStep: 'Map request to the smallest file set before editing.', source: 'Developer Platform' },
      { id: `dev-${Date.now()}-2`, title: 'Run build/check before handoff', nextStep: 'Use npm run build and npm run check from apps/web.', source: 'Developer Platform' },
    ] : [],
  };
}

export function summarizeDeveloperPlan(plan = {}) {
  if (!plan.isDeveloperRequest) return 'Developer Platform idle.';
  return `${plan.requestType} • ${plan.project} • ${plan.workflow.length} workflow rule(s) loaded`;
}
