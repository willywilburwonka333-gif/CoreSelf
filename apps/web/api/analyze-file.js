const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_TEXT_CHARS = 18000;

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

function dataUrlFor(file = {}) {
  return String(file.routeDataUrl || file.previewUrl || '');
}

function codeStats(text = '') {
  const lines = text.split(/\r?\n/);
  return {
    lines: lines.length,
    characters: text.length,
    imports: (text.match(/^\s*import\s/gm) || []).length,
    exports: (text.match(/^\s*export\s/gm) || []).length,
    todos: (text.match(/TODO|FIXME|HACK/gi) || []).length,
  };
}

function textFindings(text = '', kind = 'text') {
  const findings = [];
  if (/apiKey|secret|password|token\s*=/i.test(text)) findings.push('Potential secret-like text detected. Review before sharing or committing.');
  if (/TODO|FIXME|HACK/i.test(text)) findings.push('Contains TODO/FIXME/HACK markers.');
  if (/console\.log\(/.test(text)) findings.push('Contains console.log statements.');
  if (/throw new Error|catch\s*\(/.test(text)) findings.push('Contains error-handling paths worth reviewing.');
  if (kind === 'text' && text.length > 12000) findings.push('Large readable text/code file. Summary uses first analysed chunk.');
  return findings;
}

async function analyseImageWithVision({ file, prompt }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: true,
      fileName: file.name || 'image',
      kind: 'image',
      summary: 'Image attached and previewable. Vision analysis needs OPENAI_API_KEY configured on Vercel.',
      nextAction: 'Add OPENAI_API_KEY in Vercel, redeploy, then ask Dylan Core to analyse the image again.',
    };
  }

  const imageUrl = dataUrlFor(file);
  if (!imageUrl) {
    return {
      ok: true,
      fileName: file.name || 'image',
      kind: 'image',
      summary: 'Image metadata received, but no route image data was available for vision analysis.',
      nextAction: 'Upload an image under 6 MB so Core Self can route it to vision analysis.',
    };
  }

  const userRequest = String(prompt || 'Analyse this image for the user. Describe what is visible, note any UI/build issues if it is a screenshot, and give the next practical action.').slice(0, 1200);
  const upstream = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are the vision analyser inside Dylan Core. Be direct, practical, and concise. If the image is a screenshot, identify UI/build problems and the next fix. Do not mention hidden implementation details.' },
        { role: 'user', content: [
          { type: 'text', text: userRequest },
          { type: 'image_url', image_url: { url: imageUrl } },
        ] },
      ],
      temperature: 0.2,
    }),
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return {
      ok: false,
      fileName: file.name || 'image',
      kind: 'image',
      summary: data.error?.message || 'Vision provider rejected the image analysis request.',
      nextAction: 'Check model access, billing, and server logs, then retry.',
    };
  }

  const summary = data.choices?.[0]?.message?.content || 'Vision analysis completed.';
  return {
    ok: true,
    fileName: file.name || 'image',
    kind: 'image',
    summary,
    findings: ['Vision analysis completed from the chat attachment.'],
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });

  const file = req.body?.file || {};
  const prompt = req.body?.prompt || '';
  const name = file.name || 'attached file';
  const kind = file.kind || 'file';
  const size = file.sizeLabel || 'unknown size';
  const text = String(file.textPreview || '').trim().slice(0, MAX_TEXT_CHARS);

  try {
    if (kind === 'image') {
      return sendJson(res, 200, await analyseImageWithVision({ file, prompt }));
    }

    if (kind === 'text') {
      const stats = codeStats(text);
      const findings = textFindings(text, kind);
      const preview = text ? text.slice(0, 900) : '';
      return sendJson(res, 200, {
        ok: true,
        fileName: name,
        kind,
        summary: text ? `Readable text/code analysed (${stats.lines} lines). Preview: ${preview}${text.length > 900 ? '…' : ''}` : 'Text/code file received but no readable preview was extracted.',
        codeStats: stats,
        findings,
        nextAction: findings.length ? 'Review the findings, then ask Dylan Core to patch or rewrite the file.' : 'Ask Dylan Core what you want changed or extracted from this file.',
      });
    }

    if (kind === 'pdf') {
      return sendJson(res, 200, {
        ok: true,
        fileName: name,
        kind,
        summary: `PDF received (${size}). Core Self can route the file and remember it in the conversation, but full PDF text extraction still needs the next parser/provider pass.`,
        findings: ['PDF route data captured when under the browser routing limit.'],
        nextAction: 'For now, upload screenshots/pages or pasted text for exact reading; next milestone should add real PDF extraction.',
      });
    }

    if (kind === 'document') {
      return sendJson(res, 200, {
        ok: true,
        fileName: name,
        kind,
        summary: `Document received (${size}). Metadata and route data are captured; rich Office extraction still needs the document parser pass.`,
        nextAction: 'For exact content work, export/paste text or convert to PDF/text until document parsing is added.',
      });
    }

    return sendJson(res, 200, {
      ok: true,
      fileName: name,
      kind,
      summary: `${kind} received (${size}). Metadata captured for the work log.`,
      nextAction: 'Ask Dylan Core what to do with it next.',
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      fileName: name,
      kind,
      summary: error.message || 'File analysis failed safely.',
      nextAction: 'Retry after deployment or check Vercel server logs.',
    });
  }
}
