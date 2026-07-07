const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function safeList(items, formatter) {
  if (!Array.isArray(items) || !items.length) return 'None yet.';
  return items.map(formatter).join('\n');
}

function buildSystemPrompt() {
  return `You are Dylan Core inside the Core Self app. You are not a generic chatbot.

Prime directive: help Dylan become the highest possible version of himself while protecting family, health, freedom, future, and control.

Rules:
- Be direct, practical, and grounded in the supplied Core Self context.
- Use saved memories, projects, goals, and plans when relevant.
- If context is missing, say what is missing and give the next useful action.
- Do not pretend you have cloud memory, external access, calendar access, email access, or authority you do not have.
- Keep replies concise enough for mobile, but useful.
- End with one clear next action when appropriate.`;
}

function buildUserPrompt(body) {
  const memories = safeList(body.relevantMemories, (memory, index) =>
    `${index + 1}. ${memory.title || 'Untitled'} — ${memory.content || ''} ${memory.futureAction ? `Future action: ${memory.futureAction}` : ''}`
  );

  const projects = safeList(body.projects, (project, index) =>
    `${index + 1}. ${project.name} [${project.priority || 'No priority'} / ${project.status || 'No status'}] — ${project.purpose || ''} Next: ${project.nextAction || 'Not set'}`
  );

  const goals = safeList(body.goals, (goal, index) =>
    `${index + 1}. ${goal.title} [${goal.priority || 'No priority'} / ${goal.status || 'No status'}] — ${goal.target || ''}`
  );

  return `Mode: ${body.mode || 'Talk'}

Relevant memories:
${memories}

Projects:
${projects}

Goals:
${goals}

Dylan says:
${body.input || ''}`;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(501).json({ error: 'OPENAI_API_KEY is not configured in Vercel.' });
  }

  try {
    const body = request.body || {};
    const openaiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.35,
        max_tokens: 450,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(body) },
        ],
      }),
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return response.status(openaiResponse.status).json({
        error: data?.error?.message || 'OpenAI request failed.',
      });
    }

    return response.status(200).json({
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      confidence: 0.82,
      reply: data.choices?.[0]?.message?.content?.trim() || 'Core AI returned no message.',
    });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Core API error.' });
  }
}
