import { useEffect, useMemo, useState } from 'react';
import { Cpu, Orbit, ShieldCheck } from 'lucide-react';
import { firestoreStatus } from '../services/firestoreService';
import { load } from '../services/localStore';
import { defaultGoals, defaultLifeGraphNodes, defaultProjects } from '../data/defaults';
import { ensureIdentityProfile } from '../services/identityCore';
import { loadToolRegistry } from '../services/toolRegistry';
import { loadExecutionOutcomes } from '../services/executionLearningEngine';
import { buildSecondSelfRuntime, runtimeScoreRows } from '../services/selfRuntimeEngine';

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

  const runtime = useMemo(() => buildSecondSelfRuntime({
    memories: load('memories', []),
    projects: load('projects', defaultProjects),
    goals: load('goals', defaultGoals),
    plans: load('plans', []),
    suggestions: load('memorySuggestions', []),
    activityLog: load('activityLog', []),
    messages: load('messages', []),
    queue: load('actionQueue', []),
    lifeGraphNodes: load('lifeGraphNodes', defaultLifeGraphNodes),
    identityProfile: ensureIdentityProfile(),
    tools: loadToolRegistry(),
    outcomes: loadExecutionOutcomes(),
  }), []);

  const rows = runtimeScoreRows(runtime);

  return (
    <section className="screen">
      <div className="talkHeader">
        <div>
          <p className="eyebrow">RUNTIME TELEMETRY / GENESIS 1.4</p>
          <h2>Engine Matrix</h2>
        </div>
      </div>
      <p className="muted">Live capability scores are calculated from the Core state on this device rather than hard-coded roadmap percentages.</p>

      <div className="deckGrid lowerDeck">
        <article className="neuralPanel">
          <div className="panelHeading">
            <div><Orbit size={18} /><span>SECOND-SELF RUNTIME</span></div>
            <strong>{runtime.scores.secondSelf}%</strong>
          </div>
          <div className="bottleneckCore">
            <span>CURRENT STATE</span>
            <h3>{runtime.status}</h3>
            <p>{runtime.strongestMove}</p>
          </div>
        </article>

        <article className="neuralPanel">
          <div className="panelHeading">
            <div><ShieldCheck size={18} /><span>STABILITY GATE</span></div>
            <strong>{runtime.stability.score}%</strong>
          </div>
          <div className="systemFacts">
            <div><span>Executable tools</span><strong>{runtime.metrics.executableTools}</strong></div>
            <div><span>Graph links</span><strong>{runtime.metrics.graphLinks}</strong></div>
            <div><span>Open actions</span><strong>{runtime.metrics.openActions}</strong></div>
            <div><span>Pending learnings</span><strong>{runtime.metrics.pendingLearnings}</strong></div>
          </div>
        </article>
      </div>

      <div className={`briefing aiStatusPanel ${aiStatus.ok ? 'connected' : 'fallback'}`}>
        <h3>Production AI Backend</h3>
        <p>{aiStatus.message}</p>
        <small>Provider: {aiStatus.provider} • Model: {aiStatus.model} • Runtime: {aiStatus.version || 'Genesis 1.4'}</small>
        {!aiStatus.ok && <p className="muted"><strong>Next:</strong> {aiStatus.nextAction}</p>}
      </div>

      <div className="briefing">
        <h3>Cloud Readiness</h3>
        <p>{firestoreStatus.message}</p>
        <small>Firestore Connected: {String(firestoreStatus.connected)} • Auth Ready: {String(firestoreStatus.authReady)}</small>
      </div>

      <article className="neuralPanel">
        <div className="panelHeading">
          <div><Cpu size={18} /><span>LIVE CAPABILITY MATRIX</span></div>
          <strong>evidence-based</strong>
        </div>
        <div className="capabilityRows">
          {rows.map(([label, score]) => (
            <div className="capabilityRow" key={label}>
              <div><span>{label}</span><strong>{score}%</strong></div>
              <div className="neuralBar"><i style={{ width: `${score}%` }} /></div>
            </div>
          ))}
        </div>
      </article>

      <div className="briefing">
        <h3>Evolution Target</h3>
        <p><strong>{runtime.weakest.label} — {runtime.weakest.score}%</strong></p>
        <p>{runtime.weakest.next}</p>
      </div>
    </section>
  );
}
