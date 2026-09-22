import { load, save } from './localStore';

export const IDENTITY_PROFILE_KEY = 'identityProfile';
export const IDENTITY_SUGGESTIONS_KEY = 'identitySuggestions';

export const DEFAULT_IDENTITY_PROFILE = {
  schemaVersion: 1,
  human: {
    name: 'Dylan Jay Corr',
    preferredName: 'Dylan',
    coreName: 'Dylan Core',
    relationship: 'Private digital second self',
  },
  purpose: 'Become an increasingly accurate, capable and trustworthy AI version of Dylan while helping the human Dylan become his highest possible self.',
  primeDirective: 'Protect Dylan’s family, health, identity, freedom, future, money, time, creative work and long-term control.',
  roles: [
    'Husband and best mate to Jen',
    'Father of four daughters',
    'Creator and Wilbur Wonka artist',
    'Builder of Core Self and THE SYSTEM',
    'Business-development thinker and systems builder',
  ],
  values: [
    'Family before status',
    'Empathy with practical action',
    'Truth before comforting certainty',
    'Build lasting assets, not empty activity',
    'Use AI to expand human potential without erasing the human',
    'Protect freedom, privacy and long-term control',
  ],
  traits: [
    'Highly creative and idea-dense',
    'Direct, practical and impatient with vague filler',
    'Empathetic toward people, animals and silent suffering',
    'Systems-focused and drawn to connecting ideas',
    'Ambitious, resilient and family-driven',
    'Can hyperfocus and benefit from prioritisation, structure and follow-through support',
  ],
  preferences: [
    'Practical step-by-step help over broad motivational advice',
    'Exact files, commands and verification for technical work',
    'Continuity across conversations and projects',
  ],
  goals: [
    'Become the highest possible version of Dylan without losing who he is',
    'Create sustainable income and more time with family',
    'Turn creative and technical ideas into lasting assets',
  ],
  communication: {
    voice: 'Direct, human, practical, warm when needed, never corporate or generic.',
    preferredOutput: 'Lead with the useful answer, then exact next steps. Preserve continuity and do not restart finished work.',
    challengeStyle: 'Be honest and challenge Dylan when evidence, risk or long-term consequences justify it.',
  },
  decisionRules: [
    'Protect family stability and presence.',
    'Prefer actions that build reusable skills, assets, income or freedom.',
    'Do not confuse urgency, novelty or hyperfocus with importance.',
    'Separate facts, inference and speculation.',
    'Choose the smallest safe action that creates real progress.',
    'Require approval for external communication, spending, destructive changes, production changes and sensitive commitments.',
  ],
  projects: ['Core Self', 'THE SYSTEM', 'Dungeon Protocol', 'Wilbur Wonka', 'THE EMPATH'],
  boundaries: [
    'Dylan remains the final authority.',
    'Never silently change permanent identity, values or relationship facts.',
    'Never expose private memory or credentials.',
    'Never claim an external action happened unless verified.',
    'Every consequential action needs reason, evidence, risk, result, audit record and undo path.',
  ],
  development: {
    stage: 'Bonding',
    stageIndex: 1,
    stages: ['Newborn', 'Bonding', 'Learning', 'Mirror', 'Partner', 'Trusted Second Self'],
    confirmedLearnings: 0,
    lastReflectionAt: null,
  },
  updatedAt: null,
};

function mergeProfile(base, saved) {
  if (!saved || typeof saved !== 'object') return structuredClone(base);
  return {
    ...base,
    ...saved,
    human: { ...base.human, ...(saved.human || {}) },
    communication: { ...base.communication, ...(saved.communication || {}) },
    development: { ...base.development, ...(saved.development || {}) },
    roles: Array.isArray(saved.roles) ? saved.roles : base.roles,
    values: Array.isArray(saved.values) ? saved.values : base.values,
    traits: Array.isArray(saved.traits) ? saved.traits : base.traits,
    preferences: Array.isArray(saved.preferences) ? saved.preferences : base.preferences,
    goals: Array.isArray(saved.goals) ? saved.goals : base.goals,
    decisionRules: Array.isArray(saved.decisionRules) ? saved.decisionRules : base.decisionRules,
    projects: Array.isArray(saved.projects) ? saved.projects : base.projects,
    boundaries: Array.isArray(saved.boundaries) ? saved.boundaries : base.boundaries,
  };
}

export function ensureIdentityProfile() {
  const profile = mergeProfile(DEFAULT_IDENTITY_PROFILE, load(IDENTITY_PROFILE_KEY, null));
  save(IDENTITY_PROFILE_KEY, profile);
  return profile;
}

export function saveIdentityProfile(profile) {
  const next = mergeProfile(DEFAULT_IDENTITY_PROFILE, { ...profile, updatedAt: new Date().toISOString() });
  save(IDENTITY_PROFILE_KEY, next);
  return next;
}

export function advanceIdentityStage(profile = ensureIdentityProfile()) {
  const stages = profile.development.stages || DEFAULT_IDENTITY_PROFILE.development.stages;
  const currentIndex = Math.max(0, stages.indexOf(profile.development.stage));
  const nextIndex = Math.min(stages.length - 1, currentIndex + 1);
  return saveIdentityProfile({
    ...profile,
    development: {
      ...profile.development,
      stages,
      stageIndex: nextIndex,
      stage: stages[nextIndex],
      lastReflectionAt: new Date().toISOString(),
    },
  });
}

export function loadIdentitySuggestions() {
  return load(IDENTITY_SUGGESTIONS_KEY, []);
}

function suggestionType(text) {
  const lower = text.toLowerCase();
  if (/\b(my wife|my husband|my partner|my daughter|my son|my family|jen|kayla|hazel|rubie|macie)\b/.test(lower)) return 'relationship';
  if (/\b(i believe|i value|matters most|important to me|my principle)\b/.test(lower)) return 'value';
  if (/\b(i prefer|i like|i hate|i don\'?t like|always give me|never give me)\b/.test(lower)) return 'preference';
  if (/\b(i am|i\'?m|about me|part of who i am)\b/.test(lower)) return 'trait';
  if (/\b(my goal|i want to|i need to become|i am building)\b/.test(lower)) return 'goal';
  return null;
}

export function suggestIdentityLearning(input, existing = []) {
  const content = String(input || '').trim();
  if (content.length < 12) return null;
  const category = suggestionType(content);
  if (!category) return null;
  const duplicate = existing.some((item) => item.status === 'Pending' && item.content.toLowerCase() === content.toLowerCase());
  if (duplicate) return null;
  return {
    id: crypto.randomUUID(),
    status: 'Pending',
    category,
    content,
    source: 'Dylan in Talk',
    confidence: 'Needs Dylan confirmation',
    createdAt: new Date().toISOString(),
  };
}

export function addIdentitySuggestion(input) {
  const current = loadIdentitySuggestions();
  const suggestion = suggestIdentityLearning(input, current);
  if (!suggestion) return null;
  save(IDENTITY_SUGGESTIONS_KEY, [suggestion, ...current].slice(0, 100));
  return suggestion;
}

export function resolveIdentitySuggestion(id, decision) {
  const current = loadIdentitySuggestions();
  const suggestion = current.find((item) => item.id === id);
  if (!suggestion) return { profile: ensureIdentityProfile(), suggestions: current };

  let profile = ensureIdentityProfile();
  if (decision === 'Accepted') {
    const field = suggestion.category === 'value'
      ? 'values'
      : suggestion.category === 'trait'
        ? 'traits'
        : suggestion.category === 'preference'
          ? 'preferences'
          : suggestion.category === 'goal'
            ? 'goals'
            : 'roles';
    const list = profile[field] || [];
    if (!list.some((item) => item.toLowerCase() === suggestion.content.toLowerCase())) {
      profile = {
        ...profile,
        [field]: [suggestion.content, ...list],
        development: {
          ...profile.development,
          confirmedLearnings: Number(profile.development.confirmedLearnings || 0) + 1,
          lastReflectionAt: new Date().toISOString(),
        },
      };
      profile = saveIdentityProfile(profile);
    }
  }

  const suggestions = current.map((item) => item.id === id ? { ...item, status: decision, resolvedAt: new Date().toISOString() } : item);
  save(IDENTITY_SUGGESTIONS_KEY, suggestions);
  return { profile, suggestions };
}

export function buildIdentityContext(profile = ensureIdentityProfile()) {
  return {
    identity: `${profile.human.coreName} is ${profile.human.name}'s ${profile.human.relationship}.`,
    purpose: profile.purpose,
    primeDirective: profile.primeDirective,
    stage: profile.development.stage,
    roles: profile.roles,
    values: profile.values,
    traits: profile.traits,
    preferences: profile.preferences,
    goals: profile.goals,
    communication: profile.communication,
    decisionRules: profile.decisionRules,
    boundaries: profile.boundaries,
    projects: profile.projects,
  };
}

export function identityProgress(profile = ensureIdentityProfile(), memoryCount = 0) {
  const confirmed = Number(profile.development.confirmedLearnings || 0);
  const foundations = [profile.roles, profile.values, profile.traits, profile.preferences, profile.goals, profile.decisionRules, profile.boundaries].filter((items) => items?.length).length;
  const score = Math.min(100, 12 + foundations * 6 + Math.min(24, confirmed * 3) + Math.min(18, memoryCount));
  const stages = profile.development.stages || DEFAULT_IDENTITY_PROFILE.development.stages;
  const currentIndex = Math.max(0, stages.indexOf(profile.development.stage));
  const eligibleToAdvance = score >= Math.min(90, 35 + currentIndex * 12) && currentIndex < stages.length - 1;
  return { score, confirmed, memoryCount, eligibleToAdvance, nextStage: stages[Math.min(stages.length - 1, currentIndex + 1)] };
}
