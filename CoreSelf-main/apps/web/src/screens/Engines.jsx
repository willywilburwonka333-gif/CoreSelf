import { useEffect, useState } from 'react';
import { engineStatuses } from '../data/defaults';
import { firestoreStatus } from '../services/firestoreService';

export default function Engines() {
  const [aiStatus, setAiStatus] = useState({ ok: false, message: 'Checking Production AI Backend...', provider: 'checking', model: 'checking' });

  useEffect(() => {
    let alive = true;
    fetch('/api/ai-status')
      .then((response) => response.json())
      .then((data) => { if (alive) setAiStatus(data); })
      .catch((error) => {
        if (alive) setAiStatus({ ok: false, message: `AI status check failed: ${error.message}`, provider: 'unknown', model: 'unknown' });
      });
    return () => { alive = false; };
  }, []);

  return (
    <section className="screen">
      <h2>Engine Status</h2>
      <p className="muted">This shows which parts of Dylan Core are real, prepared, or still only designed.</p>

      <div className={`briefing aiStatusPanel ${aiStatus.ok ? 'connected' : 'fallback'}`}>
        <h3>Production AI Backend</h3>
        <p>{aiStatus.message}</p>
        <small>Provider: {aiStatus.provider} • Model: {aiStatus.model} • Genesis {aiStatus.version || '0.2.0'}</small>
        {!aiStatus.ok && <p className="muted"><strong>Next:</strong> {aiStatus.nextAction}</p>}
      </div>

      <div className="briefing">
        <h3>Cloud Readiness</h3>
        <p>{firestoreStatus.message}</p>
        <small>Firestore Connected: {String(firestoreStatus.connected)} • Auth Ready: {String(firestoreStatus.authReady)}</small>
      </div>

      <div className="list">
        {engineStatuses.map((engine) => (
          <article key={engine.name}>
            <div className="cardTop">
              <h3>{engine.name}</h3>
              <small>{engine.status}</small>
            </div>
            <div className="bar"><i style={{ width: `${engine.progress}%` }} /></div>
            <p><strong>Next:</strong> {engine.next}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
