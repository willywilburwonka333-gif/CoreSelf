const TASK_RULES = [
  { profile: 'internet', pattern: /\b(today|latest|current|news|search|internet|look up|price|release|recent|verify|source)\b/i },
  { profile: 'coding', pattern: /\b(code|coding|build|fix|debug|bug|deploy|github|commit|npm|react|vite|api|javascript|jsx|css|typescript|node)\b/i },
  { profile: 'deep', pattern: /\b(deep|strategy|architecture|roadmap|business plan|funding|refactor|complex|compare|decide|analyse|analyze|reason|system design|hard problem)\b/i },
];

export function classifyModelTask(input = '', { deepThink = false } = {}) {
  const text = String(input || '');
  if (TASK_RULES[0].pattern.test(text)) return 'internet';
  if (deepThink) return 'deep';
  return TASK_RULES.find((rule) => rule.pattern.test(text))?.profile || 'standard';
}

export function buildRuntimeModelMap(env = {}) {
  const openAiReady = Boolean(env.OPENAI_API_KEY);
  const geminiReady = Boolean(env.GEMINI_API_KEY && env.GEMINI_MODEL);

  return {
    providers: {
      openai: {
        ready: openAiReady,
        standardModel: env.OPENAI_MODEL || 'gpt-4o-mini',
        deepModel: env.OPENAI_DEEP_MODEL || env.OPENAI_REASONING_MODEL || env.OPENAI_MODEL || 'gpt-4o-mini',
        webModel: env.OPENAI_WEB_MODEL || env.OPENAI_MODEL || 'gpt-4o-mini',
      },
      gemini: {
        ready: geminiReady,
        standardModel: env.GEMINI_MODEL || null,
      },
    },
    policy: {
      standard: geminiReady ? ['gemini', 'openai'] : ['openai'],
      coding: ['openai', ...(geminiReady ? ['gemini'] : [])],
      deep: ['openai', ...(geminiReady ? ['gemini'] : [])],
      internet: ['openai'],
    },
  };
}

export function chooseProviderRoute({ input = '', deepThink = false, env = {} } = {}) {
  const map = buildRuntimeModelMap(env);
  const profile = classifyModelTask(input, { deepThink });
  const candidates = map.policy[profile].filter((provider) => map.providers[provider]?.ready);
  const provider = candidates[0] || null;
  const providerConfig = provider ? map.providers[provider] : null;
  const model = provider === 'openai'
    ? (profile === 'internet' ? providerConfig.webModel : (profile === 'deep' || profile === 'coding' ? providerConfig.deepModel : providerConfig.standardModel))
    : providerConfig?.standardModel;

  return {
    profile,
    provider,
    model: model || null,
    candidates,
    fallbackProvider: candidates[1] || null,
    ready: Boolean(provider && model),
    reason: provider
      ? `${profile} work routed to ${provider}; ${candidates[1] ? `${candidates[1]} is the fallback` : 'no second provider is configured'}.`
      : 'No compatible server-side model provider is configured.',
  };
}

export function publicRoutingSummary(env = {}) {
  const map = buildRuntimeModelMap(env);
  return {
    mode: map.providers.gemini.ready && map.providers.openai.ready ? 'multi-provider' : (map.providers.openai.ready || map.providers.gemini.ready ? 'single-provider' : 'offline'),
    providers: {
      openai: map.providers.openai.ready,
      gemini: map.providers.gemini.ready,
    },
    profiles: Object.fromEntries(Object.entries(map.policy).map(([profile, providers]) => [profile, providers.filter((provider) => map.providers[provider]?.ready)])),
  };
}
