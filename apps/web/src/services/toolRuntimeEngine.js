import { load, save } from './localStore';
import { logActivity } from './activityLog';

const SAFE_INTERNAL_TOOLS = new Set([
  'memory-recall',
  'memory-compression',
  'knowledge-graph',
  'ai-orchestrator',
  'research-comparator',
  'action-queue',
  'planning-engine',
  'creator-suite',
  'image-prompt-studio',
  'video-production-planner',
  'music-prompt-studio',
  'book-builder',
  'marketing-writer',
  'business-builder',
  'developer-build-assistant',
  'bug-triage',
  'release-command-helper',
  'replacement-file-workflow',
  'provider-status-map',
]);

const EXTERNAL_WRITE_CATEGORIES = new Set(['Email', 'Calendar', 'External Write', 'Deployment']);

export function canRunTool(tool = {}) {
  const ready = tool.status === 'Ready';
  const allowed = tool.permission === 'Allowed';
  const internalSafe = SAFE_INTERNAL_TOOLS.has(tool.id) || tool.category === 'Internal' || tool.category === 'Creator' || tool.category === 'Developer';
  const externalWrite = EXTERNAL_WRITE_CATEGORIES.has(tool.category) || tool.risk === 'High';

  if (!ready) return { ok: false, reason: `${tool.name || tool.id} is not ready yet. Status: ${tool.status || 'Unknown'}.`, gate: 'setup_required' };
  if (!allowed) return { ok: false, reason: `${tool.name || tool.id} needs approval before use. Permission: ${tool.permission || 'Unknown'}.`, gate: 'approval_required' };
  if (externalWrite && !tool.serverRoute) return { ok: false, reason: `${tool.name || tool.id} is high-risk/external and needs a server route plus approval gate before execution.`, gate: 'server_route_required' };
  if (!internalSafe && !tool.serverRoute) return { ok: false, reason: `${tool.name || tool.id} is not a safe internal tool and needs provider setup first.`, gate: 'provider_setup_required' };
  return { ok: true, reason: `${tool.name || tool.id} can run as a safe internal/orchestrated action.`, gate: 'ready' };
}

export function buildRuntimeSnapshot(tools = []) {
  const gates = tools.map((tool) => ({ tool, result: canRunTool(tool) }));
  const runnable = gates.filter((item) => item.result.ok);
  const blocked = gates.filter((item) => !item.result.ok);
  const approval = blocked.filter((item) => item.result.gate === 'approval_required');
  const setup = blocked.filter((item) => item.result.gate !== 'approval_required');

  return {
    total: tools.length,
    runnable: runnable.length,
    blocked: blocked.length,
    approvalRequired: approval.length,
    setupRequired: setup.length,
    mode: runnable.length >= 12 ? 'Runtime foundation active' : 'Runtime guarded',
    summary: `${runnable.length} safe internal tool(s) can run now. ${blocked.length} tool(s) are gated by setup, approval, or external-server requirements.`,
    runnableTools: runnable.map((item) => item.tool).slice(0, 12),
    blockedTools: blocked.map((item) => ({ id: item.tool.id, name: item.tool.name, gate: item.result.gate, reason: item.result.reason })).slice(0, 12),
  };
}

export function executeToolRuntime(tool = {}, input = {}) {
  const gate = canRunTool(tool);
  const now = new Date().toISOString();
  const execution = {
    id: crypto.randomUUID(),
    toolId: tool.id,
    toolName: tool.name || tool.id,
    status: gate.ok ? 'Completed' : 'Blocked',
    gate: gate.gate,
    requestedAt: now,
    finishedAt: now,
    input,
    result: gate.ok
      ? `${tool.name || tool.id} executed as a safe internal runtime action. No external write was performed.`
      : gate.reason,
  };

  const history = load('toolExecutionLog', []);
  save('toolExecutionLog', [execution, ...history].slice(0, 100));
  logActivity({
    engine: 'Tool Runtime',
    action: gate.ok ? 'Executed safe internal tool' : 'Blocked unsafe/unready tool',
    detail: `${execution.toolName}: ${execution.status}`,
    level: gate.ok ? 'Info' : 'Warning',
  });
  return execution;
}
