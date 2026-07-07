import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const GENESIS_VERSION = '0.2.0';
const DEFAULT_MODEL = 'gpt-4o-mini';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function readJson(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function safeList(items, formatter) {
  if (!Array.isArray(items) || !items.length) return 'None yet.';
  return items.map(formatter).join('\n');
}

function cleanMessages(messages = []) {
  if (!Array.isArray(messages)) return '';
  return messages
    .slice(-8)
    .filter((message) => message && message.text)
    .map((message) => `${message.from === 'dylan' ? 'Dylan' : 'Core'}: ${String(message.text).slice(0, 900)}`)
    .join('\n');
}

function buildSystemPrompt() {
  return `You are Dylan Core inside the Core Self app. You are the Real AI Brain layer for a personal AI operating system, not a generic chatbot. Be direct, practical, grounded, mobile-friendly, and security-aware. Use supplied memories, projects, goals, plans, and recent chat before answering. Never claim tool access you do not have.`;
}

function buildUserPrompt(body) {
  const memories = safeList(body.relevantMemories, (memory, index) => `${index + 1}. ${memory.title || 'Untitled'} — ${memory.content || ''}`);
  const projects = safeList(body.projects, (project, index) => `${index + 1}. ${project.name || project.title || 'Untitled project'} — ${project.nextAction || project.purpose || ''}`);
  const goals = safeList(body.goals, (goal, index) => `${index + 1}. ${goal.title || 'Untitled goal'} — ${goal.target || ''}`);
  const plans = safeList(body.plans, (plan, index) => `${index + 1}. ${plan.title || plan.name || 'Untitled plan'} — ${plan.nextAction || plan.summary || ''}`);
  return `Core mode: ${body.mode || 'Talk'}\n\nRelevant memories:\n${memories}\n\nActive projects:\n${projects}\n\nActive goals:\n${goals}\n\nPlanning context:\n${plans}\n\nRecent conversation:\n${cleanMessages(body.messages)}\n\nCurrent message from Dylan:\n${body.input || ''}`;
}

async function callOpenAI(body) {
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
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
    const error = data?.error?.message || `OpenAI request failed with ${openaiResponse.status}.`;
    return { ok: false, status: openaiResponse.status, json: { provider: 'openai', model, source: 'diagnostic', code: 'OPENAI_REQUEST_FAILED', error, diagnostics: { hasOpenAIKey: true, openaiStatus: openaiResponse.status, version: GENESIS_VERSION } } };
  }
  return { ok: true, status: 200, json: { provider: 'openai', model, source: 'real-ai-brain', confidence: 0.88, reply: data.choices?.[0]?.message?.content?.trim() || 'Core AI returned no message.', usage: data.usage || null, diagnostics: { hasOpenAIKey: true, version: GENESIS_VERSION } } };
}

function coreDevApiPlugin() {
  return {
    name: 'core-self-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/ai-status', (req, res) => {
        if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
        const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
        sendJson(res, 200, {
          ok: hasOpenAIKey,
          environment: 'codespaces-dev',
          provider: hasOpenAIKey ? 'openai' : 'local-fallback',
          model: hasOpenAIKey ? (process.env.OPENAI_MODEL || DEFAULT_MODEL) : 'none',
          version: GENESIS_VERSION,
          message: hasOpenAIKey ? 'OPENAI_API_KEY is present in this Codespaces dev server.' : 'OPENAI_API_KEY is not present in this Codespaces dev server. Vercel may still work if the variable is saved there.',
        });
      });

      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
        if (!process.env.OPENAI_API_KEY) {
          return sendJson(res, 501, { provider: 'local-fallback', model: 'none', source: 'diagnostic', code: 'LOCAL_DEV_OPENAI_KEY_MISSING', error: 'Codespaces dev server does not have OPENAI_API_KEY. This is not a crash; deploy to Vercel or add the key to Codespaces secrets to test real AI locally.', diagnostics: { hasOpenAIKey: false, version: GENESIS_VERSION } });
        }
        const body = await readJson(req);
        const result = await callOpenAI(body);
        return sendJson(res, result.status, result.json);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), coreDevApiPlugin()],
});
