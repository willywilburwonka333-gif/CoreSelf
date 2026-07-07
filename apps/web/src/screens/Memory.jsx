import { useMemo, useState } from 'react';
import { load, save } from '../services/localStore';
import { logActivity } from '../services/activityLog';
import { acceptSuggestion } from '../services/memorySuggestions';
import { buildRelationshipLinks, detectRelationshipTags } from '../services/relationshipEngine';
import { defaultProjects, defaultGoals, defaultLifeGraphNodes } from '../data/defaults';

const types = ['All', 'Dylan Memory', 'Project', 'Skill', 'Decision', 'Lesson', 'Preference', 'Goal', 'Warning'];
const levels = ['All', 'Permanent', 'Long-term', 'Active', 'Short-term', 'Archive'];
const importanceOptions = ['Low', 'Medium', 'High', 'Critical'];

export default function Memory() {
  const [items, setItems] = useState(load('memories', []));
  const [suggestions, setSuggestions] = useState(load('memorySuggestions', []));
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
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const links = useMemo(() => buildRelationshipLinks({
    memories: items,
    projects: load('projects', defaultProjects),
    goals: load('goals', defaultGoals),
    lifeGraphNodes: load('lifeGraphNodes', defaultLifeGraphNodes),
  }), [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((m) => {
      const matchesText = !q || [m.title, m.content, m.lesson, m.futureAction, m.relationshipTags?.join(' ')].join(' ').toLowerCase().includes(q);
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
    const body = [form.title, form.content, form.lesson, form.futureAction].join(' ');
    const memory = {
      id: crypto.randomUUID(),
      ...form,
      title: form.title.trim() || form.content.trim().slice(0, 50),
      relationshipTags: detectRelationshipTags(body),
      truthStatus: 'Confirmed by Dylan',
      createdAt: new Date().toISOString(),
    };
    const next = [memory, ...items];
    setItems(next);
    save('memories', next);
    logActivity({ engine: 'Memory Engine', action: 'Saved memory', detail: memory.title });
    setForm({ type: 'Dylan Memory', level: 'Active', importance: 'High', title: '', content: '', lesson: '', futureAction: '' });
  }

  function remove(id) {
    const next = items.filter((m) => m.id !== id);
    setItems(next);
    save('memories', next);
    logActivity({ engine: 'Memory Engine', action: 'Removed memory', detail: id, level: 'Warning' });
  }

  function startEdit(memory) {
    setEditingId(memory.id);
    setEditForm({
      type: memory.type || 'Dylan Memory',
      level: memory.level || 'Active',
      importance: memory.importance || 'High',
      title: memory.title || '',
      content: memory.content || '',
      lesson: memory.lesson || '',
      futureAction: memory.futureAction || '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  function setEditField(key, value) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function saveEdit(id) {
    if (!editForm) return;
    const body = [editForm.title, editForm.content, editForm.lesson, editForm.futureAction].join(' ');
    const next = items.map((item) => item.id === id ? {
      ...item,
      ...editForm,
      title: editForm.title.trim() || editForm.content.trim().slice(0, 50) || 'Untitled memory',
      relationshipTags: detectRelationshipTags(body),
      updatedAt: new Date().toISOString(),
    } : item);
    setItems(next);
    save('memories', next);
    logActivity({ engine: 'Memory Engine', action: 'Edited memory', detail: editForm.title || id });
    cancelEdit();
  }

  function archive(id) {
    const next = items.map((m) => m.id === id ? { ...m, level: 'Archive', status: 'Archived', archivedAt: new Date().toISOString() } : m);
    setItems(next);
    save('memories', next);
    logActivity({ engine: 'Memory Engine', action: 'Archived memory', detail: id, level: 'Warning' });
  }

  function accept(id) {
    const suggestion = suggestions.find((item) => item.id === id);
    if (!suggestion) return;
    const memory = acceptSuggestion(suggestion);
    const nextMemories = [memory, ...items];
    const nextSuggestions = suggestions.map((item) => item.id === id ? { ...item, status: 'Accepted', acceptedAt: new Date().toISOString() } : item);
    setItems(nextMemories);
    setSuggestions(nextSuggestions);
    save('memories', nextMemories);
    save('memorySuggestions', nextSuggestions);
    logActivity({ engine: 'Memory Suggestions', action: 'Accepted suggestion', detail: memory.title });
  }

  function reject(id) {
    const nextSuggestions = suggestions.map((item) => item.id === id ? { ...item, status: 'Rejected', rejectedAt: new Date().toISOString() } : item);
    setSuggestions(nextSuggestions);
    save('memorySuggestions', nextSuggestions);
    logActivity({ engine: 'Memory Suggestions', action: 'Rejected suggestion', detail: id, level: 'Warning' });
  }

  const pending = suggestions.filter((item) => item.status === 'Pending');

  return (
    <section className="screen">
      <h2>Memory Vault</h2>
      <p className="muted">Structured memories now connect to projects, goals, and Life Graph context.</p>

      {!!pending.length && (
        <div className="briefing">
          <h3>Core Suggestions</h3>
          <p>Dylan Core detected useful memory candidates from Talk. Accept the ones that matter.</p>
          <div className="list compactList">
            {pending.map((s) => (
              <article key={s.id}>
                <div className="cardTop">
                  <h3>{s.title}</h3>
                  <small>{s.type} • {s.importance}</small>
                </div>
                <p>{s.content}</p>
                {!!s.relationshipTags?.length && <p><strong>Links:</strong> {s.relationshipTags.join(', ')}</p>}
                <div className="buttonRow">
                  <button className="primary" onClick={() => accept(s.id)}>Accept Memory</button>
                  <button className="danger" onClick={() => reject(s.id)}>Reject</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

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

      <p className="muted">Showing {filtered.length} of {items.length} memories • {links.length} relationship link(s) detected.</p>

      <div className="list">
        {filtered.length ? filtered.map((m) => {
          const memoryLinks = links.filter((link) => link.fromId === m.id);
          return (
            <article key={m.id}>
              <div className="cardTop">
                <h3>{m.title}</h3>
                <small>{m.type} • {m.level} • {m.importance}</small>
              </div>
              <p>{m.content}</p>
              {m.lesson && <p><strong>Lesson:</strong> {m.lesson}</p>}
              {m.futureAction && <p><strong>Future Action:</strong> {m.futureAction}</p>}
              {!!m.relationshipTags?.length && <p><strong>Tags:</strong> {m.relationshipTags.join(', ')}</p>}
              {!!memoryLinks.length && <p><strong>Linked to:</strong> {memoryLinks.map((link) => `${link.toLabel} (${link.strength})`).join(', ')}</p>}
              {editingId === m.id && editForm ? (
                <div className="memoryEditPanel">
                  <div className="formGrid">
                    <select value={editForm.type} onChange={(e) => setEditField('type', e.target.value)}>
                      {types.filter((t) => t !== 'All').map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <select value={editForm.level} onChange={(e) => setEditField('level', e.target.value)}>
                      {levels.filter((l) => l !== 'All').map((l) => <option key={l}>{l}</option>)}
                    </select>
                    <select value={editForm.importance} onChange={(e) => setEditField('importance', e.target.value)}>
                      {importanceOptions.map((i) => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                  <input value={editForm.title} onChange={(e) => setEditField('title', e.target.value)} placeholder="Memory title..." />
                  <textarea value={editForm.content} onChange={(e) => setEditField('content', e.target.value)} placeholder="Memory content..." />
                  <input value={editForm.lesson} onChange={(e) => setEditField('lesson', e.target.value)} placeholder="Lesson learned..." />
                  <input value={editForm.futureAction} onChange={(e) => setEditField('futureAction', e.target.value)} placeholder="Future action..." />
                  <div className="miniActionButtons">
                    <button type="button" onClick={() => saveEdit(m.id)}>Save Edit</button>
                    <button type="button" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="miniActionButtons">
                  <button type="button" onClick={() => startEdit(m)}>Edit</button>
                  <button type="button" onClick={() => archive(m.id)}>Archive</button>
                  <button type="button" className="danger" onClick={() => remove(m.id)}>Remove</button>
                </div>
              )}
            </article>
          );
        }) : <p className="muted">No matching memories.</p>}
      </div>
    </section>
  );
}
