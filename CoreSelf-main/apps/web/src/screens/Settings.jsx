import { useRef, useState } from 'react';
import { defaultSettings } from '../data/defaults';
import { exportCoreData, importCoreData, load, save } from '../services/localStore';
import { logActivity } from '../services/activityLog';
import { pullCloudCoreToLocal, pushLocalCoreToCloud } from '../services/cloudStore';
import { currentCoreUser } from '../services/authService';
import { productionFirestoreRules, requireApproval } from '../services/securityCore';

export default function Settings() {
  const [settings, setSettings] = useState(load('settings', defaultSettings));
  const [syncStatus, setSyncStatus] = useState('Cloud sync ready.');
  const fileInput = useRef(null);
  const user = currentCoreUser();

  function update(key, value) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    save('settings', next);
    logActivity({ engine: 'Settings', action: 'Updated setting', detail: `${key}: ${value}` });
  }

  function exportData() {
    const data = exportCoreData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'core-self-backup-genesis-0.1.1.json';
    a.click();
    URL.revokeObjectURL(url);
    logActivity({ engine: 'Backup', action: 'Exported Core data', detail: 'Local JSON backup created.' });
  }

  async function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    importCoreData(data);
    logActivity({ engine: 'Backup', action: 'Imported Core data', detail: file.name, level: 'Warning' });
    window.location.reload();
  }

  async function pushCloud() {
    const approval = await requireApproval({ action: 'Push local Core data to Firebase', detail: 'This writes this device memory, projects, goals, messages, settings, and audit log into your signed-in cloud account.', policy: 'cloudWrite' });
    if (!approval.ok) { setSyncStatus(approval.reason); return; }
    setSyncStatus('Pushing local Core data to Firebase...');
    const result = await pushLocalCoreToCloud(exportCoreData());
    setSyncStatus(result.ok ? `Cloud push complete. ${result.keys} Core stores synced.` : result.reason);
    logActivity({ engine: 'Cloud Brain', action: 'Pushed local data to cloud', detail: result.ok ? 'Success' : result.reason, level: result.ok ? 'Info' : 'Warning' });
  }

  async function pullCloud() {
    const approval = await requireApproval({ action: 'Pull Firebase Core data to this device', detail: 'This can replace this device local Core stores with cloud versions.', policy: 'cloudWrite' });
    if (!approval.ok) { setSyncStatus(approval.reason); return; }
    setSyncStatus('Pulling Firebase Core data into this device...');
    const result = await pullCloudCoreToLocal(load, save);
    setSyncStatus(result.ok ? 'Cloud pull complete. Reloading Core...' : result.reason);
    logActivity({ engine: 'Cloud Brain', action: 'Pulled cloud data to local', detail: result.ok ? 'Success' : result.reason, level: result.ok ? 'Info' : 'Warning' });
    if (result.ok) setTimeout(() => window.location.reload(), 600);
  }

  return (
    <section className="screen">
      <h2>Settings</h2>
      <p className="muted">Genesis 0.1.1 adds Security Core: user-scoped cloud paths, approval gates, blocked dangerous actions, audit logging, and production Firestore rules.</p>

      <div className="list">
        <article>
          <h3>Cloud Brain</h3>
          <p><strong>Signed in:</strong> {user?.email || 'Unknown'}</p>
          <p className="muted">{syncStatus}</p>
          <div className="buttonRow">
            <button className="primary" onClick={pushCloud}>Push This Device to Cloud</button>
            <button className="primary" onClick={pullCloud}>Pull Cloud to This Device</button>
          </div>
          <p className="muted">Cloud sync now runs through the Security Core approval gate and writes to your signed-in /users/uid scope.</p>
        </article>


        <article>
          <h3>Security Core</h3>
          <p><strong>Mode:</strong> User-scoped Firebase + approval gates</p>
          <p className="muted">External actions, purchases, destructive operations, and tool access remain blocked until you explicitly approve those systems in later builds.</p>
          <details>
            <summary>Show production Firestore rules</summary>
            <pre className="codeBlock">{productionFirestoreRules}</pre>
          </details>
        </article>

        <article>
          <h3>Authority Level</h3>
          <select value={settings.authorityLevel} onChange={(e) => update('authorityLevel', e.target.value)}>
            <option>Level 0 — Observe</option>
            <option>Level 1 — Suggest</option>
            <option>Level 2 — Prepare</option>
            <option>Level 3 — Trusted Actions</option>
            <option>Level 4 — Time-Critical Decisions</option>
            <option>Level 5 — Executive Authority</option>
          </select>
        </article>

        <article>
          <h3>AI Provider</h3>
          <select value={settings.aiProvider} onChange={(e) => update('aiProvider', e.target.value)}>
            <option>OpenAI via Vercel Route</option>
            <option>Local Genesis Placeholder</option>
            <option>Gemini — Prepared</option>
            <option>Claude — Prepared</option>
            <option>Kimi — Prepared</option>
            <option>Local Model — Future</option>
          </select>
        </article>

        <article>
          <h3>Memory Mode</h3>
          <select value={settings.memoryMode} onChange={(e) => update('memoryMode', e.target.value)}>
            <option>Firestore Cloud Brain</option>
            <option>Local only</option>
            <option>Encrypted Cloud — Future</option>
          </select>
        </article>

        <article>
          <h3>Backup / Restore</h3>
          <button className="primary" onClick={exportData}>Export Core Backup</button>
          <button className="primary" onClick={() => fileInput.current?.click()}>Import Core Backup</button>
          <input ref={fileInput} type="file" accept="application/json" onChange={importData} style={{ display: 'none' }} />
        </article>
      </div>
    </section>
  );
}
