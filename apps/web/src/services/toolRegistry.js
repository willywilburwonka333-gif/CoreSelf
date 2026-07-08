import { load, save } from './localStore';
import { logActivity } from './activityLog';

export const defaultTools = [
  { id: 'memory-recall', name: 'Memory Recall', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Search confirmed memories and context.', risk: 'Low' },
  { id: 'memory-compression', name: 'Memory Compression', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Summarise and prioritise memory context.', risk: 'Low' },
  { id: 'action-queue', name: 'Action Queue', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Create, start, complete, and log actions.', risk: 'Low' },
  { id: 'planning-engine', name: 'Planning Engine', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Build daily, weekly, and project plans.', risk: 'Low' },
  { id: 'openai-brain', name: 'OpenAI Brain', category: 'AI Core', status: 'Ready', permission: 'Allowed', capability: 'Route chat, reasoning, planning, coding and creator requests through the server-side AI route.', risk: 'Medium' },
  { id: 'web-research', name: 'Live Web Research', category: 'AI Core', status: 'Needs setup', permission: 'Ask first', capability: 'Research current public information through the configured AI web-search route.', risk: 'Medium' },
  { id: 'vision', name: 'Vision / Image Understanding', category: 'Creator', status: 'Needs setup', permission: 'Ask first', capability: 'Understand uploaded screenshots, images, app bugs, store screenshots and visual assets once upload/vision route is added.', risk: 'Medium' },
  { id: 'image-generation', name: 'Image Generation', category: 'Creator', status: 'Needs setup', permission: 'Ask first', capability: 'Create launch art, thumbnails, promotional pictures, concept art and store assets through a server-side image route.', risk: 'Medium' },
  { id: 'video-generation', name: 'Video Generation', category: 'Creator', status: 'Needs setup', permission: 'Ask first', capability: 'Create or orchestrate short clips, trailers, film clips and social video workflows through an external provider.', risk: 'High' },
  { id: 'music-audio', name: 'Music / Audio Workflow', category: 'Creator', status: 'Needs setup', permission: 'Ask first', capability: 'Write songs, prompts, voiceover scripts, soundtrack plans and later connect to audio providers.', risk: 'Medium' },
  { id: 'book-writer', name: 'Book / Document Builder', category: 'Business', status: 'Ready', permission: 'Allowed', capability: 'Plan and draft books, pitch docs, business plans, grants, launch copy and long-form content.', risk: 'Low' },
  { id: 'business-builder', name: 'Business / Income Builder', category: 'Business', status: 'Ready', permission: 'Allowed', capability: 'Create offers, funnels, product plans, IBA/grant docs, forecasts, monetisation maps and content calendars.', risk: 'Medium' },
  { id: 'developer-assistant', name: 'Developer Build Assistant', category: 'Developer', status: 'Needs setup', permission: 'Ask first', capability: 'Inspect ZIPs, modify files, generate replacement packs, debug builds and prepare deploy commands once a backend worker is added.', risk: 'High' },
  { id: 'github', name: 'GitHub', category: 'Developer', status: 'Needs setup', permission: 'Ask first', capability: 'Read repos, inspect diffs, prepare commits and later create pull requests after token/OAuth setup.', risk: 'High' },
  { id: 'vercel', name: 'Vercel', category: 'Developer', status: 'Needs setup', permission: 'Ask first', capability: 'Check deployments, environment status and release failures after token setup.', risk: 'High' },
  { id: 'firebase', name: 'Firebase', category: 'Developer', status: 'Needs setup', permission: 'Ask first', capability: 'Inspect Auth/Firestore/rules/deploy state after Firebase Admin setup.', risk: 'High' },
  { id: 'files', name: 'Files / Documents', category: 'External', status: 'Needs setup', permission: 'Ask first', capability: 'Read uploaded documents, PDFs, ZIPs, spreadsheets and project files when a server-side file route is added.', risk: 'Medium' },
  { id: 'calendar', name: 'Calendar', category: 'External', status: 'Needs setup', permission: 'Ask first', capability: 'Read or create scheduled items once Google OAuth is connected.', risk: 'Medium' },
  { id: 'email', name: 'Email', category: 'External', status: 'Locked', permission: 'Blocked', capability: 'Draft, inspect or send email only after explicit Google OAuth setup and approval gates.', risk: 'High' },
  { id: 'drive', name: 'Google Drive', category: 'External', status: 'Needs setup', permission: 'Ask first', capability: 'Search, read and organise user Drive files after Google OAuth setup.', risk: 'High' },
];

export function loadToolRegistry() {
  const saved = load('toolRegistry', null);
  if (!Array.isArray(saved) || !saved.length) return defaultTools;
  const merged = defaultTools.map((tool) => ({ ...tool, ...(saved.find((item) => item.id === tool.id) || {}) }));
  const extras = saved.filter((item) => !defaultTools.some((tool) => tool.id === item.id));
  return [...merged, ...extras];
}

export function saveToolRegistry(tools) {
  save('toolRegistry', tools);
}

export function buildToolReadiness(tools = loadToolRegistry()) {
  const ready = tools.filter((tool) => tool.status === 'Ready');
  const allowed = tools.filter((tool) => tool.permission === 'Allowed');
  const executable = tools.filter((tool) => tool.status === 'Ready' && tool.permission === 'Allowed');
  const needsSetup = tools.filter((tool) => tool.status === 'Needs setup');
  const locked = tools.filter((tool) => tool.status === 'Locked' || tool.permission === 'Blocked');
  return {
    total: tools.length,
    ready: ready.length,
    allowed: allowed.length,
    executable: executable.length,
    needsSetup: needsSetup.length,
    locked: locked.length,
    mode: executable.length >= 4 ? 'Internal tools online' : 'Tool foundation only',
    summary: executable.length >= 4
      ? `${executable.length} internal tool(s) are safe to use. External tools still require setup and approval.`
      : 'Tool registry exists, but execution must stay guarded until setup and approval are complete.',
  };
}

export function createToolExecution(tool, input = {}) {
  const execution = {
    id: crypto.randomUUID(),
    toolId: tool.id,
    toolName: tool.name,
    status: tool.status === 'Ready' && tool.permission === 'Allowed' ? 'Completed' : 'Blocked',
    requestedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    input,
    result: tool.status === 'Ready' && tool.permission === 'Allowed'
      ? `${tool.name} checked. This is an internal foundation action, not an external API call.`
      : `${tool.name} cannot run yet. Status: ${tool.status}. Permission: ${tool.permission}.`,
  };
  const history = load('toolExecutionLog', []);
  save('toolExecutionLog', [execution, ...history].slice(0, 100));
  logActivity({ engine: 'Tool Registry', action: execution.status === 'Completed' ? 'Tool execution recorded' : 'Tool execution blocked', detail: `${tool.name}: ${execution.status}`, level: execution.status === 'Completed' ? 'Info' : 'Warning' });
  return execution;
}

export function buildToolActions(tools = loadToolRegistry()) {
  return tools.map((tool) => ({
    id: `tool-action-${tool.id}`,
    type: 'Tool Setup',
    title: tool.status === 'Ready' ? `Use ${tool.name}` : `Set up ${tool.name}`,
    detail: tool.capability,
    nextStep: tool.status === 'Ready' && tool.permission === 'Allowed'
      ? 'Run an internal test execution and record the result.'
      : 'Confirm setup and permission before enabling execution.',
    priority: tool.status === 'Ready' ? 'Medium' : tool.risk === 'High' ? 'Low' : 'Medium',
    source: 'Tool Registry',
    toolId: tool.id,
  }));
}
