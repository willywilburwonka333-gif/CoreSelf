export const defaultProjects = [
  {
    id: 'the-system',
    name: 'THE SYSTEM',
    status: 'Active',
    priority: 'S-Tier',
    engine: 'Build / Wealth / Creation',
    purpose: 'Fitness RPG and life upgrade platform.',
    nextAction: 'Keep release stable and improve store readiness.',
    familyFreedom: 4,
    wealth: 5,
    health: 4,
    intelligence: 4,
    asset: 5,
    effortReduction: 3,
    riskProtection: 4
  },
  {
    id: 'core-self',
    name: 'Core Self',
    status: 'Genesis',
    priority: 'S-Tier',
    engine: 'Identity / Memory / Learning',
    purpose: 'Lifelong AI Core platform, starting with Dylan Core.',
    nextAction: 'Harden Cloud Brain with Production AI Backend, audit logs, and approval gates.',
    familyFreedom: 5,
    wealth: 5,
    health: 3,
    intelligence: 5,
    asset: 5,
    effortReduction: 5,
    riskProtection: 5
  },
  {
    id: 'reality-project',
    name: 'Reality Project',
    status: 'Research',
    priority: 'A-Tier',
    engine: 'Learning / Truth / Research',
    purpose: 'Investigate reality rigorously through math, physics, and philosophy.',
    nextAction: 'Preserve ideas, compare with existing frameworks.',
    familyFreedom: 2,
    wealth: 2,
    health: 1,
    intelligence: 5,
    asset: 3,
    effortReduction: 1,
    riskProtection: 3
  }
];

export const defaultGoals = [
  {
    id: 'family-freedom',
    category: 'Life',
    title: 'Protect family and maximise time with them',
    priority: 'Permanent',
    status: 'Always Active',
    target: 'More income and freedom without sacrificing family presence.'
  },
  {
    id: 'wealth',
    category: 'Wealth',
    title: 'Build sustainable self-supporting income',
    priority: 'S-Tier',
    status: 'Active',
    target: 'Assets, products, systems, and ethical income streams.'
  },
  {
    id: 'potential',
    category: 'Mind',
    title: 'Become the highest possible version of Dylan',
    priority: 'Prime',
    status: 'Always Active',
    target: 'Smarter, healthier, wealthier, calmer, freer, more capable.'
  },
  {
    id: 'creation-assets',
    category: 'Creation',
    title: 'Turn ideas into assets: apps, books, music, anime, systems',
    priority: 'A-Tier',
    status: 'Active',
    target: 'Create long-term IP and products.'
  }
];

export const defaultLifeGraphNodes = [
  { id: 'human-dylan', group: 'Human Dylan', title: 'Family', detail: 'Jennifer, children, home life, memories.' },
  { id: 'health', group: 'Human Dylan', title: 'Health', detail: 'Energy, fitness, recovery, long-term strength.' },
  { id: 'freedom', group: 'Human Dylan', title: 'Freedom', detail: 'Time, options, family presence.' },
  { id: 'projects', group: 'Executive Dylan', title: 'Projects', detail: 'THE SYSTEM, Core Self, Reality Project.' },
  { id: 'wealth', group: 'Executive Dylan', title: 'Wealth', detail: 'Income, assets, investments, automation.' },
  { id: 'creation', group: 'Executive Dylan', title: 'Creation', detail: 'Apps, music, books, anime, systems.' },
  { id: 'memory-engine', group: 'Engines', title: 'Memory Engine', detail: 'Stores what matters.' },
  { id: 'guardian-engine', group: 'Engines', title: 'Guardian Engine', detail: 'Protects Dylan’s future.' }
];

export const engineStatuses = [
  { name: 'Identity Engine', status: 'Online', progress: 45, next: 'Keep constitution synced with app.' },
  { name: 'Memory Engine', status: 'Suggestions + AI Context Online', progress: 44, next: 'Use model output to improve extraction and retrieval scoring.' },
  { name: 'Life Graph Engine', status: 'Relationship Links Online', progress: 35, next: 'Make links manually editable.' },
  { name: 'Planning Engine', status: 'Local V1 + AI Context', progress: 26, next: 'Turn plans into tracked tasks and reminders.' },
  { name: 'Decision Engine', status: 'Local Prototype', progress: 22, next: 'Use scoring across all actions.' },
  { name: 'Guardian Engine', status: 'Designed', progress: 12, next: 'Add risk warnings and authority gates.' },
  { name: 'AI Router', status: 'Real Provider Route Online', progress: 28, next: 'Add OPENAI_API_KEY in Vercel and test real replies.' },
  { name: 'Firestore Layer', status: 'Prepared for memory/plans', progress: 14, next: 'Add Firebase config when ready.' },
  { name: 'Activity Log', status: 'Local', progress: 15, next: 'Log engine actions automatically.' },
  { name: 'Backup System', status: 'Local', progress: 20, next: 'Add cloud backup later.' }
];

export const defaultSettings = {
  authorityLevel: 'Level 2 — Prepare',
  aiProvider: 'Local Genesis Placeholder',
  memoryMode: 'Local only',
  cloudSync: false,
  dailyBriefingStyle: 'Direct and useful',
  challengeStyle: 'Direct when needed',
};
