import { load, save } from './localStore';
import { logActivity } from './activityLog';
import { retrieveRelevantMemories } from './memoryRetrieval';
import { buildCompressedMemoryIndex } from './memoryCompressionEngine';
import { buildKnowledgeGraph } from './knowledgeGraph';
import { buildPlanningBriefing } from './planningEngine';
import { buildOrchestratorPlan } from './orchestratorEngine';
import { buildResearchPlan } from './researchEngine';
import { buildCreatorPlan } from './creatorEngine';
import { buildDeveloperPlan } from './developerEngine';
import { buildClientProviderMap, summarizeProviderStatus } from './providerConnectionEngine';
import { defaultGoals, defaultProjects, defaultLifeGraphNodes } from '../data/defaults';

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

function inputText(input = {}) {
  if (typeof input === 'string') return input;
  return String(input.query || input.input || input.text || input.prompt || input.detail || '');
}

function localContext() {
  return {
    memories: load('memories', []),
    projects: load('projects', defaultProjects),
    goals: load('goals', defaultGoals),
    plans: load('plans', []),
    lifeGraphNodes: load('lifeGraphNodes', defaultLifeGraphNodes),
    suggestions: load('memorySuggestions', []),
    activityLog: load('activityLog', []),
    messages: load('messages', []),
    queue: load('actionQueue', []),
  };
}

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
    mode: runnable.length >= 12 ? 'Internal runtime active' : 'Runtime guarded',
    summary: `${runnable.length} safe internal tool(s) can run now. ${blocked.length} tool(s) are gated by setup, approval, or external-server requirements.`,
    runnableTools: runnable.map((item) => item.tool).slice(0, 20),
    blockedTools: blocked.map((item) => ({ id: item.tool.id, name: item.tool.name, gate: item.result.gate, reason: item.result.reason })).slice(0, 20),
  };
}

function executeInternal(tool = {}, input = {}) {
  const context = localContext();
  const text = inputText(input);

  switch (tool.id) {
    case 'memory-recall': {
      const matches = retrieveRelevantMemories(text, context.memories, 10);
      return {
        summary: text ? `${matches.length} relevant memory match(es) for “${text.slice(0, 80)}”.` : `${matches.length} high-priority memory anchor(s) loaded.`,
        payload: matches,
      };
    }

    case 'memory-compression': {
      const index = buildCompressedMemoryIndex(context);
      return { summary: index.summary, payload: index };
    }

    case 'knowledge-graph': {
      const graph = buildKnowledgeGraph(context);
      return { summary: graph.summary, payload: graph };
    }

    case 'planning-engine': {
      const briefing = buildPlanningBriefing(context);
      return {
        summary: briefing.topProject
          ? `Top project: ${briefing.topProject.project.name}. Next: ${briefing.topProject.project.nextAction}`
          : 'Planning briefing generated.',
        payload: briefing,
      };
    }

    case 'ai-orchestrator': {
      const plan = buildOrchestratorPlan({ input: text, mode: input.mode || 'Talk', tools: input.tools || [], deepThink: Boolean(input.deepThink) });
      return { summary: `${plan.label}: ${plan.completionRule}`, payload: plan };
    }

    case 'research-comparator': {
      const plan = buildResearchPlan({ input: text });
      return { summary: `${plan.fitLabel} (${plan.fitScore}/10). ${plan.flags?.[0] || 'No initial caution flag.'}`, payload: plan };
    }

    case 'creator-suite':
    case 'image-prompt-studio':
    case 'video-production-planner':
    case 'music-prompt-studio':
    case 'book-builder':
    case 'marketing-writer': {
      const plan = buildCreatorPlan({ input: text, projects: context.projects, goals: context.goals, memories: context.memories });
      return { summary: plan.isCreatorRequest ? `${plan.primaryLabel}: ${plan.currentExecutionMode}` : 'Creator plan generated; no specific creator lane detected.', payload: plan };
    }

    case 'developer-build-assistant':
    case 'bug-triage':
    case 'release-command-helper':
    case 'replacement-file-workflow': {
      const plan = buildDeveloperPlan({ input: text, projects: context.projects, memories: context.memories });
      return { summary: plan.isDeveloperRequest ? `${plan.requestType}: ${plan.project}` : 'Developer workflow prepared.', payload: plan };
    }

    case 'business-builder': {
      const planning = buildPlanningBriefing(context);
      const businessProjects = context.projects.filter((project) => /business|wealth|income|sales|lifeline|corrwealth/i.test(`${project.name} ${project.purpose} ${project.engine}`));
      return {
        summary: businessProjects.length
          ? `${businessProjects.length} business/income project(s) detected. Strongest general move: ${planning.topPlan?.todayAction || planning.topProject?.project?.nextAction || 'define a concrete revenue action'}.`
          : 'Business context assembled from goals, projects and memory.',
        payload: { businessProjects, planning },
      };
    }

    case 'provider-status-map': {
      const providers = buildClientProviderMap();
      const summary = summarizeProviderStatus(providers);
      return { summary: `${summary.mode}: ${summary.connected}/${summary.total} provider group(s) mapped.`, payload: { providers, summary } };
    }

    case 'action-queue': {
      if (input.action && typeof input.action === 'object') {
        const action = {
          ...input.action,
          id: input.action.id || crypto.randomUUID(),
          status: input.action.status || 'Queued',
          createdAt: input.action.createdAt || new Date().toISOString(),
          source: input.action.source || 'Tool Runtime',
        };
        save('actionQueue', [action, ...context.queue]);
        return { summary: `Queued: ${action.title || action.type || 'Action'}.`, payload: action };
      }
      return {
        summary: `${context.queue.filter((item) => item.status !== 'Done').length} open action(s) in the queue.`,
        payload: context.queue,
      };
    }

    default:
      return {
        summary: `${tool.name || tool.id} passed the internal safety gate, but no dedicated deterministic handler exists yet.`,
        payload: { input },
        partial: true,
      };
  }
}

export function executeToolRuntime(tool = {}, input = {}) {
  const gate = canRunTool(tool);
  const now = new Date().toISOString();

  let internalResult = null;
  let executionError = null;
  if (gate.ok) {
    try {
      internalResult = executeInternal(tool, input);
    } catch (error) {
      executionError = error instanceof Error ? error.message : String(error);
    }
  }

  const trulyCompleted = gate.ok && !executionError && !internalResult?.partial;
  const status = !gate.ok ? 'Blocked' : executionError ? 'Failed' : trulyCompleted ? 'Completed' : 'Prepared';

  const execution = {
    id: crypto.randomUUID(),
    toolId: tool.id,
    toolName: tool.name || tool.id,
    status,
    gate: gate.gate,
    requestedAt: now,
    finishedAt: new Date().toISOString(),
    input,
    result: !gate.ok
      ? gate.reason
      : executionError
        ? executionError
        : internalResult?.summary || 'Internal execution completed.',
    payload: internalResult?.payload ?? null,
    deterministic: true,
    externalWritePerformed: false,
  };

  const history = load('toolExecutionLog', []);
  save('toolExecutionLog', [execution, ...history].slice(0, 200));
  logActivity({
    engine: 'Tool Runtime',
    action: status === 'Completed' ? 'Executed internal tool' : status === 'Prepared' ? 'Prepared tool workflow' : 'Blocked/failed tool',
    detail: `${execution.toolName}: ${execution.status}`,
    level: status === 'Completed' ? 'Info' : 'Warning',
  });
  return execution;
}
