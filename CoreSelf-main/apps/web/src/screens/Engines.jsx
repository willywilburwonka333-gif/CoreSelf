import { engineStatuses } from '../data/defaults';
import { firestoreStatus } from '../services/firestoreService';

export default function Engines() {
  return (
    <section className="screen">
      <h2>Engine Status</h2>
      <p className="muted">This shows which parts of Dylan Core are real, prepared, or still only designed.</p>

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
