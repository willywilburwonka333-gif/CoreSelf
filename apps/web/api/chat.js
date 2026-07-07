const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const GENESIS_VERSION = '0.3.0';

function safeList(items, formatter) {
  if (!Array.isArray(items) || !items.length) return 'None yet.';
  return items.map(formatter).join('\n');
}

function cleanMessages(messages = []) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-8)
    .filter((message) => message && message.text)
    .map((message) => `${message.from === 'dylan' ? 'Dylan' : 'Core'}: ${String(message.text).slice(0, 900)}`)
    .join('\n');
}

function buildSystemPrompt() {
  return `You are Dylan Core inside the Core Self app. You are the Real AI Conversations + Long-Term Memory layer for a personal AI operating system, not a generic chatbot.

Prime directive: help Dylan become the highest possible version of himself while protecting family, health, freedom, future, and control.

Operating rules:
- Be direct, practical, grounded, and useful.
- Use the supplied Core Self context before answering: memories, projects, goals, plans, mode, and recent chat.
- When context is relevant, connect it to the answer naturally instead of dumping raw data.
- If context is missing, say what is missing and give the next useful step.
- Never claim tool access you do not have. You cannot browse, email, edit files, spend money, or control services unless a future tool route explicitly provides that capability.
- Security first: for risky actions, recommend an approval step.
- Keep responses mobile-friendly. Prefer tight paragraphs and one clear next action.
- You are allowed to think strategically, but do not overpromise.
- If Dylan asks what you are, say you are Dylan Core running through Core Self with an external AI provider underneath.`;
}

function buildUserPrompt(body) {
  const memories = safeList(body.relevantMemories, (memory, index) =>
    `${index + 1}. ${memory.title || 'Untitled'} — ${memory.content || ''} ${memory.lesson ? `Lesson: ${memory.lesson}` : ''} ${memory.futureAction ? `Future action: ${memory.futureAction}` : ''}`
  );

  const projects = safeList(body.projects, (project, index) =>
    `${index + 1}. ${project.name || project.title || 'Untitled project'} [${project.priority || 'No priority'} / ${project.status || 'No status'}] — ${project.purpose || ''} Next: ${project.nextAction || 'Not set'}`
  );

  const goals = safeList(body.goals, (goal, index) =>
    `${index + 1}. ${goal.title || 'Untitled goal'} [${goal.priority || 'No priority'} / ${goal.status || 'No status'}] — ${goal.target || ''}`
  );

  const plans = safeList(body.plans, (plan, index) =>
    `${index + 1}. ${plan.title || plan.name || 'Untitled plan'} — ${plan.nextAction || plan.summary || 'No next action set.'}`
  );

  return `Core mode: ${body.mode || 'Talk'}

Relevant memories:
${memories}

Active projects:
${projects}

Active goals:
${goals}

Planning context:
${plans}

Recent conversation:
${cleanMessages(body.messages)}

Current message from Dylan:
${body.input || ''}`;
}

function errorCodeFor(openaiStatus, message = '') {
  const lower = String(message).toLowerCase();
  if (openaiStatus === 401) return 'BAD_API_KEY';
  if (openaiStatus === 429) return 'RATE_LIMIT_OR_BILLING';
  if (openaiStatus === 403) return 'MODEL_OR_ACCOUNT_PERMISSION';
  if (lower.includes('billing') || lower.includes('quota')) return 'RATE_LIMIT_OR_BILLING';
  if (lower.includes('model')) return 'MODEL_OR_ACCOUNT_PERMISSION';
  return 'OPENAI_REQUEST_FAILED';
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const startedAt = Date.now();
  const hasKey = Boolean(process.env.OPENAI_API_KEY);

  if (!hasKey) {
    return response.status(501).json({
      provider: 'local-fallback',
      model: 'none',
      source: 'diagnostic',
      reply: null,
      code: 'MISSING_OPENAI_API_KEY',
      error: 'OPENAI_API_KEY is missing from this server deployment.',
      nextAction: 'Add OPENAI_API_KEY in Vercel Project Settings → Environment Variables, then redeploy the latest production deployment.',
      diagnostics: { hasOpenAIKey: false, deployment: process.env.VERCEL ? 'vercel' : 'local-node', version: GENESIS_VERSION },
    });
  }

  try {
    const body = request.body || {};
    const isVercel = Boolean(process.env.VERCEL);
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const openaiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 700,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(body) },
        ],
      }),
    });

    const data = await openaiResponse.json().catch(() => ({}));

    if (!openaiResponse.ok) {
      const message = data?.error?.message || `OpenAI request failed with status ${openaiResponse.status}.`;
      return response.status(openaiResponse.status).json({
        provider: 'openai',
        model,
        source: 'diagnostic',
        code: errorCodeFor(openaiResponse.status, message),
        error: message,
        nextAction: openaiResponse.status === 429
          ? 'Check OpenAI Platform billing/credits/rate limits, then retry.'
          : 'Check the Vercel OPENAI_API_KEY value and optional OPENAI_MODEL setting.',
        diagnostics: { hasOpenAIKey: true, openaiStatus: openaiResponse.status, version: GENESIS_VERSION },
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    return response.status(200).json({
      provider: 'openai',
      model,
      source: 'real-ai-brain',
      confidence: 0.88,
      latencyMs: Date.now() - startedAt,
      reply: reply || 'Core AI returned no message.',
      usage: data.usage || null,
      diagnostics: { hasOpenAIKey: true, version: GENESIS_VERSION },
    });
  } catch (error) {
    return response.status(500).json({
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      source: 'diagnostic',
      code: 'CORE_API_ERROR',
      error: error.message || 'Core API error.',
      nextAction: 'Redeploy and check Vercel Function logs for /api/chat.',
      diagnostics: { hasOpenAIKey: true, version: GENESIS_VERSION },
    });
  }
}
