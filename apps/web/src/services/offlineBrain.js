const PRIORITY_ORDER = ['Permanent', 'S-Tier', 'Critical', 'A-Tier', 'High', 'Medium', 'Low'];

function textOf(item = {}) {
  if (typeof item === 'string') return item;
  return item.content || item.target || item.purpose || item.description || item.summary || item.title || item.name || '';
}

function nameOf(item = {}) {
  if (typeof item === 'string') return item;
  return item.title || item.name || textOf(item);
}

function normalise(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

function important(items = []) {
  return [...items].sort((a, b) => {
    const aRank = PRIORITY_ORDER.indexOf(a?.priority || a?.importance);
    const bRank = PRIORITY_ORDER.indexOf(b?.priority || b?.importance);
    return (aRank < 0 ? 99 : aRank) - (bRank < 0 ? 99 : bRank);
  });
}

function matching(items = [], input = '') {
  const words = new Set(normalise(input).split(/\s+/).filter((word) => word.length > 3));
  return items
    .map((item) => ({ item, score: normalise(`${nameOf(item)} ${textOf(item)}`).split(/\s+/).filter((word) => words.has(word)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

function privateFacts(profile = {}, section, input = '') {
  const items = profile.privateContext?.[section] || [];
  if (section === 'relationships' && !/\b(jen|kayla|hazel|rubie|macie|wife|daughter)\b/i.test(input)) {
    return items.slice(0, 4).map(textOf).filter(Boolean);
  }
  const matches = matching(items, input);
  return (matches.length ? matches : items).slice(0, 4).map(textOf).filter(Boolean);
}

function memoryLines(memories = []) {
  return memories.slice(0, 4).map((memory) => `- ${memory.title || 'Saved memory'}: ${memory.content || memory.lesson || ''}`);
}

function projectLines(projects = []) {
  return important(projects).slice(0, 4).map((project) => `- ${project.name || project.title}: ${project.nextAction || project.purpose || 'Review the next action.'}`);
}

function goalLines(goals = []) {
  return important(goals).slice(0, 4).map((goal) => `- ${goal.title || goal.name}: ${goal.target || goal.description || 'Keep moving this forward.'}`);
}

function header(reason) {
  return `Offline Dylan Core${reason ? ` — ${reason}` : ''}`;
}

function nextMove(projects = [], goals = [], plans = [], preparedActions = []) {
  const action = preparedActions[0];
  if (action) return `${action.title}: ${action.nextStep || action.detail}`;
  const plan = important(plans)[0];
  if (plan) return `${plan.title || plan.name}: ${plan.nextAction || plan.summary}`;
  const project = important(projects)[0];
  if (project) return `${project.name || project.title}: ${project.nextAction || project.purpose}`;
  const goal = important(goals)[0];
  if (goal) return `${goal.title}: ${goal.target || goal.description}`;
  return 'Open Actions and choose the smallest safe step that creates real progress.';
}

export function buildOfflineReply({
  input = '',
  mode = 'Talk',
  relevantMemories = [],
  projects = [],
  goals = [],
  plans = [],
  identityProfile = {},
  preparedActions = [],
  reason = '',
} = {}) {
  const lower = normalise(input);
  const intro = header(reason ? 'cloud AI unavailable' : 'local rule engine');
  const familyQuery = /\b(family|wife|jen|daughter|kayla|hazel|rubie|macie)\b/.test(lower);
  const identityQuery = /\b(who am i|about me|know about me|my identity|what do you know)\b/.test(lower);
  const nextQuery = /\b(what next|what should i do|next step|priority|prioritise|prioritize|today)\b/.test(lower);
  const memoryQuery = /\b(remember|save this|memory|forget)\b/.test(lower);
  const projectQuery = /\b(projects?|core self|the system|empath|wilbur|dungeon)\b/.test(lower);
  const goalQuery = /\b(goals?|future|income|freedom|career)\b/.test(lower);
  const decisionQuery = /\b(should i|decide|choice|option|why)\b/.test(lower);
  const codingQuery = /\b(code|build|fix|debug|deploy|github|firebase|vercel|app)\b/.test(lower);
  const creatorQuery = /\b(song|lyrics|music|album|series|story|film|creative)\b/.test(lower);

  if (identityQuery) {
    const roles = (identityProfile.roles || []).slice(0, 6).map((item) => `- ${textOf(item)}`);
    const values = (identityProfile.values || []).slice(0, 5).map((item) => `- ${textOf(item)}`);
    return `${intro}\n\nYou are ${identityProfile.human?.name || 'Dylan'}, and I am your private digital second self. My local understanding is grounded in these roles:\n${roles.join('\n') || '- Your identity profile has not been imported yet.'}\n\nWhat I protect:\n${values.join('\n') || `- ${identityProfile.primeDirective || 'Family, identity, health, freedom and long-term control.'}`}\n\n${memoryLines(relevantMemories).join('\n') || 'Import the private Seed Vault to deepen my offline understanding.'}`;
  }

  if (familyQuery) {
    const facts = privateFacts(identityProfile, 'relationships', input);
    return `${intro}\n\nFamily is the reason behind the goals—not a competing task.\n${facts.map((fact) => `- ${fact}`).join('\n') || '- Protect family stability, presence and connection before status.'}\n\nBest next move: ${nextMove(projects, goals, plans, preparedActions)}`;
  }

  if (nextQuery) {
    return `${intro}\n\nYour strongest next move is:\n${nextMove(projects, goals, plans, preparedActions)}\n\nPriority check:\n1. Protect family stability and health.\n2. Finish an active high-value thread before feeding a new hyperfocus.\n3. Prefer the step that builds income, reusable IP, skill or freedom.\n4. Keep external, destructive or financial actions behind your approval.`;
  }

  if (memoryQuery) {
    return `${intro}\n\nI kept your message locally and prepared it for the Memory/Identity review flow. Permanent identity changes still need your confirmation so I do not quietly rewrite who you are.\n\nClosest saved context:\n${memoryLines(relevantMemories).join('\n') || '- No closely matching memory was found yet.'}`;
  }

  if (projectQuery) {
    const matches = matching(projects, input);
    const selected = matches.length ? matches : projects;
    return `${intro}\n\nRelevant active work:\n${projectLines(selected).join('\n') || '- No matching project is stored yet.'}\n\nBest next move: ${nextMove(selected, goals, plans, preparedActions)}`;
  }

  if (goalQuery) {
    const matches = matching(goals, input);
    return `${intro}\n\nGoals connected to this:\n${goalLines(matches.length ? matches : goals).join('\n') || '- No matching goal is stored yet.'}\n\nBest next move: ${nextMove(projects, matches.length ? matches : goals, plans, preparedActions)}`;
  }

  if (decisionQuery) {
    const rules = (identityProfile.decisionRules || []).slice(0, 6).map((rule, index) => `${index + 1}. ${textOf(rule)}`);
    return `${intro}\n\nRun the decision through Dylan's rules:\n${rules.join('\n') || '1. Choose the smallest safe action that creates real progress.'}\n\nMy local recommendation: ${nextMove(projects, goals, plans, preparedActions)}`;
  }

  if (codingQuery) {
    return `${intro}\n\nI can still organise the build locally, but I cannot inspect live GitHub, deploy or generate reliable replacement code without a connected model/tool runtime.\n\nSafe offline workflow:\n1. Preserve the latest source of truth.\n2. Record the exact bug or feature and affected screen.\n3. Add the prepared work to Actions.\n4. When connection returns, inspect files, patch, build, check, then deploy only with approval.\n\nPrepared next move: ${nextMove(projects, goals, plans, preparedActions)}`;
  }

  if (creatorQuery) {
    const facts = privateFacts(identityProfile, 'creativeIdentity', input);
    return `${intro}\n\nI can preserve direction and organise the creative job offline; final generative writing/audio/video needs a model or creator tool.\n${facts.map((fact) => `- ${fact}`).join('\n') || '- Keep the work personal, specific and recognisably Dylan—not generic AI output.'}\n\nPrepared next move: ${nextMove(projects, goals, plans, preparedActions)}`;
  }

  const context = memoryLines(relevantMemories);
  return `${intro}\n\nI cannot do open-ended cloud reasoning right now, but your Identity Core, Memory Vault, projects, goals, plans and approval rules are still available on this device.\n\nWhat appears relevant:\n${context.join('\n') || projectLines(projects).slice(0, 3).join('\n') || '- Your local Core data is available.'}\n\nBest next move: ${nextMove(projects, goals, plans, preparedActions)}\n\nI will sync local changes when the connection returns. Mode: ${mode}.`;
}
