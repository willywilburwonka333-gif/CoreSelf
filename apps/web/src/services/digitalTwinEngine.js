import { summarizeRelationshipMap, detectRelationshipTags } from './relationshipEngine';
import { buildExecutionLearning } from './executionLearningEngine';

const DOMAIN_RULES = [
  { id: 'family', label: 'Family', terms: ['family','wife','jen','daughter','kayla','hazel','rubie','macie','home'] },
  { id: 'career', label: 'Career', terms: ['work','career','freedom pools','dogman','crane','business development','job'] },
  { id: 'wealth', label: 'Money + Wealth', terms: ['money','income','wealth','financial','rent','credit','business','revenue','sales'] },
  { id: 'core', label: 'Core Self', terms: ['core self','dylan core','identity','memory','second self','ai'] },
  { id: 'system', label: 'THE SYSTEM', terms: ['the system','fitness rpg','training','dungeon protocol','system go'] },
  { id: 'creative', label: 'Wilbur + Creative', terms: ['wilbur wonka','stay staunch','music','song','album','the empath','creative'] },
  { id: 'business', label: 'Businesses', terms: ['business lifeline','corrwealth','business','customer','agent','company'] },
  { id: 'health', label: 'Health + Energy', terms: ['health','adhd','anxiety','depression','sleep','fitness','energy','recovery'] },
  { id: 'research', label: 'Research', terms: ['reality project','hset','research','physics','math'] },
];

function textOf(item = {}) {
  return [item.title,item.name,item.content,item.detail,item.purpose,item.target,item.nextAction,item.lesson,item.futureAction]
    .filter(Boolean).join(' ').toLowerCase();
}

function countMatches(items = [], terms = []) {
  return items.reduce((sum, item) => {
    const text = textOf(item);
    return sum + (terms.some((term) => text.includes(term)) ? 1 : 0);
  }, 0);
}

function privateSectionCount(profile = {}, section) {
  const items = profile.privateContext?.[section];
  return Array.isArray(items) ? items.length : 0;
}

export function buildDigitalTwin({
  profile = {},
  memories = [],
  projects = [],
  goals = [],
  lifeGraphNodes = [],
  outcomes = [],
} = {}) {
  const relationshipMap = summarizeRelationshipMap({ memories, projects, goals, lifeGraphNodes });
  const execution = buildExecutionLearning(outcomes);

  const domains = DOMAIN_RULES.map((domain) => {
    const memorySignals = countMatches(memories, domain.terms);
    const projectSignals = countMatches(projects, domain.terms);
    const goalSignals = countMatches(goals, domain.terms);
    const graphSignals = countMatches(lifeGraphNodes, domain.terms);
    const outcomeSignals = countMatches(outcomes, domain.terms);
    const relationSignals = relationshipMap.links.filter((link) => domain.terms.some((term) =>
      `${link.fromLabel} ${link.toLabel} ${link.reason}`.toLowerCase().includes(term)
    )).length;

    const privateSignals =
      domain.id === 'family' ? privateSectionCount(profile, 'relationships') :
      domain.id === 'career' ? privateSectionCount(profile, 'workAndCareer') :
      domain.id === 'wealth' ? privateSectionCount(profile, 'financialReality') :
      domain.id === 'creative' ? privateSectionCount(profile, 'creativeIdentity') :
      domain.id === 'business' ? privateSectionCount(profile, 'projectsAndBusinesses') :
      domain.id === 'health' ? privateSectionCount(profile, 'healthAndNeurodivergence') :
      0;

    const evidence = memorySignals + projectSignals * 2 + goalSignals * 2 + graphSignals * 2 + outcomeSignals * 2 + relationSignals + Math.min(15, privateSignals);
    const score = Math.min(100, 18 + evidence * 4);

    return {
      ...domain,
      score,
      evidence,
      memorySignals,
      projectSignals,
      goalSignals,
      graphSignals,
      outcomeSignals,
      privateSignals,
    };
  }).sort((a, b) => b.score - a.score);

  const coverage = domains.length ? Math.round(domains.reduce((sum, item) => sum + item.score, 0) / domains.length) : 0;
  const weakest = [...domains].sort((a, b) => a.score - b.score)[0];

  return {
    version: 'Genesis 1.4',
    coverage,
    domains,
    weakest,
    relationshipMap,
    execution,
    identityDepth: Object.values(profile.privateContext || {}).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0),
    entityTags: [...new Set([
      ...memories.flatMap((item) => item.relationshipTags || detectRelationshipTags(textOf(item))),
      ...projects.flatMap((item) => detectRelationshipTags(textOf(item))),
      ...goals.flatMap((item) => detectRelationshipTags(textOf(item))),
    ])],
  };
}
