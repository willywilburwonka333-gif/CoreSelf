import { useState } from 'react';
import { load, save } from '../services/localStore';
import { defaultGoals } from '../data/defaults';
import { logActivity } from '../services/activityLog';

export default function Goals() {
  const [goals, setGoals] = useState(load('goals', defaultGoals));
  const [title, setTitle] = useState('');

  function persist(next) {
    setGoals(next);
    save('goals', next);
  }

  function addGoal() {
    const clean = title.trim();
    if (!clean) return;
    const goal = {
      id: crypto.randomUUID(),
      category: 'General',
      title: clean,
      priority: 'New',
      status: 'Active',
      target: 'To define.'
    };
    persist([goal, ...goals]);
    logActivity({ engine: 'Goal Engine', action: 'Added goal', detail: clean });
    setTitle('');
  }

  function updateGoal(id, key, value) {
    persist(goals.map((g) => g.id === id ? { ...g, [key]: value } : g));
  }

  return (
    <section className="screen">
      <h2>Goals</h2>
      <p className="muted">Goals tell Dylan Core what Future Dylan would thank us for.</p>
      <div className="inputRow">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add goal..." />
        <button onClick={addGoal}>Add</button>
      </div>
      <div className="list">
        {goals.map((g) => (
          <article key={g.id}>
            <div className="formGrid">
              <input value={g.category} onChange={(e) => updateGoal(g.id, 'category', e.target.value)} />
              <input value={g.priority} onChange={(e) => updateGoal(g.id, 'priority', e.target.value)} />
              <input value={g.status} onChange={(e) => updateGoal(g.id, 'status', e.target.value)} />
            </div>
            <input value={g.title} onChange={(e) => updateGoal(g.id, 'title', e.target.value)} />
            <textarea value={g.target} onChange={(e) => updateGoal(g.id, 'target', e.target.value)} />
          </article>
        ))}
      </div>
    </section>
  );
}
