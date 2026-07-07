import { load } from '../services/localStore';
import { defaultProjects, defaultGoals, defaultLifeGraphNodes } from '../data/defaults';
import { buildPlanningBriefing } from '../services/planningEngine';

export default function Briefing() {
  const memories = load('memories', []);
  const projects = load('projects', defaultProjects);
  const goals = load('goals', defaultGoals);
  const nodes = load('lifeGraphNodes', defaultLifeGraphNodes);
  const logs = load('activityLog', []);
  const suggestions = load('memorySuggestions', []);
  const briefing = buildPlanningBriefing({ memories, projects, goals, lifeGraphNodes: nodes });
  const criticalMemories = memories.filter((m) => m.importance === 'Critical' || m.level === 'Permanent');
  const pendingSuggestions = suggestions.filter((item) => item.status === 'Pending');

  return (
    <section className="screen">
      <h2>Daily Briefing</h2>
      <div className="briefing">
        <h3>Morning Dylan.</h3>
        <p>Dylan Core has reviewed your local Genesis data, relationship map, and planning stack.</p>
        <ul>
          <li><strong>Highest Impact:</strong> {briefing.topProject ? `${briefing.topProject.project.name} — ${briefing.topProject.project.nextAction}` : 'Build Memory + Life Graph.'}</li>
          <li><strong>Decision Score:</strong> {briefing.topProject ? `${briefing.topProject.score}/100 (${briefing.topProject.tier})` : 'Not enough data.'}</li>
          <li><strong>Best Opportunity:</strong> {briefing.topPlan ? briefing.topPlan.todayAction : 'Add goals so Planning Engine can generate action.'}</li>
          <li><strong>Relationship Links:</strong> {briefing.relationshipMap.linkCount}</li>
          <li><strong>Pending Memory Suggestions:</strong> {pendingSuggestions.length}</li>
          <li><strong>Risk:</strong> Cloud/AI is prepared but not connected yet. Do not pretend it is live.</li>
          <li><strong>Memory Count:</strong> {memories.length}</li>
          <li><strong>Critical/Permanent Memories:</strong> {criticalMemories.length}</li>
          <li><strong>Tracked Projects:</strong> {projects.length}</li>
          <li><strong>Tracked Goals:</strong> {goals.length}</li>
          <li><strong>Life Graph Nodes:</strong> {nodes.length}</li>
          <li><strong>Activity Log Entries:</strong> {logs.length}</li>
        </ul>
      </div>
    </section>
  );
}
