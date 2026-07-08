const INTENT_RULES = [
  { intent: 'build_code', label: 'Developer build', regex: /\b(code|coding|build|fix|debug|bug|zip|replacement|file|deploy|vercel|firebase|github|commit|push|npm|react|vite|api|javascript|jsx|css|html|typescript|node|terminal|command)\b/i, tools: ['memory-recall', 'planning-engine', 'developer-build-assistant', 'github-vercel-firebase'], answer: 'implementation' },
  { intent: 'research_compare', label: 'Research and compare', regex: /\b(search|internet|web|latest|current|look up|compare|sources|cite|verify|research|best|cheap|tool|tools|api|provider)\b/i, tools: ['memory-recall', 'web-research', 'research-comparator', 'action-queue'], answer: 'research-decision' },
  { intent: 'create_asset', label: 'Creator workflow', regex: /\b(image|picture|photo|video|film clip|song|music|book|chapter|cover|thumbnail|tiktok|post|marketing|prompt|voice|audio|lyrics)\b/i, tools: ['memory-recall', 'creator-suite', 'planning-engine', 'action-queue'], answer: 'creator-plan' },
  { intent: 'business_money', label: 'Business/income', regex: /\b(business|income|money|grant|iba|forecast|loan|pitch|sales|launch|monetise|monetize|product|pricing|customers|market)\b/i, tools: ['memory-recall', 'business-builder', 'planning-engine', 'web-research'], answer: 'business-plan' },
  { intent: 'personal_memory', label: 'Memory update', regex: /\b(remember|save this|memory|goal|plan|project|task|todo|remind|reminder|schedule|habit)\b/i, tools: ['memory-recall', 'memory-compression', 'action-queue', 'planning-engine'], answer: 'memory-action' },
];

function unique(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function detectIntent(input = '') {
  const matched = INTENT_RULES.filter((rule) => rule.regex.test(input));
  if (!matched.length) {
    return {
      intent: 'general_assistant',
      label: 'General assistant',
      confidence: 0.58,
      answer: 'direct-answer',
      tools: ['memory-recall', 'planning-engine'],
      matched: [],
    };
  }

  const primary = matched[0];
  return {
    intent: primary.intent,
    label: primary.label,
    confidence: Math.min(0.96, 0.72 + matched.length * 0.07),
    answer: primary.answer,
    tools: unique(matched.flatMap((rule) => rule.tools)),
    matched: matched.map((rule) => rule.intent),
  };
}

function mapToolStatus(toolIds = [], tools = []) {
  return toolIds.map((id) => {
    const found = tools.find((tool) => tool.id === id || tool.aliases?.includes?.(id));
    if (!found) return { id, name: id, status: 'Planned', permission: 'Ask first', executable: false };
    return {
      id: found.id,
      name: found.name,
      status: found.status,
      permission: found.permission,
      executable: found.status === 'Ready' && found.permission === 'Allowed',
      risk: found.risk || 'Medium',
    };
  });
}

function buildAnswerContract(intent, input = '') {
  if (intent.intent === 'research_compare') {
    return [
      'State the practical answer first.',
      'Separate good fits, possible later fits, and poor fits for Core Self.',
      'Do not list tools without evaluating them against Dylan\'s actual stack.',
      'Flag hype, embedded-only projects, dead/unverified projects, or tools that do not help the React/Firebase/Vercel/OpenAI architecture.',
      'End with a short recommendation and next action.',
    ];
  }

  if (intent.intent === 'build_code') {
    return [
      'Identify the exact project layer.',
      'List only files that must change.',
      'Give exact terminal commands.',
      'Say what changed and what to test.',
      'Do not reset the workflow or ask for already provided setup.',
    ];
  }

  if (intent.intent === 'create_asset') {
    return [
      'Decide whether this is text, image, video, music, book, or marketing work.',
      'Use Dylan\'s existing projects and brand direction.',
      'Give a ready-to-use output or a tight production prompt.',
      'Add the next production step only if useful.',
    ];
  }

  if (intent.intent === 'business_money') {
    return [
      'Tie advice to Dylan\'s actual apps, funding, family/time constraints and launch stage.',
      'Prefer low-cost, practical actions over generic business advice.',
      'Separate immediate cash moves from long-term asset moves.',
    ];
  }

  if (intent.intent === 'personal_memory') {
    return [
      'Decide whether the item should become memory, goal, task, plan, or project update.',
      'Ask for confirmation only when the exact wording or time matters.',
      'Prepare the action clearly without claiming external execution.',
    ];
  }

  return [
    'Answer directly.',
    'Use memory and current project context.',
    'End with one useful next step when appropriate.',
  ];
}

export function buildOrchestratorPlan({ input = '', mode = 'standard', tools = [], deepThink = false } = {}) {
  const detected = detectIntent(input);
  const selectedTools = mapToolStatus(detected.tools, tools);
  const executableTools = selectedTools.filter((tool) => tool.executable);
  const blockedTools = selectedTools.filter((tool) => !tool.executable);

  const plan = {
    version: 'milestone-2-orchestrator',
    intent: detected.intent,
    label: detected.label,
    confidence: detected.confidence,
    answerStyle: detected.answer,
    mode,
    deepThink: Boolean(deepThink),
    selectedTools,
    executableToolCount: executableTools.length,
    blockedToolCount: blockedTools.length,
    blockedTools,
    answerContract: buildAnswerContract(detected, input),
    shouldUseMemory: true,
    shouldUseWeb: detected.intent === 'research_compare',
    shouldCreateAction: ['build_code', 'research_compare', 'business_money', 'personal_memory'].includes(detected.intent),
    shouldCompareToCoreStack: ['research_compare', 'build_code', 'business_money'].includes(detected.intent),
    completionRule: 'Finish with a recommendation, next action, and whether this should be saved as memory/task/project when relevant.',
  };

  return plan;
}

export function summarizeOrchestratorPlan(plan = {}) {
  if (!plan.intent) return 'Orchestrator not loaded.';
  const tools = (plan.selectedTools || []).map((tool) => `${tool.name || tool.id}: ${tool.status}`).join(' • ');
  return `${plan.label || plan.intent} • ${plan.answerStyle || 'direct-answer'} • ${tools || 'No tools selected'}`;
}
