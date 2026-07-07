import { load } from '../services/localStore';
import { defaultProjects, defaultGoals } from '../data/defaults';
import { getTopProject, scorePotential } from '../services/decisionEngine';

export default function Briefing() {
  const memories = load('memories', []);
  const projects = load('projects', defaultProjects);
  const goals = load('goals', defaultGoals);
  const nodes = load('lifeGraphNodes', []);
  const logs = load('activityLog', []);
  const topProject = getTopProject(projects);
  const topScore = topProject ? scorePotential(topProject) : null;
  const criticalMemories = memories.filter((m) => m.importance === 'Critical' || m.level === 'Permanent');

  return (
    <section className="screen">
      <h2>Daily Briefing</h2>
      <div className="briefing">
        <h3>Morning Dylan.</h3>
        <p>Dylan Core has reviewed your local Genesis data.</p>
        <ul>
          <li><strong>Highest Impact:</strong> {topProject ? `${topProject.name} — ${topProject.nextAction}` : 'Build Memory + Life Graph.'}</li>
          <li><strong>Decision Score:</strong> {topScore ? `${topScore.score}/100 (${topScore.tier})` : 'Not enough data.'}</li>
          <li><strong>Best Opportunity:</strong> Connect Memory, Life Graph, Projects, and Goals through the AI Router.</li>
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
