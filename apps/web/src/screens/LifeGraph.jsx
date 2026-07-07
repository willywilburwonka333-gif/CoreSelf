import { useState } from 'react';
import { defaultLifeGraphNodes } from '../data/defaults';
import { load, save } from '../services/localStore';

export default function LifeGraph() {
  const [nodes, setNodes] = useState(load('lifeGraphNodes', defaultLifeGraphNodes));
  const [form, setForm] = useState({ group: 'New', title: '', detail: '' });

  function persist(next) {
    setNodes(next);
    save('lifeGraphNodes', next);
  }

  function addNode() {
    if (!form.title.trim()) return;
    persist([{ id: crypto.randomUUID(), ...form }, ...nodes]);
    setForm({ group: 'New', title: '', detail: '' });
  }

  function updateNode(id, key, value) {
    persist(nodes.map((n) => n.id === id ? { ...n, [key]: value } : n));
  }

  function removeNode(id) {
    persist(nodes.filter((n) => n.id !== id));
  }

  return (
    <section className="screen">
      <h2>Life Graph</h2>
      <p className="muted">The editable living model of Dylan’s life.</p>

      <div className="formGrid">
        <input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="Group" />
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Node title" />
        <button className="primary inlinePrimary" onClick={addNode}>Add Node</button>
      </div>
      <textarea value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="Node detail..." />

      <div className="graph">
        {nodes.map((node) => (
          <article key={node.id}>
            <small>{node.group}</small>
            <input value={node.title} onChange={(e) => updateNode(node.id, 'title', e.target.value)} />
            <textarea value={node.detail} onChange={(e) => updateNode(node.id, 'detail', e.target.value)} />
            <button className="danger" onClick={() => removeNode(node.id)}>Remove Node</button>
          </article>
        ))}
      </div>
    </section>
  );
}
