import { useMemo, useState } from 'react';
import { Network, Orbit, Radar } from 'lucide-react';
import { defaultLifeGraphNodes, defaultProjects, defaultGoals } from '../data/defaults';
import { load, save } from '../services/localStore';
import { logActivity } from '../services/activityLog';
import { buildRelationshipLinks } from '../services/relationshipEngine';
import { buildDigitalTwin } from '../services/digitalTwinEngine';
import { ensureIdentityProfile } from '../services/identityCore';
import { loadExecutionOutcomes } from '../services/executionLearningEngine';

export default function LifeGraph() {
  const [nodes, setNodes] = useState(load('lifeGraphNodes', defaultLifeGraphNodes));
  const [form, setForm] = useState({ group: 'New', title: '', detail: '' });

  const memories = load('memories', []);
  const projects = load('projects', defaultProjects);
  const goals = load('goals', defaultGoals);
  const profile = ensureIdentityProfile();
  const outcomes = loadExecutionOutcomes();

  const relationshipLinks = useMemo(() => buildRelationshipLinks({
    memories, projects, goals, lifeGraphNodes: nodes,
  }), [memories, projects, goals, nodes]);

  const twin = useMemo(() => buildDigitalTwin({
    profile, memories, projects, goals, lifeGraphNodes: nodes, outcomes,
  }), [profile, memories, projects, goals, nodes, outcomes]);

  function persist(next) {
    setNodes(next);
    save('lifeGraphNodes', next);
  }

  function addNode() {
    if (!form.title.trim()) return;
    const node = { id: crypto.randomUUID(), ...form, createdAt: new Date().toISOString() };
    persist([node, ...nodes]);
    logActivity({ engine: 'Life Graph Engine', action: 'Added node', detail: node.title });
    setForm({ group: 'New', title: '', detail: '' });
  }

  function updateNode(id, key, value) {
    persist(nodes.map((n) => n.id === id ? { ...n, [key]: value, updatedAt: new Date().toISOString() } : n));
  }

  function removeNode(id) {
    persist(nodes.filter((n) => n.id !== id));
    logActivity({ engine: 'Life Graph Engine', action: 'Removed node', detail: id, level: 'Warning' });
  }

  return (
    <section className="screen">
      <div className="talkHeader">
        <div>
          <p className="eyebrow">DIGITAL TWIN / GENESIS 1.4</p>
          <h2>Life Graph</h2>
        </div>
      </div>
      <p className="muted">A connected model of Dylan’s people, work, money, projects, creative identity, goals and outcomes.</p>

      <div className="deckGrid lowerDeck">
        <article className="neuralPanel">
          <div className="panelHeading">
            <div><Orbit size={18} /><span>DIGITAL TWIN COVERAGE</span></div>
            <strong>{twin.coverage}%</strong>
          </div>
          <div className="systemFacts">
            <div><span>Private identity facts</span><strong>{twin.identityDepth}</strong></div>
            <div><span>Relationship links</span><strong>{twin.relationshipMap.linkCount}</strong></div>
            <div><span>Tracked domains</span><strong>{twin.domains.length}</strong></div>
            <div><span>Execution outcomes</span><strong>{twin.execution.total}</strong></div>
          </div>
        </article>

        <article className="neuralPanel">
          <div className="panelHeading">
            <div><Radar size={18} /><span>LOWEST COVERAGE</span></div>
            <strong>{twin.weakest?.score || 0}%</strong>
          </div>
          <div className="bottleneckCore">
            <span>NEXT TWIN LAYER TO DEEPEN</span>
            <h3>{twin.weakest?.label || 'Life context'}</h3>
            <p>More confirmed memories, goals, graph nodes and real outcomes in this domain will make future reasoning more accurate.</p>
          </div>
        </article>
      </div>

      <article className="neuralPanel cortexPanel">
        <div className="panelHeading">
          <div><Network size={18} /><span>LIFE DOMAIN MAP</span></div>
          <strong>evidence-weighted coverage</strong>
        </div>
        <div className="capabilityRows">
          {twin.domains.map((domain) => (
            <div className="capabilityRow" key={domain.id}>
              <div><span>{domain.label}</span><strong>{domain.score}% · {domain.evidence} signals</strong></div>
              <div className="neuralBar"><i style={{ width: `${domain.score}%` }} /></div>
            </div>
          ))}
        </div>
      </article>

      <div className="briefing">
        <h3>Relationship Cortex</h3>
        <p>{relationshipLinks.length} live memory-to-world link(s) are currently detected.</p>
        {twin.relationshipMap.strongestEntities.length ? (
          <div className="quickChips">
            {twin.relationshipMap.strongestEntities.map((entity) => (
              <button type="button" key={entity.label}>{entity.label} · {entity.count}</button>
            ))}
          </div>
        ) : <p className="muted">The graph will strengthen as confirmed memories connect to people, projects and goals.</p>}
      </div>

      <div className="formGrid">
        <input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="Domain / group" />
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Node title" />
        <button className="primary inlinePrimary" onClick={addNode}>Add Node</button>
      </div>
      <textarea value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="What does Dylan Core need to understand about this node?" />

      <div className="graph">
        {nodes.map((node) => {
          const links = relationshipLinks.filter((link) => link.toId === node.id);
          return (
            <article key={node.id}>
              <small>{node.group}</small>
              <input value={node.title} onChange={(e) => updateNode(node.id, 'title', e.target.value)} />
              <textarea value={node.detail} onChange={(e) => updateNode(node.id, 'detail', e.target.value)} />
              {!!links.length && (
                <div>
                  <p><strong>Connected memory:</strong> {links.length} link(s)</p>
                  {links.slice(0, 4).map((link) => (
                    <small key={link.id}>{link.fromLabel} · {link.strength} ({link.weight || 0})</small>
                  ))}
                </div>
              )}
              <button className="danger" onClick={() => removeNode(node.id)}>Remove Node</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
