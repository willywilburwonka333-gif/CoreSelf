const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const GENESIS_VERSION = '0.5.0';

function safeList(items, formatter) {
  if (!Array.isArray(items) || !items.length) return 'None loaded.';
  return items.map(formatter).join('\n');
}

function cleanMessages(messages = []) {
  if (!Array.isArray(messages)) return 'None.';
  return messages
    .slice(-10)
    .filter((message) => message && message.text)
    .map((message) => `${message.from === 'dylan' ? 'Dylan' : 'Dylan Core'}: ${String(message.text).slice(0, 1000)}`)
    .join('\n');
}

function buildSystemPrompt(body = {}) {
  const route = body.route || {};
  return `You are Dylan Core inside the Core Self app.

You are not a generic chatbot. You are Dylan Corr's persistent AI Core: memory-aware, project-aware, direct, practical, and built to help Dylan maximise his life, family, health, freedom, projects, money, learning, and execution.

Prime directive:
Protect Dylan's family, health, freedom, future, and control while helping him build real assets and become the highest possible version of himself.

Current engine route:
- Reasoning mode: ${route.reasoning || 'standard'}
- Live internet: ${route.internetAvailable ? 'available' : 'not available yet'}
- Internet requested by user: ${route.internetRequested ? 'yes' : 'no'}
- Version: ${GENESIS_VERSION}
- Core lane: Backend identity guard active

Non-negotiable behavior:
- Speak as Dylan Core. Do not introduce yourself as ChatGPT.
- Do not mention OpenAI, models, providers, or API details unless Dylan directly asks what powers the system.
- Use the loaded memories, projects, goals, plans, and recent chat before answering.
- If Dylan asks broad status questions like "what's next", "how are we going", or "where are we now", answer from the current Core Self/project context, not generic self-improvement advice.
- Never ask Dylan to identify 3-5 tasks/goals as a default reply. That was the old broken onboarding loop. Do not use it unless Dylan specifically asks for a coaching exercise.
- Be concise first. Give the next practical move. For short greetings, give a status update and one useful next action, not a questionnaire.
- Prefer exact build/deploy/debug steps when Dylan is working on code.
- If a requested capability is not connected yet, say it plainly and give the next implementation step.
- When live/current facts are needed but internet is unavailable, say "Live scan is not connected in this build yet" and avoid pretending to browse.
- Do not overpromise autonomy. Approval is required for risky actions.

Response shape:
Start with a direct answer in 1-2 sentences.
Then give the next step or short action list.
Use Dylan's existing context naturally. Do not dump raw context unless he asks.`;
}

function buildUserPrompt(body) {
  const memories = safeList(body.relevantMemories, (memory, index) =>
    `${index + 1}. ${memory.title || 'Untitled'} [${memory.importance || 'Normal'} / ${memory.level || 'Active'}] — ${memory.content || ''} ${memory.lesson ? `Lesson: ${memory.lesson}` : ''} ${memory.futureAction ? `Future action: ${memory.futureAction}` : ''}`
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

Loaded Dylan memories:
${memories}

Active projects:
${projects}

Active goals:
${goals}

Planning context:
${plans}

Recent conversation:
${cleanMessages(body.messages)}

Dylan's current message:
${body.input || ''}

Instruction: Answer as Dylan Core using the loaded context. If the answer would normally require live internet, and live internet is not available in the route, be clear that Live Scan is not connected yet and give the implementation path.`;
}


function needsIdentityGuard(reply = '', body = {}) {
  const text = String(reply || '').toLowerCase();
  const input = String(body.input || '').trim().toLowerCase();
  const shortStatusAsk = /^(hi|hello|hey|how is everything|how are we going|what'?s next|next|where are we now)\??$/.test(input);
  const genericLoop = /3\s*[-–]\s*5|specific tasks|areas where you'?d like support|freeing up time for your family|what comes to mind|personal development goals|household chores/.test(text);
  return shortStatusAsk && genericLoop;
}

function guardedCoreReply(body = {}) {
  const route = body.route || {};
  const memories = Array.isArray(body.relevantMemories) ? body.relevantMemories.length : 0;
  const projects = Array.isArray(body.projects) ? body.projects.length : 0;
  const goals = Array.isArray(body.goals) ? body.goals.length : 0;
  const internet = route.internetAvailable ? 'connected' : 'queued, not live yet';

  return `Dylan. The Core pipeline is now the priority, not more generic chat polish.\n\nCurrent state: identity guard is active, seeded memory is being loaded, projects/goals are being passed into the backend, and Live Scan is ${internet}.\n\nContext received this request: ${memories} relevant memories, ${projects} projects, ${goals} goals.\n\nNext move: test with “What do you know about me and my projects?” If I still answer generically, the issue is the deployed route or old cached conversation lane, not the model.`;
}

function errorCodeFor(openaiStatus, message = '') {
  const lower = String(message).toLowerCase();
  if (openaiStatus === 401) return 'BAD_API_KEY';
  if (openaiStatus === 429) return 'RATE_LIMIT_OR_BILLING';
  if (openaiStatus === 403) return 'MODEL_OR_ACCOUNT_PERMISSION';
  if (lower.includes('billing') || lower.includes('quota')) return 'RATE_LIMIT_OR_BILLING';
  if (lower.includes('model')) return 'MODEL_OR_ACCOUNT_PERMISSION';
  return 'CORE_PROVIDER_REQUEST_FAILED';
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const startedAt = Date.now();
  const hasKey = Boolean(process.env.OPENAI_API_KEY);

  if (!hasKey) {
    return response.status(501).json({
      provider: 'core-provider',
      model: 'none',
      source: 'diagnostic',
      reply: null,
      code: 'MISSING_OPENAI_API_KEY',
      error: 'OPENAI_API_KEY is missing from this server deployment.',
      nextAction: 'Add OPENAI_API_KEY in Vercel Project Settings → Environment Variables, then redeploy production.',
      diagnostics: { hasOpenAIKey: false, deployment: process.env.VERCEL ? 'vercel' : 'local-node', version: GENESIS_VERSION },
    });
  }

  try {
    const body = request.body || {};
    const route = body.route || {};
    const standardModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const deepModel = process.env.OPENAI_DEEP_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const model = route.reasoning === 'deep' ? deepModel : standardModel;

    const openaiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: route.reasoning === 'deep' ? 0.25 : 0.35,
        max_tokens: route.reasoning === 'deep' ? 1100 : 750,
        messages: [
          { role: 'system', content: buildSystemPrompt(body) },
          { role: 'user', content: buildUserPrompt(body) },
        ],
      }),
    });

    const data = await openaiResponse.json().catch(() => ({}));

    if (!openaiResponse.ok) {
      const message = data?.error?.message || `Core provider request failed with status ${openaiResponse.status}.`;
      return response.status(openaiResponse.status).json({
        provider: 'core-provider',
        model,
        source: 'diagnostic',
        code: errorCodeFor(openaiResponse.status, message),
        error: message,
        nextAction: openaiResponse.status === 429
          ? 'Check API billing/credits/rate limits, then retry.'
          : 'Check the Vercel OPENAI_API_KEY value and optional model settings.',
        diagnostics: { hasOpenAIKey: true, providerStatus: openaiResponse.status, version: GENESIS_VERSION },
      });
    }

    const rawReply = data.choices?.[0]?.message?.content?.trim();
    const reply = needsIdentityGuard(rawReply, body) ? guardedCoreReply(body) : rawReply;

    return response.status(200).json({
      provider: 'core-provider',
      model: route.reasoning === 'deep' ? 'deep-core' : 'standard-core',
      source: 'dylan-core-engine',
      confidence: route.reasoning === 'deep' ? 0.91 : 0.88,
      latencyMs: Date.now() - startedAt,
      reply: reply || 'Dylan Core returned no message.',
      usage: data.usage || null,
      route: { ...route, version: GENESIS_VERSION },
      diagnostics: { hasOpenAIKey: true, version: GENESIS_VERSION },
    });
  } catch (error) {
    return response.status(500).json({
      provider: 'core-provider',
      model: 'core-engine',
      source: 'diagnostic',
      code: 'CORE_API_ERROR',
      error: error.message || 'Core API error.',
      nextAction: 'Redeploy and check Vercel Function logs for /api/chat.',
      diagnostics: { hasOpenAIKey: true, version: GENESIS_VERSION },
    });
  }
}
