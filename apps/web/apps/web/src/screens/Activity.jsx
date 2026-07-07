import { useState } from 'react';
import { clearActivityLog, getActivityLog } from '../services/activityLog';

export default function Activity() {
  const [logs, setLogs] = useState(getActivityLog());

  function clear() {
    clearActivityLog();
    setLogs([]);
  }

  return (
    <section className="screen">
      <h2>Activity Log</h2>
      <p className="muted">Dylan Core actions should be explainable. This is the start of the audit trail.</p>
      <button className="danger" onClick={clear}>Clear Local Log</button>
      <div className="list">
        {logs.length ? logs.map((log) => (
          <article key={log.id}>
            <div className="cardTop">
              <h3>{log.action}</h3>
              <small>{log.engine} • {log.level}</small>
            </div>
            <p>{log.detail}</p>
            <small>{new Date(log.time).toLocaleString()}</small>
          </article>
        )) : <p className="muted">No activity logged yet.</p>}
      </div>
    </section>
  );
}
