import { useState } from 'react';
import { constitution } from '../data/constitution';
import { load } from '../services/localStore';
import { logActivity } from '../services/activityLog';
import { advanceIdentityStage, ensureIdentityProfile, identityProgress, loadIdentitySuggestions, resolveIdentitySuggestion, saveIdentityProfile } from '../services/identityCore';
import { recordAudit } from '../services/securityCore';

export default function Core() {
  const [profile, setProfile] = useState(() => ensureIdentityProfile());
  const [suggestions, setSuggestions] = useState(() => loadIdentitySuggestions());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const progress = identityProgress(profile, load('memories', []).length);
  const pending = suggestions.filter((item) => item.status === 'Pending');

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateCommunication(field, value) {
    setDraft((current) => ({ ...current, communication: { ...current.communication, [field]: value } }));
  }

  function saveProfile() {
    const next = saveIdentityProfile(draft);
    setProfile(next);
    setDraft(next);
    setEditing(false);
    logActivity({ engine: 'Identity Core', action: 'Updated confirmed identity', detail: 'Dylan manually updated the Identity Core.' });
    recordAudit({ action: 'Updated confirmed identity', detail: 'Dylan manually edited the Identity Core.', policy: 'personalData', engine: 'Identity Core' });
  }

  function resolve(id, decision) {
    const result = resolveIdentitySuggestion(id, decision);
    setProfile(result.profile);
    setDraft(result.profile);
    setSuggestions(result.suggestions);
    logActivity({ engine: 'Identity Core', action: `${decision} identity learning`, detail: id, level: decision === 'Rejected' ? 'Warning' : 'Info' });
    recordAudit({ action: `${decision} identity learning`, detail: id, policy: 'personalData', engine: 'Identity Core', level: decision === 'Rejected' ? 'Warning' : 'Info' });
  }

  function advanceStage() {
    const next = advanceIdentityStage(profile);
    setProfile(next);
    setDraft(next);
    logActivity({ engine: 'Identity Core', action: 'Advanced development stage', detail: `${profile.development.stage} → ${next.development.stage}` });
    recordAudit({ action: 'Advanced identity development stage', detail: `${profile.development.stage} → ${next.development.stage}`, policy: 'personalData', engine: 'Identity Core' });
  }

  return (
    <section className="screen">
      <h2>Dylan Identity Core</h2>
      <p className="muted">The confirmed model of who Dylan is. Core Self may suggest learning, but only Dylan can confirm changes to identity.</p>

      <div className="briefing">
        <div className="itemTopline"><h3>{profile.development.stage} Stage</h3><strong>{progress.score}% identity foundation</strong></div>
        <p>{profile.purpose}</p>
        <p className="muted">{progress.confirmed} confirmed identity learning(s) • {progress.memoryCount} stored memories • Next evolution remains evidence-based.</p>
        {progress.eligibleToAdvance && <button type="button" onClick={advanceStage}>Advance to {progress.nextStage}</button>}
      </div>

      {!!pending.length && <div className="briefing">
        <h3>Identity Learnings Awaiting Dylan</h3>
        <p>These came from your words in Talk. They are not part of Dylan Core until you accept them.</p>
        {pending.map((item) => <div className="miniActionCard" key={item.id}>
          <div className="itemTopline"><strong>{item.category}</strong><small>{item.confidence}</small></div>
          <p>{item.content}</p>
          <div className="miniActionButtons">
            <button type="button" onClick={() => resolve(item.id, 'Accepted')}>Accept as Dylan</button>
            <button type="button" className="danger" onClick={() => resolve(item.id, 'Rejected')}>Reject</button>
          </div>
        </div>)}
      </div>}

      <article className="constitution">
        <div className="itemTopline"><h3>Confirmed Self</h3><button type="button" onClick={() => setEditing((value) => !value)}>{editing ? 'Cancel' : 'Edit Identity'}</button></div>
        {editing ? <>
          <label>Purpose</label>
          <textarea value={draft.purpose} onChange={(e) => updateDraft('purpose', e.target.value)} />
          <label>Prime directive</label>
          <textarea value={draft.primeDirective} onChange={(e) => updateDraft('primeDirective', e.target.value)} />
          <label>Voice</label>
          <textarea value={draft.communication.voice} onChange={(e) => updateCommunication('voice', e.target.value)} />
          <label>Preferred answers</label>
          <textarea value={draft.communication.preferredOutput} onChange={(e) => updateCommunication('preferredOutput', e.target.value)} />
          <button className="primary" type="button" onClick={saveProfile}>Save Confirmed Identity</button>
        </> : <>
          <p><strong>Purpose:</strong> {profile.purpose}</p>
          <p><strong>Prime directive:</strong> {profile.primeDirective}</p>
          <p><strong>Voice:</strong> {profile.communication.voice}</p>
          <p><strong>Preferred answers:</strong> {profile.communication.preferredOutput}</p>
        </>}
      </article>

      {[['Roles', profile.roles], ['Values', profile.values], ['Traits', profile.traits], ['Preferences', profile.preferences], ['Goals', profile.goals], ['Decision Rules', profile.decisionRules], ['Boundaries', profile.boundaries], ['Connected Projects', profile.projects]].map(([title, items]) => (
        <article className="constitution" key={title}>
          <h3>{title}</h3>
          <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      ))}

      <article className="constitution">
        <h3>Wilbur Wonka Music Core</h3>
        <p className="muted">Permanent built-in creative identity. Available online and offline without importing the private Seed Vault.</p>
        {Object.entries(profile.creativeProfile || {}).map(([section, items]) => (
          <details key={section}>
            <summary>{section.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())} ({Array.isArray(items) ? items.length : 0})</summary>
            {Array.isArray(items) && items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">No confirmed creative context in this section.</p>}
          </details>
        ))}
      </article>

      <article className="constitution">
        <h3>Private Dylan Seed Vault</h3>
        <p className="muted">Imported personal context. This is stored in your Core data, not required in the public source repository.</p>
        {Object.entries(profile.privateContext || {}).map(([section, items]) => (
          <details key={section}>
            <summary>{section.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())} ({Array.isArray(items) ? items.length : 0})</summary>
            {Array.isArray(items) && items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">No private context imported for this section.</p>}
          </details>
        ))}
      </article>

      <h2>Core Constitution</h2>
      <article className="constitution">
        <h3>{constitution.coreName}</h3>
        <p>{constitution.identity}</p>
        <h3>Prime Directive</h3>
        <p>{constitution.primeDirective}</p>
        <h3>Core Laws</h3>
        <ol>
          {constitution.laws.map((law) => <li key={law}>{law}</li>)}
        </ol>
      </article>
    </section>
  );
}
