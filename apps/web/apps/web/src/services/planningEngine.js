import { scorePotential } from './decisionEngine';
import { summarizeRelationshipMap } from './relationshipEngine';

function priorityWeight(priority = '') {
  const p = String(priority).toLowerCase();
  if (p.includes('s') || p.includes('prime') || p.includes('permanent')) return 5;
  if (p.includes('a')) return 4;
  if (p.includes('b')) return 3;
  if (p.includes('new')) return 2;
  return 1;
}

export function createPlanFromGoal(goal, projects = []) {
  const matchingProjects = projects.filter((project) => {
    const haystack = [project.name, project.purpose, project.engine, project.nextAction].join(' ').toLowerCase();
    return String(goal.title || '').toLowerCase().split(/\W+/).some((term) => term.length > 3 && haystack.includes(term));
  });

  return {
    id: `plan-${goal.id}`,
    goalId: goal.id,
    title: goal.title,
    priority: goal.priority,
    status: goal.status,
    target: goal.target,
    linkedProjects: matchingProjects.map((project) => project.name),
    steps: [
      `Clarify the outcome: ${goal.target || 'Define what done looks like.'}`,
      matchingProjects[0]?.nextAction || 'Choose the highest-impact project connected to this goal.',
      'Do one small action today that Future Dylan would thank you for.',
      'Log the result into Memory so Core Self can learn from it.',
    ],
    todayAction: matchingProjects[0]?.nextAction || `Move ${goal.title} forward by one practical step.`,
    score: priorityWeight(goal.priority) * 10 + (matchingProjects.length * 8),
  };
}

export function buildPlanningBriefing({ memories = [], projects = [], goals = [], lifeGraphNodes = [] }) {
  const projectScores = projects.map((project) => ({ project, ...scorePotential(project) })).sort((a, b) => b.score - a.score);
  const plans = goals.map((goal) => createPlanFromGoal(goal, projects)).sort((a, b) => b.score - a.score);
  const relationshipMap = summarizeRelationshipMap({ memories, projects, goals, lifeGraphNodes });
  const topProject = projectScores[0];
  const topPlan = plans[0];

  return {
    topProject,
    topPlan,
    plans,
    relationshipMap,
    todayStack: [
      topProject ? `Project: ${topProject.project.name} — ${topProject.project.nextAction}` : 'Project: define one active project.',
      topPlan ? `Goal: ${topPlan.todayAction}` : 'Goal: define one target.',
      relationshipMap.linkCount ? `Memory: review ${relationshipMap.linkCount} relationship link(s).` : 'Memory: save one useful memory from today.',
    ],
  };
}
