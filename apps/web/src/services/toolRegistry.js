import { load, save } from './localStore';
import { logActivity } from './activityLog';
import { buildRuntimeSnapshot, executeToolRuntime } from './toolRuntimeEngine';

export const defaultTools = [
  { id: 'memory-recall', aliases: ['memory'], name: 'Memory Recall', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Search confirmed memories and context before answering.', risk: 'Low' },
  { id: 'memory-compression', aliases: ['context'], name: 'Memory Compression', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Summarise and prioritise memory context.', risk: 'Low' },
  { id: 'knowledge-graph', aliases: ['graph'], name: 'Knowledge Graph', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Link projects, goals, plans and memories into one context map.', risk: 'Low' },
  { id: 'ai-orchestrator', aliases: ['orchestrator'], name: 'AI Orchestrator', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Detect intent, select tools, choose answer style and prepare next actions.', risk: 'Low' },
  { id: 'research-comparator', aliases: ['research'], name: 'Research Comparator', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Rank web/research results against Dylan’s real Core Self stack instead of dumping lists.', risk: 'Low' },
  { id: 'action-queue', aliases: ['actions'], name: 'Action Queue', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Create, start, complete, and log actions.', risk: 'Low' },
  { id: 'planning-engine', aliases: ['planner'], name: 'Planning Engine', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Build daily, weekly, and project plans.', risk: 'Low' },
  { id: 'creator-suite', aliases: ['creator', 'images', 'video', 'music', 'books', 'marketing'], name: 'Creator Platform', category: 'Creator', status: 'Ready', permission: 'Allowed', capability: 'Route image, video, music, book, marketing, business document and product requests into a production-ready workflow. Direct external generation still needs provider setup.', risk: 'Medium' },
  { id: 'image-prompt-studio', aliases: ['image prompt', 'thumbnail', 'cover'], name: 'Image Prompt Studio', category: 'Creator', status: 'Ready', permission: 'Allowed', capability: 'Create detailed image, thumbnail, poster, cover and visual prompts ready for external generators.', risk: 'Low' },
  { id: 'video-production-planner', aliases: ['video prompt', 'film clip', 'trailer'], name: 'Video Production Planner', category: 'Creator', status: 'Ready', permission: 'Allowed', capability: 'Create shot lists, scene prompts, timing, camera directions and edit order for video generators.', risk: 'Low' },
  { id: 'music-prompt-studio', aliases: ['song', 'lyrics', 'music prompt'], name: 'Music Prompt Studio', category: 'Creator', status: 'Ready', permission: 'Allowed', capability: 'Create lyrics, song structures, genre prompts, emotional direction and production notes.', risk: 'Low' },
  { id: 'book-builder', aliases: ['book', 'chapter', 'ebook'], name: 'Book Builder', category: 'Creator', status: 'Ready', permission: 'Allowed', capability: 'Create book outlines, chapter plans, lore bibles, draft briefs and long-form writing workflows.', risk: 'Low' },
  { id: 'marketing-writer', aliases: ['tiktok', 'caption', 'launch', 'ad'], name: 'Marketing Writer', category: 'Creator', status: 'Ready', permission: 'Allowed', capability: 'Create hooks, captions, launch posts, app store replies, content calendars and campaign plans.', risk: 'Low' },
  { id: 'business-builder', aliases: ['business', 'income'], name: 'Business Builder', category: 'Business', status: 'Ready', permission: 'Allowed', capability: 'Use current AI brain and memory to produce plans, pitches, forecasts and income strategy.', risk: 'Medium' },
  { id: 'web-research', aliases: ['web'], name: 'Web Research', category: 'External', status: 'Ready', permission: 'Allowed', capability: 'Research current public information through the configured OpenAI web route when available.', risk: 'Medium' },
  { id: 'developer-build-assistant', aliases: ['code', 'files', 'zip'], name: 'Developer Build Assistant', category: 'Developer', status: 'Ready', permission: 'Allowed', capability: 'Guide ZIP inspection, replacement files, build/debug/deploy commands and release workflows. Real server-side file mutation comes later.', risk: 'Medium' },
  { id: 'bug-triage', aliases: ['triage', 'terminal error', 'screenshot bug'], name: 'Bug Triage', category: 'Developer', status: 'Ready', permission: 'Allowed', capability: 'Classify screenshots, console/build errors and regressions into likely failing layers with the next file/command to check.', risk: 'Low' },
  { id: 'release-command-helper', aliases: ['commands', 'build commands', 'deploy commands'], name: 'Release Command Helper', category: 'Developer', status: 'Ready', permission: 'Allowed', capability: 'Produce exact npm build/check, Vercel, git commit and push command sequences for Core Self workflows.', risk: 'Low' },
  { id: 'replacement-file-workflow', aliases: ['txt replacements', 'single file replacements', 'changed files'], name: 'Replacement File Workflow', category: 'Developer', status: 'Ready', permission: 'Allowed', capability: 'Enforce individual TXT file replacements, exact destination names, and changed-files-only handoff discipline.', risk: 'Low' },
  { id: 'github-vercel-firebase', aliases: ['github', 'vercel', 'firebase'], name: 'GitHub / Vercel / Firebase Ops', category: 'Developer', status: 'Needs setup', permission: 'Ask first', capability: 'Read repos/deployments/Firebase status later. Write actions require tokens and approval gates.', risk: 'High' },
  { id: 'calendar', aliases: ['google-calendar'], name: 'Calendar', category: 'External', status: 'Needs setup', permission: 'Ask first', capability: 'Read or create scheduled items once connected.', risk: 'Medium' },
  { id: 'email', aliases: ['gmail'], name: 'Email', category: 'External', status: 'Locked', permission: 'Blocked', capability: 'Draft or inspect email only after explicit setup.', risk: 'High' },
  { id: 'drive', aliases: ['google-drive'], name: 'Drive / Files', category: 'External', status: 'Needs setup', permission: 'Ask first', capability: 'Read uploaded documents and future Drive files when connected.', risk: 'Medium' },
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
  const planning = tools.filter((tool) => tool.status === 'Planning');
  const runtime = buildRuntimeSnapshot(tools);
  return {
    total: tools.length,
    ready: ready.length,
    allowed: allowed.length,
    executable: executable.length,
    needsSetup: needsSetup.length,
    locked: locked.length,
    planning: planning.length,
    runtime,
    mode: runtime.runnable >= 12 ? 'Tool Runtime active' : (executable.length >= 7 ? 'Orchestrated internal tools online' : 'Tool foundation only'),
    summary: runtime.runnable >= 12
      ? `${runtime.runnable} safe internal tool(s) can run now. External write tools still require server routes and approval.`
      : (executable.length >= 7
        ? `${executable.length} tool(s) are safe to use internally. External write tools still require setup and approval.`
        : 'Tool registry exists, but execution must stay guarded until setup and approval are complete.'),
  };
}

export function createToolExecution(tool, input = {}) {
  const execution = executeToolRuntime(tool, input);
  logActivity({ engine: 'Tool Registry', action: execution.status === 'Completed' ? 'Tool runtime recorded' : 'Tool runtime blocked', detail: `${tool.name}: ${execution.status}`, level: execution.status === 'Completed' ? 'Info' : 'Warning' });
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
