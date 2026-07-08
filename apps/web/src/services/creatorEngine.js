const CREATOR_WORKFLOWS = [
  {
    id: 'image',
    label: 'Image / Thumbnail',
    regex: /\b(image|picture|photo|thumbnail|cover art|poster|logo|banner|mockup|visual|artwork)\b/i,
    output: 'ready-to-use image prompt plus composition notes',
    providers: ['OpenAI image generation route later', 'external image tool manually for now'],
    needsExternalApi: true,
  },
  {
    id: 'video',
    label: 'Video / Film Clip',
    regex: /\b(video|film clip|music video|trailer|reel|short|scene|animation|runway|kling|pika|sora)\b/i,
    output: 'shot list, scene prompts, timing, camera movement and production order',
    providers: ['Runway/Kling/Pika/Sora-style workflow later', 'manual creator prompt now'],
    needsExternalApi: true,
  },
  {
    id: 'music',
    label: 'Music / Song',
    regex: /\b(song|music|lyrics|chorus|verse|hook|beat|suno|udio|elevenlabs|voice|audio|soundtrack)\b/i,
    output: 'song concept, lyrics, structure, style prompt and production notes',
    providers: ['Suno/Udio/ElevenLabs-style workflow later', 'manual prompt now'],
    needsExternalApi: true,
  },
  {
    id: 'book',
    label: 'Book / Longform Writing',
    regex: /\b(book|chapter|novel|ebook|story|manuscript|outline|plot|lore bible|world bible)\b/i,
    output: 'outline, chapter plan, writing brief and first draft path',
    providers: ['OpenAI text generation', 'document exporter later'],
    needsExternalApi: false,
  },
  {
    id: 'marketing',
    label: 'Marketing / Social Content',
    regex: /\b(tiktok|post|caption|ad|marketing|launch|promo|sales page|app store|google play|description|hashtags|content calendar)\b/i,
    output: 'platform-ready copy, hooks, caption variants and posting plan',
    providers: ['OpenAI text generation', 'scheduler later'],
    needsExternalApi: false,
  },
  {
    id: 'business-doc',
    label: 'Business Document',
    regex: /\b(business plan|pitch|forecast|grant|iba|proposal|memo|executive summary|budget|income plan)\b/i,
    output: 'structured business document with assumptions and next action',
    providers: ['OpenAI text generation', 'spreadsheet/document exporter later'],
    needsExternalApi: false,
  },
  {
    id: 'code-product',
    label: 'Code / Product Build',
    regex: /\b(app|website|code|feature|screen|component|api|build|deploy|debug|replacement file)\b/i,
    output: 'implementation plan, changed files, commands and tests',
    providers: ['OpenAI coding route', 'GitHub/Vercel worker later'],
    needsExternalApi: false,
  },
];

function unique(items = []) {
  return [...new Set(items.filter(Boolean))];
}

export function detectCreatorWorkflows(input = '') {
  const text = String(input || '');
  const matched = CREATOR_WORKFLOWS.filter((workflow) => workflow.regex.test(text));
  if (matched.length) return matched;
  return [];
}

export function buildCreatorPlan({ input = '', projects = [], goals = [], memories = [] } = {}) {
  const workflows = detectCreatorWorkflows(input);
  const primary = workflows[0] || null;
  const projectLabels = projects
    .filter((project) => /system|core|dungeon|music|marketing|book|creator/i.test(`${project.name || project.title || ''} ${project.purpose || ''}`))
    .slice(0, 5)
    .map((project) => project.name || project.title)
    .filter(Boolean);

  const memoryTags = unique(memories.flatMap((memory) => memory.relationshipTags || [])).slice(0, 10);
  const needsExternalApi = workflows.some((workflow) => workflow.needsExternalApi);

  return {
    version: 'milestone-3-creator-platform',
    isCreatorRequest: workflows.length > 0,
    primaryWorkflow: primary ? primary.id : 'none',
    primaryLabel: primary ? primary.label : 'No creator workflow detected',
    workflows: workflows.map((workflow) => ({
      id: workflow.id,
      label: workflow.label,
      output: workflow.output,
      providers: workflow.providers,
      needsExternalApi: workflow.needsExternalApi,
    })),
    relatedProjects: projectLabels,
    memoryTags,
    needsExternalApi,
    currentExecutionMode: needsExternalApi
      ? 'Prompt-and-production-plan now. Direct generation waits for provider API/tool setup.'
      : 'Can produce usable text/plans now using the current AI backend.',
    answerContract: workflows.length ? [
      'Identify the creator workflow first: image, video, music, book, marketing, business document or code/product.',
      'Use Dylan’s existing projects, lore, app brands and saved context instead of generic examples.',
      'Give the finished usable output when possible; otherwise give the exact production prompt and steps.',
      'Separate what Core Self can do now from what needs an external provider/API later.',
      'End with the next production step, not a vague suggestion.',
    ] : [
      'No creator workflow detected. Keep normal assistant routing.',
    ],
    nextActions: workflows.slice(0, 3).map((workflow, index) => ({
      id: `creator-${workflow.id}-${index}`,
      title: `Prepare ${workflow.label}`,
      detail: workflow.output,
      nextStep: workflow.needsExternalApi
        ? 'Generate the production-ready prompt now, then run it in the chosen external tool until API access is connected.'
        : 'Generate the usable draft directly in Core Self.',
    })),
  };
}

export function summarizeCreatorPlan(plan = {}) {
  if (!plan.isCreatorRequest) return 'Creator Platform idle.';
  const labels = (plan.workflows || []).map((workflow) => workflow.label).join(' + ');
  return `${labels || plan.primaryLabel} • ${plan.currentExecutionMode}`;
}

export const creatorWorkflowCatalog = CREATOR_WORKFLOWS;
