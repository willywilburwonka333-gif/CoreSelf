export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });

  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_MODEL || 'standard-core';
  const deepModel = process.env.OPENAI_DEEP_MODEL || model;

  return response.status(200).json({
    ok: true,
    core: hasOpenAIKey ? 'online' : 'missing-api-key',
    provider: hasOpenAIKey ? 'core-provider' : 'local-fallback',
    model: hasOpenAIKey ? 'hidden-standard-core' : 'none',
    deepModel: hasOpenAIKey ? 'hidden-deep-core' : 'none',
    version: 'Genesis 0.4.1',
    nextAction: hasOpenAIKey
      ? 'Send a Dylan Core message to test identity, memory context, and routing.'
      : 'Add OPENAI_API_KEY in Vercel and redeploy production.',
    diagnostics: {
      hasOpenAIKey,
      standardConfigured: Boolean(model),
      deepConfigured: Boolean(deepModel),
    },
  });
}
