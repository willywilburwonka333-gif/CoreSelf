import { Activity, BrainCircuit, Database, GitBranch, Orbit, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import PresenceBanner from '../components/PresenceBanner';
import { load } from '../services/localStore';
import { defaultProjects, defaultGoals, defaultLifeGraphNodes } from '../data/defaults';
import { buildMorningPriorityStack } from '../services/proactiveEngine';
import { ensureIdentityProfile } from '../services/identityCore';
import { loadToolRegistry } from '../services/toolRegistry';
import { buildSecondSelfRuntime, runtimeScoreRows } from '../services/selfRuntimeEngine';
import { buildExecutionLearning, loadExecutionOutcomes } from '../services/executionLearningEngine';

function ScoreRing({ score }) {
  return (
    <div className="coreScoreRing" style={{ '--core-score': `${score * 3.6}deg` }}>
      <div className="coreScoreInner">
        <span>SECOND SELF</span>
        <strong>{score}%</strong>
        <small>runtime maturity</small>
      </div>
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="telemetryMetric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

export default function Home({ mode }) {
  const memories = load('memories', []);
  const projects = load('projects', defaultProjects);
  const goals = load('goals', defaultGoals);
  const plans = load('plans', []);
  const suggestions = load('memorySuggestions', []);
  const activityLog = load('activityLog', []);
  const messages = load('messages', []);
  const queue = load('actionQueue', []);
  const lifeGraphNodes = load('lifeGraphNodes', defaultLifeGraphNodes);
  const profile = ensureIdentityProfile();
  const tools = loadToolRegistry();
  const outcomes = loadExecutionOutcomes();

  const runtime = buildSecondSelfRuntime({
    memories, projects, goals, plans, suggestions, activityLog, messages, queue,
    lifeGraphNodes, identityProfile: profile, tools,
  });
  const learning = buildExecutionLearning(outcomes);
  const scores = runtimeScoreRows(runtime);
  const priorityStack = buildMorningPriorityStack({
    memories, projects, goals, plans, suggestions, activityLog, messages, queue,
  });

  return (
    <section className="screen commandDeck">
      <div className="commandHero">
        <div className="heroSignal">
          <div className="signalLine"><span /> <p>CORE SELF / GENESIS 1.4</p></div>
          <h1>Dylan <em>Core</em></h1>
          <p className="heroStatement">A persistent intelligence layer learning Dylan, connecting his world, and converting intent into controlled action.</p>

          <div className="heroStatusRail">
            <div><BrainCircuit size={16} /><span>{runtime.status}</span></div>
            <div><ShieldCheck size={16} /><span>{runtime.stability.status}</span></div>
            <div><Zap size={16} /><span>{runtime.metrics.toolRuntime} runtime tools</span></div>
          </div>

          <div className="missionStrip">
            <span>ACTIVE MISSION</span>
            <strong>{runtime.currentMission}</strong>
            <p>{runtime.strongestMove}</p>
          </div>
        </div>

        <div className="coreReactor" aria-label="Core Self runtime reactor">
          <div className="reactorGrid" />
          <div className="reactorOrbit orbitA"><i /></div>
          <div className="reactorOrbit orbitB"><i /></div>
          <div className="reactorOrbit orbitC"><i /></div>
          <div className="reactorGlow" />
          <ScoreRing score={runtime.scores.secondSelf} />
          <div className="reactorLabel"><Orbit size={14} /> DYLAN CORE ONLINE</div>
        </div>
      </div>

      <PresenceBanner mode={mode} />

      <div className="telemetryGrid">
        <Metric label="PRIVATE CONTEXT" value={runtime.metrics.privateFacts} hint="seed facts available" />
        <Metric label="MEMORY" value={runtime.metrics.confirmedMemories} hint="confirmed memories" />
        <Metric label="GRAPH" value={runtime.metrics.graphLinks} hint="live relationships" />
        <Metric label="ACTIONS" value={runtime.metrics.openActions} hint="open execution threads" />
        <Metric label="TOOLS" value={runtime.metrics.executableTools} hint="approved internal tools" />
        <Metric label="OUTCOMES" value={learning.total} hint={learning.maturity} />
      </div>

      <div className="deckGrid">
        <article className="neuralPanel capabilityPanel">
          <div className="panelHeading">
            <div><Activity size={18} /><span>CAPABILITY MATRIX</span></div>
            <strong>{runtime.scores.secondSelf}% integrated</strong>
          </div>
          <div className="capabilityRows">
            {scores.map(([label, score]) => (
              <div className="capabilityRow" key={label}>
                <div><span>{label}</span><strong>{score}%</strong></div>
                <div className="neuralBar"><i style={{ width: `${score}%` }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="neuralPanel loopPanel">
          <div className="panelHeading">
            <div><GitBranch size={18} /><span>SECOND-SELF LOOP</span></div>
            <strong>continuous architecture</strong>
          </div>
          <div className="runtimeLoop">
            {runtime.loop.map((stage, index) => (
              <div className="loopNode" key={stage.id}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <div>
                  <span>{stage.label}</span>
                  <small>{stage.state}</small>
                  <p>{stage.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="deckGrid lowerDeck">
        <article className="neuralPanel priorityPanel">
          <div className="panelHeading">
            <div><Sparkles size={18} /><span>PRIORITY INTELLIGENCE</span></div>
            <strong>next best moves</strong>
          </div>
          <div className="priorityStack">
            {priorityStack.length ? priorityStack.map((item) => (
              <div className="priorityNode" key={item.rank}>
                <b>0{item.rank}</b>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.nextStep}</p>
                  <small>{item.priority}</small>
                </div>
              </div>
            )) : <p className="muted">Add goals, projects or actions to generate the live priority stack.</p>}
          </div>
        </article>

        <article className="neuralPanel bottleneckPanel">
          <div className="panelHeading">
            <div><Database size={18} /><span>EVOLUTION TARGET</span></div>
            <strong>{runtime.weakest.score}%</strong>
          </div>
          <div className="bottleneckCore">
            <span>WEAKEST CURRENT LAYER</span>
            <h3>{runtime.weakest.label}</h3>
            <p>{runtime.weakest.next}</p>
          </div>
          <div className="systemFacts">
            <div><span>Execution learning</span><strong>{learning.successRate}%</strong></div>
            <div><span>Stability</span><strong>{runtime.stability.score}%</strong></div>
            <div><span>Pending learnings</span><strong>{runtime.metrics.pendingLearnings}</strong></div>
            <div><span>Completed actions</span><strong>{runtime.metrics.completedActions}</strong></div>
          </div>
        </article>
      </div>

      <article className="neuralPanel cortexPanel">
        <div className="panelHeading">
          <div><BrainCircuit size={18} /><span>LIVE CORTEX</span></div>
          <strong>{runtime.reasoning.themes.join(' / ')}</strong>
        </div>
        <div className="cortexGrid">
          {runtime.reasoning.rankedProjects.slice(0, 4).map((project, index) => (
            <div className="cortexProject" key={project.id}>
              <span>0{index + 1}</span>
              <strong>{project.title}</strong>
              <p>{project.nextStep}</p>
              <small>{project.why}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
