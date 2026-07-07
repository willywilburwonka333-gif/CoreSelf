import { useState } from 'react';
import { load, save } from '../services/localStore';

export default function Memory() {
  const [items, setItems] = useState(load('memories', []));
  const [text, setText] = useState('');

  function add() {
    const clean = text.trim();
    if (!clean) return;
    const memory = {
      id: crypto.randomUUID(),
      title: clean.slice(0, 50),
      content: clean,
      level: 'Active',
      truth: 'Confirmed by Dylan',
      createdAt: new Date().toISOString(),
    };
    const next = [memory, ...items];
    setItems(next);
    save('memories', next);
    setText('');
  }

  return (
    <section className="screen">
      <h2>Memory Vault</h2>
      <p className="muted">Save what Dylan Core should learn.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Save a rule, lesson, memory, goal, preference..." />
      <button className="primary" onClick={add}>Save Memory</button>
      <div className="list">
        {items.length ? items.map((m) => (
          <article key={m.id}>
            <h3>{m.title}</h3>
            <p>{m.content}</p>
            <small>{m.level} • {m.truth}</small>
          </article>
        )) : <p className="muted">No memories yet.</p>}
      </div>
    </section>
  );
}
