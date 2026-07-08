import { useMemo } from 'react';
import { load } from '../services/localStore';
import { defaultGoals, defaultProjects, defaultLifeGraphNodes } from '../data/defaults';
import { buildPlanningBriefing } from '../services/planningEngine';
import { buildReasoningSnapshot, detectMemoryContradictions } from '../services/reasoningEngine';
import { buildAssistantBehaviourProfile } from '../services/assistantBehaviourEngine';

export default function Planning() {
  const memories = load('memories', []);
  const projects = load('projects', defaultProjects);
  const goals = load('goals', defaultGoals);
  const lifeGraphNodes = load('lifeGraphNodes', defaultLifeGraphNodes);
  const suggestions = load('memorySuggestions', []);
  const activityLog = load('activityLog', []);
  const messages = load('messages', []);
  const queue = load('actionQueue', []);

  const briefing = useMemo(() => buildPlanningBriefing({ memories, projects, goals, lifeGraphNodes }), [memories, projects, goals, lifeGraphNodes]);
  const reasoning = useMemo(() => buildReasoningSnapshot({ memories, projects, goals, suggestions, activityLog, messages, queue, lifeGraphNodes }), [memories, projects, goals, suggestions, activityLog, messages, queue, lifeGraphNodes]);
  const contradictions = useMemo(() => detectMemoryContradictions(memories), [memories]);
  const behaviour = useMemo(() => buildAssistantBehaviourProfile({ memories, projects, goals, suggestions, activityLog, messages, queue, lifeGraphNodes }), [memories, projects, goals, suggestions, activityLog, messages, queue, lifeGraphNodes]);

  return (
    <section className="screen">
      <h2>Planning Engine</h2>
      <p className="muted">Genesis planning now combines goals, projects, memories, queue state, risk checks, and the Companion Loop behaviour profile.</p>


      <div className="briefing">
        <h3>Long-Term Reasoning Snapshot</h3>
        <p><strong>Strongest Move:</strong> {reasoning.strongestMove}</p>
        <p><strong>Strategic Themes:</strong> {reasoning.themes.join(' • ')}</p>
        <div className="list compactReasoningList">
          {reasoning.horizon.map((item) => (
            <article key={item.period}>
              <div className="cardTop"><h3>{item.period}</h3><small>{item.proof}</small></div>
              <p>{item.intent}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="briefing">
        <h3>Decision Rationale</h3>
        {reasoning.rankedProjects.length ? reasoning.rankedProjects.map((project) => (
          <div className="miniActionCard" key={project.id}>
            <div className="itemTopline"><strong>{project.title}</strong><small>{project.score}/112</small></div>
            <p><strong>Why:</strong> {project.why}</p>
            <p><strong>Next:</strong> {project.nextStep}</p>
          </div>
        )) : <p className="muted">No ranked projects yet.</p>}
      </div>


      <div className="briefing">
        <h3>Companion Loop Planning Rules</h3>
        <p><strong>{behaviour.mode}</strong> — Behaviour score: {behaviour.completionScore}%</p>
        {behaviour.nextResponseRules.map((rule) => (
          <div className="miniActionCard" key={rule}>
            <strong>Rule</strong>
            <p>{rule}</p>
          </div>
        ))}
      </div>

      <div className="briefing">
        <h3>Risk / Contradiction Check</h3>
        <ul>
          {reasoning.risks.map((risk) => <li key={risk}>{risk}</li>)}
          {contradictions.length ? contradictions.map((item) => <li key={item.id}><strong>{item.label}:</strong> {item.detail}</li>) : <li>No obvious contradictions detected.</li>}
        </ul>
      </div>

      <div className="briefing">
        <h3>Today&apos;s Stack</h3>
        <ul>
          {briefing.todayStack.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      {briefing.topProject && (
        <div className="briefing">
          <h3>Highest Impact Project</h3>
          <p><strong>{briefing.topProject.project.name}</strong> — {briefing.topProject.project.nextAction}</p>
          <small>{briefing.topProject.score}/100 • {briefing.topProject.tier} • {briefing.topProject.label}</small>
        </div>
      )}

      <div className="list">
        {briefing.plans.map((plan) => (
          <article key={plan.id}>
            <div className="cardTop">
              <h3>{plan.title}</h3>
              <small>{plan.priority} • {plan.status}</small>
            </div>
            <p><strong>Target:</strong> {plan.target}</p>
            <p><strong>Today:</strong> {plan.todayAction}</p>
            {!!plan.linkedProjects.length && <p><strong>Linked Projects:</strong> {plan.linkedProjects.join(', ')}</p>}
            <ol>
              {plan.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
