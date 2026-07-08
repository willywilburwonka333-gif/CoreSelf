const OPENAI_IMAGE_URL = 'https://api.openai.com/v1/images/generations';

const ALLOWED_SIZES = new Set(['1024x1024', '1024x1536', '1536x1024', 'auto']);
const ALLOWED_QUALITIES = new Set(['auto', 'low', 'medium', 'high']);
const MAX_PROMPT_CHARS = 3800;

function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

function normalisePrompt(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, MAX_PROMPT_CHARS);
}

function safeSize(value) {
  const size = String(value || '1024x1024');
  return ALLOWED_SIZES.has(size) ? size : '1024x1024';
}

function safeQuality(value) {
  const quality = String(value || 'auto');
  return ALLOWED_QUALITIES.has(quality) ? quality : 'auto';
}

function extractImagePayload(data = {}) {
  const first = Array.isArray(data.data) ? data.data[0] : null;
  const b64 = first?.b64_json || first?.image_base64 || null;
  const url = first?.url || null;
  const mimeType = 'image/png';

  if (b64) {
    return {
      image: `data:${mimeType};base64,${b64}`,
      mimeType,
      delivery: 'base64',
    };
  }

  if (url) {
    return {
      image: url,
      mimeType: null,
      delivery: 'url',
    };
  }

  return null;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { ok: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return sendJson(response, 503, {
      ok: false,
      error: 'OPENAI_API_KEY is missing in the server environment.',
      nextAction: 'Add OPENAI_API_KEY in Vercel Environment Variables and redeploy.',
    });
  }

  const body = request.body || {};
  const prompt = normalisePrompt(body.prompt);
  if (!prompt || prompt.length < 12) {
    return sendJson(response, 400, {
      ok: false,
      error: 'Image prompt is too short.',
      nextAction: 'Send a clear visual prompt with subject, style, composition, and intended use.',
    });
  }

  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const size = safeSize(body.size);
  const quality = safeQuality(body.quality);

  try {
    const upstream = await fetch(OPENAI_IMAGE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        size,
        quality,
        n: 1,
      }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return sendJson(response, upstream.status, {
        ok: false,
        error: data.error?.message || 'Image provider rejected the request.',
        providerStatus: upstream.status,
        nextAction: 'Adjust the prompt or check OpenAI image access/billing in the provider account.',
      });
    }

    const imagePayload = extractImagePayload(data);
    if (!imagePayload) {
      return sendJson(response, 502, {
        ok: false,
        error: 'Image provider returned no usable image payload.',
        nextAction: 'Check provider response format and model access.',
      });
    }

    return sendJson(response, 200, {
      ok: true,
      prompt,
      model,
      size,
      quality,
      createdAt: new Date().toISOString(),
      ...imagePayload,
    });
  } catch (error) {
    return sendJson(response, 500, {
      ok: false,
      error: error.message || 'Image route failed safely.',
      nextAction: 'Retry after deployment or check server logs in Vercel.',
    });
  }
}
