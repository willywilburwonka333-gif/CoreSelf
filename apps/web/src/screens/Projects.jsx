import { useState } from 'react';
import { load, save } from '../services/localStore';
import { defaultProjects } from '../data/defaults';
import { scorePotential } from '../services/decisionEngine';
import { logActivity } from '../services/activityLog';
import ScoreBadge from '../components/ScoreBadge';

const scoreFields = ['familyFreedom', 'wealth', 'health', 'intelligence', 'asset', 'effortReduction', 'riskProtection'];

export default function Projects() {
  const [projects, setProjects] = useState(load('projects', defaultProjects));
  const [name, setName] = useState('');

  function persist(next) {
    setProjects(next);
    save('projects', next);
  }

  function addProject() {
    const clean = name.trim();
    if (!clean) return;
    const project = {
      id: crypto.randomUUID(),
      name: clean,
      status: 'New',
      priority: 'Unscored',
      engine: 'To assign',
      purpose: 'To define',
      nextAction: 'Clarify purpose and value.',
      familyFreedom: 3,
      wealth: 3,
      health: 2,
      intelligence: 3,
      asset: 3,
      effortReduction: 2,
      riskProtection: 3
    };
    persist([project, ...projects]);
    logActivity({ engine: 'Project Engine', action: 'Added project', detail: clean });
    setName('');
  }

  function updateProject(id, key, value) {
    persist(projects.map((p) => p.id === id ? { ...p, [key]: scoreFields.includes(key) ? Number(value) : value } : p));
  }

  return (
    <section className="screen">
      <h2>Projects</h2>
      <p className="muted">Projects are assets Dylan Core helps organise, build, protect, or archive.</p>
      <div className="inputRow">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add project..." />
        <button onClick={addProject}>Add</button>
      </div>
      <div className="cards projectCards">
        {projects.map((p) => {
          const scored = scorePotential(p);
          return (
            <article key={p.id}>
              <div className="projectHeader">
                <div>
                  <span>{p.priority}</span>
                  <input value={p.name} onChange={(e) => updateProject(p.id, 'name', e.target.value)} />
                </div>
                <ScoreBadge {...scored} />
              </div>
              <textarea value={p.purpose} onChange={(e) => updateProject(p.id, 'purpose', e.target.value)} />
              <input value={p.nextAction} onChange={(e) => updateProject(p.id, 'nextAction', e.target.value)} placeholder="Next action" />
              <small>{p.status} • {p.engine}</small>
              <div className="miniScores">
                {scoreFields.map((field) => (
                  <label key={field}>
                    {field}
                    <input type="number" min="0" max="5" value={p[field] ?? 0} onChange={(e) => updateProject(p.id, field, e.target.value)} />
                  </label>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
