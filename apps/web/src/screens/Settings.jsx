import { useRef, useState } from 'react';
import { defaultSettings } from '../data/defaults';
import { exportCoreData, importCoreData, load, save } from '../services/localStore';
import { logActivity } from '../services/activityLog';

export default function Settings() {
  const [settings, setSettings] = useState(load('settings', defaultSettings));
  const fileInput = useRef(null);

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
    a.download = 'core-self-backup-genesis-0.0.9.json';
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

  return (
    <section className="screen">
      <h2>Settings</h2>
      <p className="muted">Genesis 0.0.9 can use a real AI provider through the Vercel API route when OPENAI_API_KEY is configured. Local fallback remains active.</p>

      <div className="list">
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
            <option>Local Genesis Placeholder</option>
            <option>OpenAI — Prepared</option>
            <option>Gemini — Prepared</option>
            <option>Claude — Prepared</option>
            <option>Kimi — Prepared</option>
            <option>Local Model — Future</option>
          </select>
        </article>

        <article>
          <h3>Memory Mode</h3>
          <select value={settings.memoryMode} onChange={(e) => update('memoryMode', e.target.value)}>
            <option>Local only</option>
            <option>Firestore — Prepared</option>
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
