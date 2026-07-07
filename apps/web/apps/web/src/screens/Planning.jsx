import { useMemo } from 'react';
import { load } from '../services/localStore';
import { defaultGoals, defaultProjects, defaultLifeGraphNodes } from '../data/defaults';
import { buildPlanningBriefing } from '../services/planningEngine';

export default function Planning() {
  const memories = load('memories', []);
  const projects = load('projects', defaultProjects);
  const goals = load('goals', defaultGoals);
  const lifeGraphNodes = load('lifeGraphNodes', defaultLifeGraphNodes);

  const briefing = useMemo(() => buildPlanningBriefing({ memories, projects, goals, lifeGraphNodes }), [memories, projects, goals, lifeGraphNodes]);

  return (
    <section className="screen">
      <h2>Planning Engine</h2>
      <p className="muted">Genesis planning turns goals, projects, and memories into a practical next-action stack.</p>

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
