export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  return response.status(200).json({
    ok: hasOpenAIKey,
    provider: hasOpenAIKey ? 'openai' : 'local-fallback',
    model: hasOpenAIKey ? model : 'none',
    version: '0.2.0',
    message: hasOpenAIKey
      ? 'OPENAI_API_KEY is present in this deployment.'
      : 'OPENAI_API_KEY is missing from this deployment.',
    nextAction: hasOpenAIKey
      ? 'Send a Talk message to test the Production AI Backend.'
      : 'Add OPENAI_API_KEY in Vercel Environment Variables and redeploy.',
  });
}
