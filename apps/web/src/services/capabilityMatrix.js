export const AI_OS_CAPABILITIES = [
  {
    id: 'brain-openai',
    name: 'OpenAI Brain',
    category: 'Brain',
    phase: 'Genesis 1.0',
    status: 'Configured in Vercel when OPENAI_API_KEY exists',
    purpose: 'Main reasoning, chat, planning, coding support, vision-ready prompts and tool calling structure.',
    setup: ['Vercel env: OPENAI_API_KEY', 'Optional: OPENAI_MODEL', 'Optional: OPENAI_DEEP_MODEL', 'Redeploy after env changes'],
  },
  {
    id: 'web-research',
    name: 'Live Web Research',
    category: 'Research',
    phase: 'Genesis 1.0',
    status: 'Available through OpenAI Responses web search when the account/model supports it',
    purpose: 'Current news, prices, docs, release notes, API changes, and fact checking.',
    setup: ['Keep OPENAI_API_KEY active', 'Optional: OPENAI_WEB_MODEL', 'Optional: OPENAI_WEB_TOOL=web_search_preview'],
  },
  {
    id: 'multi-provider-router',
    name: 'Capability-Aware Model Router',
    category: 'Brain',
    phase: 'Genesis 1.1',
    status: 'Active; Gemini remains opt-in until both GEMINI_API_KEY and GEMINI_MODEL are configured',
    purpose: 'Route routine work to a lower-cost worker while reserving web, coding and deep work for the stronger configured path, with automatic fallback.',
    setup: ['OpenAI remains the safe baseline', 'Optional: add GEMINI_API_KEY and GEMINI_MODEL server-side', 'Compare cost per successful task before changing production defaults'],
  },
  {
    id: 'realtime-voice',
    name: 'Realtime Voice',
    category: 'Voice',
    phase: 'Voice Prototype',
    status: 'Architecture prepared; not enabled without secure ephemeral sessions',
    purpose: 'Interruptible spoken memory capture, action creation and queue reading with a backend executor.',
    setup: ['A/B test available live providers', 'Create server-issued short-lived session credentials', 'Require confirmation before external actions', 'Log tool calls and session outcomes'],
  },
  {
    id: 'agentic-video-understanding',
    name: 'Agentic Video Understanding',
    category: 'Vision',
    phase: 'File Intelligence',
    status: 'Watchlist; provider adapter and recall evaluation required',
    purpose: 'Inspect long screen recordings and personal videos selectively while returning timestamped evidence.',
    setup: ['Add behind the existing file-analysis adapter', 'Test against manually annotated recordings', 'Treat transcripts and frames as untrusted input'],
  },
  {
    id: 'memory-os',
    name: 'Persistent Memory OS',
    category: 'Memory',
    phase: 'Genesis 1.0',
    status: 'Internal foundation active',
    purpose: 'Read, rank, compress, recall and update Dylan memories, goals, plans and projects.',
    setup: ['Firebase Auth enabled', 'Firestore rules deployed', 'Cloud memory services connected'],
  },
  {
    id: 'creator-images',
    name: 'Image Creation',
    category: 'Creator',
    phase: 'Creator Suite',
    status: 'Needs dedicated API route before real generation',
    purpose: 'Launch graphics, thumbnails, promo images, concept art and app/store assets.',
    setup: ['Add server route /api/create-image', 'Use OpenAI image generation key server-side', 'Add save/export UI'],
  },
  {
    id: 'creator-video',
    name: 'Video Creation',
    category: 'Creator',
    phase: 'Creator Suite',
    status: 'External provider needed',
    purpose: 'Film clips, trailers, TikTok clips, product promos and lore videos.',
    setup: ['Choose provider later: Runway/Kling/Pika/etc', 'Add provider API key in Vercel', 'Add queued render flow'],
  },
  {
    id: 'creator-music',
    name: 'Music / Audio Workflow',
    category: 'Creator',
    phase: 'Creator Suite',
    status: 'Prompt/workflow ready, real generation needs provider',
    purpose: 'Song prompts, lyrics, structure, soundtrack planning, voiceover scripts and release assets.',
    setup: ['Use prompt workflow now', 'Add ElevenLabs/Suno/Udio-style provider later if API access is available'],
  },
  {
    id: 'developer-zip-code',
    name: 'Developer Build Assistant',
    category: 'Developer',
    phase: 'Developer Suite',
    status: 'Planning active, real file mutation needs backend worker',
    purpose: 'Inspect ZIPs, produce replacement files, debug builds, create commands and explain deployments.',
    setup: ['Add upload route', 'Add server-side unzip/read/write worker', 'Add patch zip exporter'],
  },
  {
    id: 'github-vercel-firebase',
    name: 'GitHub / Vercel / Firebase Ops',
    category: 'Developer',
    phase: 'Developer Suite',
    status: 'Needs OAuth/API tokens and explicit approval gates',
    purpose: 'Read repos, prepare commits, check deployments, inspect Firebase state and guide release work.',
    setup: ['GitHub fine-grained token or OAuth app', 'Vercel token', 'Firebase Admin service account stored server-side only'],
  },
  {
    id: 'book-business',
    name: 'Books + Business Builder',
    category: 'Business',
    phase: 'Business Suite',
    status: 'Prompt/planning active now',
    purpose: 'Write books, pitch decks, business plans, IBA/grant docs, forecasts, offer pages and content calendars.',
    setup: ['Use current OpenAI brain', 'Add document export later: DOCX/PDF/Markdown'],
  },
  {
    id: 'google-workspace',
    name: 'Gmail / Calendar / Drive',
    category: 'External Ops',
    phase: 'Automation Suite',
    status: 'Needs Google Cloud OAuth setup',
    purpose: 'Draft/send email with approval, manage calendar, search/read Drive files and prepare documents.',
    setup: ['Create Google Cloud OAuth client', 'Enable Gmail, Calendar and Drive APIs', 'Add consent screen', 'Store tokens securely'],
  },
];

export function buildCapabilitySummary(capabilities = AI_OS_CAPABILITIES) {
  const categories = capabilities.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const needsExternalSetup = capabilities.filter((item) => /needs|external|oauth|provider|token/i.test(item.status));
  const activeNow = capabilities.filter((item) => /active|configured|available|prompt\/planning/i.test(item.status));
  return {
    total: capabilities.length,
    categories,
    activeNow: activeNow.length,
    needsExternalSetup: needsExternalSetup.length,
    nextBuild: 'Validate the capability-aware router, then prototype secure realtime voice without weakening approval gates.',
  };
}

export function buildCapabilityContext(capabilities = AI_OS_CAPABILITIES) {
  return capabilities.map((item) => ({
    name: item.name,
    category: item.category,
    phase: item.phase,
    status: item.status,
    purpose: item.purpose,
  }));
}
