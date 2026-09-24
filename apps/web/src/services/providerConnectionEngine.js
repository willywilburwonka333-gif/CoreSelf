const PROVIDERS = [
  {
    id: 'openai-core',
    name: 'OpenAI Core Brain',
    category: 'Brain',
    env: ['OPENAI_API_KEY'],
    optionalEnv: ['OPENAI_MODEL', 'OPENAI_DEEP_MODEL'],
    statusWhenReady: 'Connected',
    purpose: 'Main reasoning, chat, planning, coding help, creator writing and tool orchestration.',
    setup: [
      'Vercel → CoreSelf project → Settings → Environment Variables.',
      'Add OPENAI_API_KEY as a Sensitive variable for Production and Preview.',
      'Optional: add OPENAI_MODEL and OPENAI_DEEP_MODEL.',
      'Redeploy after changing environment variables.',
    ],
    nextAction: 'Already configured if OPENAI_API_KEY is present in Vercel.',
    risk: 'Medium',
  },
  {
    id: 'openai-web',
    name: 'OpenAI Web Search',
    category: 'Research',
    env: ['OPENAI_API_KEY'],
    optionalEnv: ['OPENAI_WEB_MODEL', 'OPENAI_WEB_TOOL'],
    statusWhenReady: 'Connected',
    purpose: 'Live internet scan, source-backed research and current information checks.',
    setup: [
      'Use the existing OPENAI_API_KEY.',
      'Optional: add OPENAI_WEB_MODEL if you want a separate model for web/research.',
      'Keep web search server-side inside /api/chat.',
    ],
    nextAction: 'Test with a current web question and verify sources appear.',
    risk: 'Medium',
  },
  {
    id: 'gemini-worker',
    name: 'Gemini Routine Worker',
    category: 'Brain',
    env: ['GEMINI_API_KEY', 'GEMINI_MODEL'],
    optionalEnv: [],
    statusWhenReady: 'Connected',
    purpose: 'Optional economical worker for routine chat and structured work, with OpenAI retained for coding, deep reasoning and live web research.',
    setup: [
      'Create a paid Google AI API key and keep it server-side.',
      'Add GEMINI_API_KEY as a Sensitive Vercel environment variable.',
      'Add GEMINI_MODEL using the exact model ID available to your account.',
      'Redeploy, then verify the standard route in /api/ai-status.',
    ],
    nextAction: 'Run the same routine prompts through Gemini and OpenAI; keep Gemini enabled only if quality and cost improve.',
    risk: 'Medium',
  },
  {
    id: 'realtime-voice',
    name: 'Realtime Voice Layer',
    category: 'Voice',
    env: ['REALTIME_VOICE_PROVIDER'],
    optionalEnv: ['OPENAI_REALTIME_MODEL', 'GEMINI_LIVE_MODEL'],
    statusWhenReady: 'Provider selected; secure session route still required',
    purpose: 'Future interruptible voice for memory capture, action creation and reading the daily queue while backend agents work.',
    setup: [
      'Choose the provider only after a measured GPT Live versus Gemini Live test.',
      'Create short-lived browser session credentials on a server route; never expose provider API keys.',
      'Start with capture memory, create action and read queue.',
      'Require confirmation before any external side effect.',
    ],
    nextAction: 'Keep voice disabled until the secure ephemeral-session route and interruption tests exist.',
    risk: 'High',
  },
  {
    id: 'openai-image',
    name: 'Image Generation Provider',
    category: 'Creator',
    env: ['OPENAI_API_KEY'],
    optionalEnv: ['OPENAI_IMAGE_MODEL', 'IMAGE_API_KEY'],
    statusWhenReady: 'Route ready',
    purpose: 'Direct guarded image generation for thumbnails, posters, covers, app art and concepts.',
    setup: [
      'Use the existing OPENAI_API_KEY already stored server-side in Vercel.',
      'Optional: add OPENAI_IMAGE_MODEL if you want to override the default image model.',
      'Use the deployed /api/create-image route from Talk. Direct image requests auto-generate without an extra approval button.',
    ],
    nextAction: 'Test with a simple image request in Talk, then save successful prompts as creator templates.',
    risk: 'Medium',
  },
  {
    id: 'video-provider',
    name: 'Video Generation Provider',
    category: 'Creator',
    env: ['VIDEO_API_KEY'],
    optionalEnv: ['VIDEO_PROVIDER'],
    statusWhenReady: 'Needs route',
    purpose: 'Future film clips, trailers, short scenes and marketing video generation.',
    setup: [
      'Choose provider later after price/quality comparison.',
      'Add VIDEO_PROVIDER and VIDEO_API_KEY in Vercel only after choosing.',
      'Build /api/create-video with approval and cost guardrails.',
    ],
    nextAction: 'Keep as planning mode for now. Use Dylan to create shot lists and prompts until provider is selected.',
    risk: 'High',
  },
  {
    id: 'music-provider',
    name: 'Music / Voice Provider',
    category: 'Creator',
    env: ['MUSIC_API_KEY'],
    optionalEnv: ['MUSIC_PROVIDER', 'VOICE_API_KEY'],
    statusWhenReady: 'Needs route',
    purpose: 'Future song, voice, narration and soundtrack generation workflows.',
    setup: [
      'Keep lyrics/prompts inside Core Self now.',
      'Choose provider later when direct API and rights/costs are clear.',
      'Add server route only after provider choice.',
    ],
    nextAction: 'Do not add random music APIs yet. Keep prompt workflow until provider is chosen.',
    risk: 'High',
  },
  {
    id: 'github-provider',
    name: 'GitHub Connector',
    category: 'Developer',
    env: ['GITHUB_TOKEN'],
    optionalEnv: ['GITHUB_OWNER', 'GITHUB_REPO'],
    statusWhenReady: 'Token present',
    purpose: 'Read repository state, compare files, prepare commits and future approved pull requests.',
    setup: [
      'GitHub → Settings → Developer settings → Personal access tokens.',
      'Create a fine-grained token scoped only to the CoreSelf repository.',
      'Start read-only if possible; do not enable write until approval gates exist.',
      'Add GITHUB_TOKEN in Vercel as Sensitive.',
    ],
    nextAction: 'Add read-only repo status route before any write/commit feature.',
    risk: 'High',
  },
  {
    id: 'vercel-provider',
    name: 'Vercel Connector',
    category: 'Developer',
    env: ['VERCEL_TOKEN'],
    optionalEnv: ['VERCEL_PROJECT_ID', 'VERCEL_TEAM_ID'],
    statusWhenReady: 'Token present',
    purpose: 'Read deployment status, environment readiness and future approved redeploy actions.',
    setup: [
      'Vercel Account Settings → Tokens.',
      'Create token with the smallest scope possible.',
      'Add VERCEL_TOKEN to Vercel project env vars as Sensitive.',
      'Build read-only deployment status first.',
    ],
    nextAction: 'Add read-only deployment/status route before enabling redeploy actions.',
    risk: 'High',
  },
  {
    id: 'firebase-admin',
    name: 'Firebase Admin Connector',
    category: 'Data',
    env: ['FIREBASE_PROJECT_ID'],
    optionalEnv: ['FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'],
    statusWhenReady: 'Partially configured',
    purpose: 'Future secure server-side Firestore reads/writes, rules checks and admin diagnostics.',
    setup: [
      'Use the existing client Firebase for app login/data now.',
      'Only add Admin SDK keys if server-side admin routes are required.',
      'Never put Firebase private key in frontend code.',
    ],
    nextAction: 'Keep client Firebase as-is until an admin-only feature is needed.',
    risk: 'High',
  },
  {
    id: 'google-oauth',
    name: 'Google OAuth / Gmail / Calendar / Drive',
    category: 'Google',
    env: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    optionalEnv: ['GOOGLE_REDIRECT_URI'],
    statusWhenReady: 'OAuth configured',
    purpose: 'Future Gmail, Calendar and Drive tools with explicit approval before writes/sends.',
    setup: [
      'Google Cloud Console → create/select project.',
      'Configure OAuth consent screen.',
      'Create Web OAuth Client ID.',
      'Enable Gmail, Calendar and Drive APIs only when needed.',
      'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Vercel as Sensitive.',
    ],
    nextAction: 'Wait until Tool Runtime approval gates are solid before connecting Gmail/Calendar/Drive.',
    risk: 'High',
  },
];

function hasAllRequired(provider, env = {}) {
  return provider.env.every((key) => Boolean(env[key]));
}

export function getProviderDefinitions() {
  return PROVIDERS;
}

export function buildProviderStatusFromEnv(env = {}) {
  return PROVIDERS.map((provider) => {
    const ready = hasAllRequired(provider, env);
    const optionalPresent = provider.optionalEnv.filter((key) => Boolean(env[key]));
    const missing = provider.env.filter((key) => !env[key]);
    return {
      id: provider.id,
      name: provider.name,
      category: provider.category,
      status: ready ? provider.statusWhenReady : 'Not configured',
      ready,
      risk: provider.risk,
      purpose: provider.purpose,
      requiredEnv: provider.env,
      optionalEnv: provider.optionalEnv,
      optionalPresent,
      missing,
      setup: provider.setup,
      nextAction: ready ? provider.nextAction : `Add ${missing.join(', ')} in Vercel before enabling this provider.`,
    };
  });
}

export function buildClientProviderMap() {
  return PROVIDERS.map((provider) => ({
    id: provider.id,
    name: provider.name,
    category: provider.category,
    status: provider.id === 'openai-core' || provider.id === 'openai-web' ? 'Server checked' : (provider.id === 'openai-image' ? 'Route built' : 'Needs setup check'),
    risk: provider.risk,
    purpose: provider.purpose,
    setup: provider.setup,
    nextAction: provider.id === 'openai-image' ? 'Image generation route is built. Test a direct make/create image request from Talk after deployment.' : provider.nextAction,
  }));
}

export function summarizeProviderStatus(providers = []) {
  const connected = providers.filter((item) => item.ready || ['Connected', 'Provider available', 'Route ready', 'Route built', 'Token present', 'OAuth configured', 'Partially configured'].includes(item.status));
  const highRiskMissing = providers.filter((item) => item.risk === 'High' && !item.ready);
  const creatorMissing = providers.filter((item) => item.category === 'Creator' && !item.ready);
  return {
    total: providers.length,
    connected: connected.length,
    missing: providers.length - connected.length,
    highRiskMissing: highRiskMissing.length,
    creatorMissing: creatorMissing.length,
    mode: connected.length >= 2 ? 'Provider layer mapped' : 'Provider layer pending',
    nextProvider: providers.find((item) => !item.ready)?.name || 'No missing provider detected',
    recommendation: 'Keep OpenAI for web, coding and deep work. Optionally test Gemini as the routine worker. Do not enable realtime voice or external writes until secure session routes and approval gates are proven.',
  };
}
