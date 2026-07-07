import { useMemo, useState } from 'react';
import { defaultLifeGraphNodes, defaultProjects, defaultGoals } from '../data/defaults';
import { load, save } from '../services/localStore';
import { logActivity } from '../services/activityLog';
import { buildRelationshipLinks } from '../services/relationshipEngine';

export default function LifeGraph() {
  const [nodes, setNodes] = useState(load('lifeGraphNodes', defaultLifeGraphNodes));
  const [form, setForm] = useState({ group: 'New', title: '', detail: '' });

  const relationshipLinks = useMemo(() => buildRelationshipLinks({
    memories: load('memories', []),
    projects: load('projects', defaultProjects),
    goals: load('goals', defaultGoals),
    lifeGraphNodes: nodes,
  }), [nodes]);

  function persist(next) {
    setNodes(next);
    save('lifeGraphNodes', next);
  }

  function addNode() {
    if (!form.title.trim()) return;
    const node = { id: crypto.randomUUID(), ...form };
    persist([node, ...nodes]);
    logActivity({ engine: 'Life Graph Engine', action: 'Added node', detail: node.title });
    setForm({ group: 'New', title: '', detail: '' });
  }

  function updateNode(id, key, value) {
    persist(nodes.map((n) => n.id === id ? { ...n, [key]: value } : n));
  }

  function removeNode(id) {
    persist(nodes.filter((n) => n.id !== id));
    logActivity({ engine: 'Life Graph Engine', action: 'Removed node', detail: id, level: 'Warning' });
  }

  return (
    <section className="screen">
      <h2>Life Graph</h2>
      <p className="muted">The editable living model of Dylan’s life. Relationship links now appear when memories connect to graph nodes.</p>

      <div className="briefing">
        <h3>Relationship Map</h3>
        <p>{relationshipLinks.length} live relationship link(s) detected between Memory and Dylan&apos;s world model.</p>
      </div>

      <div className="formGrid">
        <input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="Group" />
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Node title" />
        <button className="primary inlinePrimary" onClick={addNode}>Add Node</button>
      </div>
      <textarea value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="Node detail..." />

      <div className="graph">
        {nodes.map((node) => {
          const links = relationshipLinks.filter((link) => link.toId === node.id);
          return (
            <article key={node.id}>
              <small>{node.group}</small>
              <input value={node.title} onChange={(e) => updateNode(node.id, 'title', e.target.value)} />
              <textarea value={node.detail} onChange={(e) => updateNode(node.id, 'detail', e.target.value)} />
              {!!links.length && <p><strong>Memory Links:</strong> {links.map((link) => `${link.fromLabel} (${link.strength})`).join(', ')}</p>}
              <button className="danger" onClick={() => removeNode(node.id)}>Remove Node</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
