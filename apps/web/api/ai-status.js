import { buildProviderStatusFromEnv, summarizeProviderStatus } from '../src/services/providerConnectionEngine.js';
export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });

  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_MODEL || 'standard-core';
  const deepModel = process.env.OPENAI_DEEP_MODEL || model;
  const webModel = process.env.OPENAI_WEB_MODEL || model;
  const imageReady = Boolean(process.env.OPENAI_IMAGE_MODEL || process.env.IMAGE_API_KEY);
  const githubReady = Boolean(process.env.GITHUB_TOKEN);
  const vercelReady = Boolean(process.env.VERCEL_TOKEN);
  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const providerMap = buildProviderStatusFromEnv(process.env);
  const providerSummary = summarizeProviderStatus(providerMap);

  return response.status(200).json({
    ok: true,
    core: hasOpenAIKey ? 'online' : 'missing-api-key',
    provider: hasOpenAIKey ? 'core-provider' : 'local-fallback',
    model: hasOpenAIKey ? 'hidden-standard-core' : 'none',
    deepModel: hasOpenAIKey ? 'hidden-deep-core' : 'none',
    version: 'Milestone 6 - Provider Layer',
    nextAction: hasOpenAIKey
      ? 'Send a Dylan Core message to test identity, memory context, and routing.'
      : 'Add OPENAI_API_KEY in Vercel and redeploy production.',
    providerSummary,
    providers: providerMap.map((provider) => ({ id: provider.id, name: provider.name, category: provider.category, status: provider.status, ready: provider.ready, risk: provider.risk, missing: provider.missing, nextAction: provider.nextAction })),
    diagnostics: {
      hasOpenAIKey,
      standardConfigured: Boolean(model),
      deepConfigured: Boolean(deepModel),
      webConfigured: Boolean(webModel),
      imageReady,
      githubReady,
      vercelReady,
      googleReady,
      providerLayer: providerSummary.mode,
    },
  });
}
