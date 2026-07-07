import { buildTodayContext, buildMemoryTimeline } from './livingMemoryEngine';
import { buildPlanningBriefing } from './planningEngine';

function normalise(text = '') {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function existingActionKeys(queue = []) {
  return new Set(queue.map((item) => normalise([item.title, item.detail, item.nextStep].join(' '))).filter(Boolean));
}

function makeAction({ type = 'Task', title, detail, nextStep, source = 'Proactive Engine', priority = 'Medium', confidence = 70 }) {
  return {
    id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    detail,
    nextStep,
    source,
    priority,
    confidence,
    status: 'Queued',
    createdAt: new Date().toISOString(),
    proactive: true,
  };
}

function addUnique(actions, action, seen) {
  const key = normalise([action.title, action.detail, action.nextStep].join(' '));
  if (!key || seen.has(key)) return actions;
  seen.add(key);
  actions.push(action);
  return actions;
}

export function buildProactiveSuggestions({ memories = [], projects = [], goals = [], plans = [], suggestions = [], activityLog = [], messages = [], queue = [] } = {}) {
  const today = buildTodayContext({ memories, projects, goals, plans, suggestions, activityLog });
  const planning = buildPlanningBriefing({ memories, projects, goals, lifeGraphNodes: [] });
  const timeline = buildMemoryTimeline({ memories, messages, activityLog, suggestions }, 8);
  const seen = existingActionKeys(queue);
  const actions = [];

  if (planning.topProject?.project?.nextAction) {
    addUnique(actions, makeAction({
      type: 'Project',
      title: `Move ${planning.topProject.project.name} forward`,
      detail: `Highest scoring active project. Current next action: ${planning.topProject.project.nextAction}`,
      nextStep: planning.topProject.project.nextAction,
      priority: planning.topProject.tier || 'High',
      confidence: Math.min(98, 70 + Math.round(planning.topProject.score / 4)),
    }), seen);
  }

  if (planning.topPlan?.todayAction) {
    addUnique(actions, makeAction({
      type: 'Goal',
      title: `Continue goal: ${planning.topPlan.title}`,
      detail: `This goal is still active and connected to Dylan's long-term direction: ${planning.topPlan.target || 'No target set yet.'}`,
      nextStep: planning.topPlan.todayAction,
      priority: planning.topPlan.priority || 'High',
      confidence: 84,
    }), seen);
  }

  if (today.pendingSuggestionCount > 0) {
    addUnique(actions, makeAction({
      type: 'Memory',
      title: 'Review pending memory suggestions',
      detail: `${today.pendingSuggestionCount} possible memor${today.pendingSuggestionCount === 1 ? 'y is' : 'ies are'} waiting for approval. Confirming them improves recall and future context.`,
      nextStep: 'Open Memory Vault and accept or reject the pending suggestions.',
      priority: 'High',
      confidence: 90,
    }), seen);
  }

  const recentUnfinished = timeline.find((event) => {
    const text = normalise([event.title, event.detail].join(' '));
    return ['next', 'fix', 'continue', 'finish', 'deploy', 'test', 'build', 'roadmap'].some((term) => text.includes(term));
  });

  if (recentUnfinished) {
    addUnique(actions, makeAction({
      type: 'Continuation',
      title: `Continue thread: ${recentUnfinished.title}`,
      detail: recentUnfinished.detail || 'A recent memory or activity looks unfinished.',
      nextStep: 'Open the related memory/activity, decide the next concrete move, then log the result.',
      priority: recentUnfinished.importance || 'Medium',
      confidence: 76,
    }), seen);
  }

  if (!queue.some((item) => item.status !== 'Done') && actions.length < 3) {
    addUnique(actions, makeAction({
      type: 'Daily Plan',
      title: 'Set today’s priority stack',
      detail: 'The Action Queue is empty. Dylan Core should start each day with one project move, one memory move, and one life move.',
      nextStep: 'Choose the single highest-value task for today and save it to the queue.',
      priority: 'Medium',
      confidence: 72,
    }), seen);
  }

  return actions.slice(0, 6);
}

export function buildMorningPriorityStack(context = {}) {
  const suggestions = buildProactiveSuggestions(context);
  return suggestions.slice(0, 3).map((item, index) => ({
    rank: index + 1,
    title: item.title,
    nextStep: item.nextStep,
    priority: item.priority,
  }));
}
