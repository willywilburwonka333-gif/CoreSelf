import { useMemo, useState } from 'react';
import { load, save } from '../services/localStore';

const types = ['All', 'Dylan Memory', 'Project', 'Skill', 'Decision', 'Lesson', 'Preference', 'Goal', 'Warning'];
const levels = ['All', 'Permanent', 'Long-term', 'Active', 'Short-term', 'Archive'];
const importanceOptions = ['Low', 'Medium', 'High', 'Critical'];

export default function Memory() {
  const [items, setItems] = useState(load('memories', []));
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [form, setForm] = useState({
    type: 'Dylan Memory',
    level: 'Active',
    importance: 'High',
    title: '',
    content: '',
    lesson: '',
    futureAction: ''
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((m) => {
      const matchesText = !q || [m.title, m.content, m.lesson, m.futureAction].join(' ').toLowerCase().includes(q);
      const matchesType = filterType === 'All' || m.type === filterType;
      const matchesLevel = filterLevel === 'All' || m.level === filterLevel;
      return matchesText && matchesType && matchesLevel;
    });
  }, [items, query, filterType, filterLevel]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function add() {
    if (!form.content.trim() && !form.title.trim()) return;
    const memory = {
      id: crypto.randomUUID(),
      ...form,
      title: form.title.trim() || form.content.trim().slice(0, 50),
      truthStatus: 'Confirmed by Dylan',
      createdAt: new Date().toISOString(),
    };
    const next = [memory, ...items];
    setItems(next);
    save('memories', next);
    setForm({ type: 'Dylan Memory', level: 'Active', importance: 'High', title: '', content: '', lesson: '', futureAction: '' });
  }

  function remove(id) {
    const next = items.filter((m) => m.id !== id);
    setItems(next);
    save('memories', next);
  }

  return (
    <section className="screen">
      <h2>Memory Vault</h2>
      <p className="muted">Structured memories become the foundation of Dylan Core.</p>

      <div className="formGrid">
        <select value={form.type} onChange={(e) => setField('type', e.target.value)}>
          {types.filter((t) => t !== 'All').map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={form.level} onChange={(e) => setField('level', e.target.value)}>
          {levels.filter((l) => l !== 'All').map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={form.importance} onChange={(e) => setField('importance', e.target.value)}>
          {importanceOptions.map((i) => <option key={i}>{i}</option>)}
        </select>
      </div>

      <input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Memory title..." />
      <textarea value={form.content} onChange={(e) => setField('content', e.target.value)} placeholder="What should Dylan Core remember?" />
      <input value={form.lesson} onChange={(e) => setField('lesson', e.target.value)} placeholder="Lesson learned..." />
      <input value={form.futureAction} onChange={(e) => setField('futureAction', e.target.value)} placeholder="Future action..." />

      <button className="primary" onClick={add}>Save Memory</button>

      <div className="filterPanel">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search memories..." />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          {types.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
          {levels.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      <p className="muted">Showing {filtered.length} of {items.length} memories.</p>

      <div className="list">
        {filtered.length ? filtered.map((m) => (
          <article key={m.id}>
            <div className="cardTop">
              <h3>{m.title}</h3>
              <small>{m.type} • {m.level} • {m.importance}</small>
            </div>
            <p>{m.content}</p>
            {m.lesson && <p><strong>Lesson:</strong> {m.lesson}</p>}
            {m.futureAction && <p><strong>Future Action:</strong> {m.futureAction}</p>}
            <button className="danger" onClick={() => remove(m.id)}>Archive / Remove</button>
          </article>
        )) : <p className="muted">No matching memories.</p>}
      </div>
    </section>
  );
}
