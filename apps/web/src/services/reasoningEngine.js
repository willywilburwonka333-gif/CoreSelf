import { buildPlanningBriefing } from './planningEngine';
import { buildMemoryTimeline } from './livingMemoryEngine';

function textOf(value = '') {
  return String(value || '').trim();
}

function normalise(value = '') {
  return textOf(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function hasAny(text = '', terms = []) {
  const haystack = normalise(text);
  return terms.some((term) => haystack.includes(normalise(term)));
}

function priorityScore(value = '') {
  const priority = normalise(value);
  if (priority.includes('s') || priority.includes('prime') || priority.includes('critical')) return 100;
  if (priority.includes('a') || priority.includes('high')) return 85;
  if (priority.includes('b') || priority.includes('medium')) return 65;
  if (priority.includes('c') || priority.includes('low')) return 40;
  return 55;
}

function statusPenalty(value = '') {
  const status = normalise(value);
  if (status.includes('done') || status.includes('complete') || status.includes('archived')) return -40;
  if (status.includes('blocked') || status.includes('stalled')) return -10;
  if (status.includes('progress') || status.includes('active')) return 10;
  return 0;
}

function unique(list = []) {
  return [...new Set(list.filter(Boolean))];
}

function inferStrategicThemes({ memories = [], projects = [], goals = [] } = {}) {
  const text = [...memories, ...projects, ...goals]
    .map((item) => [item.title, item.name, item.content, item.purpose, item.target, item.nextAction, item.futureAction].join(' '))
    .join(' ');

  const themes = [];
  if (hasAny(text, ['app', 'build', 'launch', 'platform', 'deploy', 'project'])) themes.push('Build the platform');
  if (hasAny(text, ['memory', 'remember', 'recall', 'context'])) themes.push('Strengthen long-term memory');
  if (hasAny(text, ['business', 'funding', 'money', 'revenue', 'customer', 'launch'])) themes.push('Convert work into business value');
  if (hasAny(text, ['family', 'wife', 'children', 'home'])) themes.push('Protect family stability');
  if (hasAny(text, ['health', 'training', 'sleep', 'fitness', 'energy'])) themes.push('Protect body and energy');
  if (hasAny(text, ['content', 'song', 'video', 'tiktok', 'marketing'])) themes.push('Turn creation into attention');

  return themes.length ? themes.slice(0, 5) : ['Clarify mission', 'Build one useful feature', 'Save what matters'];
}

function buildProjectReason(project, goals = [], memories = []) {
  const projectText = normalise([project.name, project.title, project.purpose, project.nextAction, project.engine].join(' '));
  const linkedGoal = goals.find((goal) => normalise([goal.title, goal.target, goal.name].join(' ')).split(' ').some((term) => term.length > 3 && projectText.includes(term)));
  const linkedMemory = memories.find((memory) => normalise([memory.title, memory.content, memory.futureAction].join(' ')).split(' ').some((term) => term.length > 4 && projectText.includes(term)));
  const reasons = [];
  if (linkedGoal) reasons.push(`supports goal: ${linkedGoal.title || linkedGoal.name}`);
  if (linkedMemory) reasons.push(`matches memory: ${linkedMemory.title || 'saved context'}`);
  if (project.nextAction) reasons.push('has a concrete next action');
  if (!reasons.length) reasons.push('keeps the platform moving');
  return reasons.join(' • ');
}

export function buildReasoningSnapshot({ memories = [], projects = [], goals = [], plans = [], suggestions = [], activityLog = [], messages = [], queue = [], lifeGraphNodes = [] } = {}) {
  const planning = buildPlanningBriefing({ memories, projects, goals, lifeGraphNodes });
  const timeline = buildMemoryTimeline({ memories, messages, activityLog, suggestions }, 10);
  const activeQueue = queue.filter((item) => item.status !== 'Done');
  const themes = inferStrategicThemes({ memories, projects, goals });

  const rankedProjects = projects
    .filter((project) => normalise(project.status) !== 'archived')
    .map((project) => {
      const score = priorityScore(project.priority || project.tier) + statusPenalty(project.status) + (project.nextAction ? 12 : 0);
      return {
        id: project.id || project.name,
        title: project.name || project.title || 'Untitled project',
        score,
        nextStep: project.nextAction || 'Define the next concrete action.',
        why: buildProjectReason(project, goals, memories),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const horizon = [
    {
      period: 'Today',
      intent: rankedProjects[0]?.nextStep || planning.topPlan?.todayAction || 'Complete one concrete action.',
      proof: 'One visible action completed and logged.',
    },
    {
      period: 'This week',
      intent: rankedProjects[0]?.title ? `Push ${rankedProjects[0].title} forward enough that it is testable.` : 'Create a testable improvement.',
      proof: 'A build, decision, or working demo exists.',
    },
    {
      period: 'This month',
      intent: themes[0] ? `Compound the strongest theme: ${themes[0]}.` : 'Compound the strongest mission thread.',
      proof: 'A clear milestone, release, or measurable improvement exists.',
    },
  ];

  const risks = [];
  if (suggestions.some((item) => item.status === 'Pending')) risks.push('Pending memories can weaken recall until accepted or rejected.');
  if (activeQueue.length > 6) risks.push('Too many open actions can create noise. Clear or complete low-value items.');
  if (!rankedProjects.length) risks.push('No active project is clearly ranked. Dylan Core needs a stronger target.');
  if (!goals.length) risks.push('No goals are saved. Planning will stay shallow until goals are defined.');
  if (!risks.length) risks.push('Main risk is execution drift: keep logging decisions so the system can learn.');

  return {
    version: 'Genesis 0.7.4',
    themes,
    rankedProjects,
    horizon,
    risks,
    timeline,
    activeQueueCount: activeQueue.length,
    memoryDepth: memories.length,
    strongestMove: rankedProjects[0]?.nextStep || planning.topPlan?.todayAction || 'Choose and complete one high-value action.',
  };
}

export function detectMemoryContradictions(memories = []) {
  const pairs = [
    ['always', 'never'],
    ['single file', 'full zip'],
    ['manual deploy', 'auto deploy'],
    ['local test', 'deployed test'],
    ['cheap', 'premium'],
  ];

  const findings = [];
  pairs.forEach(([a, b]) => {
    const left = memories.find((memory) => hasAny([memory.title, memory.content, memory.futureAction].join(' '), [a]));
    const right = memories.find((memory) => hasAny([memory.title, memory.content, memory.futureAction].join(' '), [b]));
    if (left && right && left.id !== right.id) {
      findings.push({
        id: `conflict-${a}-${b}`,
        label: `${a} / ${b}`,
        detail: `Possible preference collision between “${left.title || a}” and “${right.title || b}”. Review before acting automatically.`,
      });
    }
  });

  return findings.slice(0, 5);
}
