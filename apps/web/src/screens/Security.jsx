import { ShieldCheck, LockKeyhole, AlertTriangle } from 'lucide-react';
import { actionPolicies, getSecurityState, loadAuditLog, permissionCatalog, productionFirestoreRules } from '../services/securityCore';

export default function Security() {
  const state = getSecurityState();
  const auditLog = loadAuditLog();

  return (
    <section className="screen">
      <h2>Real AI Brain</h2>
      <p className="muted">Genesis 0.1.2 adds the first real safety layer: user-scoped data, permission gates, blocked dangerous actions, and an audit trail.</p>

      <div className="securityGrid">
        <article className="securityCard good">
          <ShieldCheck />
          <h3>Identity Lock</h3>
          <p><strong>Status:</strong> {state.signedIn ? 'Signed in' : 'Offline / not signed in'}</p>
          <p className="muted">{state.email || 'No active Firebase user detected.'}</p>
        </article>

        <article className="securityCard good">
          <LockKeyhole />
          <h3>Firestore Scope</h3>
          <p><strong>Path:</strong> {state.firestorePath}</p>
          <p className="muted">Each user must stay inside their own /users/&lbrace;uid&rbrace; branch.</p>
        </article>

        <article className="securityCard warn">
          <AlertTriangle />
          <h3>Approval Gates</h3>
          <p><strong>Cloud writes:</strong> Confirmed</p>
          <p><strong>External actions:</strong> Blocked until we build tool permissions.</p>
        </article>
      </div>

      <div className="list">
        <article>
          <h3>Permission Matrix</h3>
          <div className="permissionList">
            {permissionCatalog.map((permission) => (
              <div key={permission.id} className="permissionRow">
                <div>
                  <strong>{permission.name}</strong>
                  <p className="muted">{permission.description}</p>
                </div>
                <span className={`pill risk-${permission.risk.toLowerCase()}`}>{permission.risk}</span>
                <span className="pill">{permission.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article>
          <h3>Action Policy</h3>
          <div className="policyGrid">
            {Object.entries(actionPolicies).map(([id, policy]) => (
              <div key={id} className="policyBox">
                <strong>{policy.label}</strong>
                <small>{policy.allowed ? 'Allowed' : 'Blocked'}</small>
                <p className="muted">{policy.approval}</p>
              </div>
            ))}
          </div>
        </article>

        <article>
          <h3>Production Firestore Rules</h3>
          <p className="muted">Use these before public users. Test mode is okay for your private setup, but this is the lock-down version.</p>
          <pre className="codeBlock">{productionFirestoreRules}</pre>
        </article>

        <article>
          <h3>Audit Log</h3>
          {auditLog.length === 0 ? <p className="muted">No security actions logged yet.</p> : auditLog.slice(0, 12).map((entry) => (
            <div key={entry.id} className="auditRow">
              <strong>{entry.action}</strong>
              <span>{entry.level}</span>
              <p className="muted">{entry.detail || 'No detail'} • {new Date(entry.at).toLocaleString()}</p>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
