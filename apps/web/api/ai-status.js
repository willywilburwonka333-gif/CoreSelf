export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });

  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_MODEL || 'standard-core';
  const deepModel = process.env.OPENAI_DEEP_MODEL || model;
  const webModel = process.env.OPENAI_WEB_MODEL || model;
  const imageModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const imageReady = hasOpenAIKey;
  const githubReady = Boolean(process.env.GITHUB_TOKEN);
  const vercelReady = Boolean(process.env.VERCEL_TOKEN);
  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return response.status(200).json({
    ok: true,
    core: hasOpenAIKey ? 'online' : 'missing-api-key',
    provider: hasOpenAIKey ? 'core-provider' : 'local-fallback',
    model: hasOpenAIKey ? 'hidden-standard-core' : 'none',
    deepModel: hasOpenAIKey ? 'hidden-deep-core' : 'none',
    version: 'Milestone 7 - Image Creator Route',
    nextAction: hasOpenAIKey
      ? 'Test /api/create-image from the Talk screen with an image request.'
      : 'Add OPENAI_API_KEY in Vercel and redeploy production.',
    diagnostics: {
      hasOpenAIKey,
      standardConfigured: Boolean(model),
      deepConfigured: Boolean(deepModel),
      webConfigured: Boolean(webModel),
      imageReady,
      imageRouteReady: true,
      imageModelConfigured: Boolean(imageModel),
      imageModel: imageReady ? 'hidden-image-core' : 'none',
      githubReady,
      vercelReady,
      googleReady,
    },
    routes: {
      chat: '/api/chat',
      aiStatus: '/api/ai-status',
      createImage: '/api/create-image',
    },
  });
}
