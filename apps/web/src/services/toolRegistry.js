import { load, save } from './localStore';
import { logActivity } from './activityLog';

export const defaultTools = [
  { id: 'memory-recall', name: 'Memory Recall', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Search confirmed memories and context.', risk: 'Low' },
  { id: 'memory-compression', name: 'Memory Compression', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Summarise and prioritise memory context.', risk: 'Low' },
  { id: 'action-queue', name: 'Action Queue', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Create, start, complete, and log actions.', risk: 'Low' },
  { id: 'planning-engine', name: 'Planning Engine', category: 'Internal', status: 'Ready', permission: 'Allowed', capability: 'Build daily, weekly, and project plans.', risk: 'Low' },
  { id: 'web-research', name: 'Web Research', category: 'External', status: 'Needs setup', permission: 'Ask first', capability: 'Research current public information.', risk: 'Medium' },
  { id: 'calendar', name: 'Calendar', category: 'External', status: 'Needs setup', permission: 'Ask first', capability: 'Read or create scheduled items once connected.', risk: 'Medium' },
  { id: 'email', name: 'Email', category: 'External', status: 'Locked', permission: 'Blocked', capability: 'Draft or inspect email only after explicit setup.', risk: 'High' },
  { id: 'files', name: 'Files', category: 'External', status: 'Needs setup', permission: 'Ask first', capability: 'Read uploaded documents when provided.', risk: 'Medium' },
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
