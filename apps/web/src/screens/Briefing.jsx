import { load } from '../services/localStore';
import { defaultProjects, defaultGoals, defaultLifeGraphNodes } from '../data/defaults';
import { buildPlanningBriefing } from '../services/planningEngine';
import { buildDailyReflection, buildMemoryTimeline } from '../services/livingMemoryEngine';
import { buildMorningPriorityStack } from '../services/proactiveEngine';
import { buildReasoningSnapshot, detectMemoryContradictions } from '../services/reasoningEngine';

export default function Briefing() {
  const memories = load('memories', []);
  const projects = load('projects', defaultProjects);
  const goals = load('goals', defaultGoals);
  const nodes = load('lifeGraphNodes', defaultLifeGraphNodes);
  const logs = load('activityLog', []);
  const suggestions = load('memorySuggestions', []);
  const messages = load('messages', []);
  const queue = load('actionQueue', []);
  const briefing = buildPlanningBriefing({ memories, projects, goals, lifeGraphNodes: nodes });
  const criticalMemories = memories.filter((m) => m.importance === 'Critical' || m.level === 'Permanent');
  const pendingSuggestions = suggestions.filter((item) => item.status === 'Pending');
  const reflection = buildDailyReflection({ memories, projects, goals, suggestions, activityLog: logs });
  const timeline = buildMemoryTimeline({ memories, messages, activityLog: logs, suggestions }, 6);
  const priorityStack = buildMorningPriorityStack({ memories, projects, goals, suggestions, activityLog: logs, messages, queue });
  const reasoning = buildReasoningSnapshot({ memories, projects, goals, suggestions, activityLog: logs, messages, queue, lifeGraphNodes: nodes });
  const contradictions = detectMemoryContradictions(memories);

  return (
    <section className="screen">
      <h2>Daily Briefing</h2>
      <div className="briefing">
        <h3>{reflection.greeting}</h3>
        <p>{reflection.summary}</p>
        <ul>
          <li><strong>Highest Impact:</strong> {briefing.topProject ? `${briefing.topProject.project.name} — ${briefing.topProject.project.nextAction}` : 'Build Memory + Life Graph.'}</li>
          <li><strong>Decision Score:</strong> {briefing.topProject ? `${briefing.topProject.score}/100 (${briefing.topProject.tier})` : 'Not enough data.'}</li>
          <li><strong>Best Opportunity:</strong> {briefing.topPlan ? briefing.topPlan.todayAction : reflection.recommendedAction}</li>
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



      <div className="briefing">
        <h3>Reasoning Layer</h3>
        <p><strong>Strongest Move:</strong> {reasoning.strongestMove}</p>
        <ul>
          {reasoning.horizon.map((item) => (
            <li key={item.period}><strong>{item.period}:</strong> {item.intent} <span className="muted">Proof: {item.proof}</span></li>
          ))}
        </ul>
      </div>

      <div className="briefing">
        <h3>Risk / Drift Check</h3>
        <ul>
          {reasoning.risks.map((risk) => <li key={risk}>{risk}</li>)}
          {contradictions.length ? contradictions.map((item) => <li key={item.id}><strong>{item.label}:</strong> {item.detail}</li>) : <li>No obvious memory contradictions detected.</li>}
        </ul>
      </div>

      <div className="briefing">
        <h3>Proactive Priority Stack</h3>
        {priorityStack.length ? priorityStack.map((item) => (
          <div className="miniActionCard" key={`${item.rank}-${item.title}`}>
            <strong>#{item.rank} {item.title}</strong>
            <p>{item.nextStep}</p>
            <small>{item.priority}</small>
          </div>
        )) : <p className="muted">No proactive priorities yet.</p>}
      </div>

      <div className="briefing">
        <h3>Living Memory Timeline</h3>
        {timeline.length ? timeline.map((event) => (
          <div className="miniActionCard" key={event.id}>
            <strong>{event.kind}: {event.title}</strong>
            <p>{event.detail}</p>
            <small>{event.importance} • {new Date(event.at).toLocaleString()}</small>
          </div>
        )) : <p className="muted">No timeline events yet.</p>}
      </div>
    </section>
  );
}
