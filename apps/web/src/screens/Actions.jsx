import { useMemo, useState } from 'react';
import { load, save } from '../services/localStore';
import { defaultGoals, defaultProjects } from '../data/defaults';
import { logActivity } from '../services/activityLog';
import { buildProactiveSuggestions, buildMorningPriorityStack } from '../services/proactiveEngine';
import { buildAssistantBehaviourProfile } from '../services/assistantBehaviourEngine';
import { buildCompressedMemoryIndex, buildMemoryCompressionActions } from '../services/memoryCompressionEngine';
import { loadToolRegistry, buildToolActions, buildToolReadiness } from '../services/toolRegistry';
import { buildExecutionLearning, loadExecutionOutcomes, recordExecutionOutcome } from '../services/executionLearningEngine';

export default function Actions() {
  const [queue, setQueue] = useState(load('actionQueue', []));
  const [filter, setFilter] = useState('Open');
  const [outcomeVersion, setOutcomeVersion] = useState(0);

  const memories = load('memories', []);
  const projects = load('projects', defaultProjects);
  const goals = load('goals', defaultGoals);
  const plans = load('plans', []);
  const suggestions = load('memorySuggestions', []);
  const activityLog = load('activityLog', []);
  const messages = load('messages', []);
  const tools = loadToolRegistry();

  const proactive = useMemo(() => buildProactiveSuggestions({ memories, projects, goals, plans, suggestions, activityLog, messages, queue }), [memories, projects, goals, plans, suggestions, activityLog, messages, queue]);
  const morningStack = useMemo(() => buildMorningPriorityStack({ memories, projects, goals, plans, suggestions, activityLog, messages, queue }), [memories, projects, goals, plans, suggestions, activityLog, messages, queue]);
  const behaviour = useMemo(() => buildAssistantBehaviourProfile({ memories, projects, goals, plans, suggestions, activityLog, messages, queue }), [memories, projects, goals, plans, suggestions, activityLog, messages, queue]);
  const compression = useMemo(() => buildCompressedMemoryIndex({ memories, suggestions, messages, activityLog, queue }), [memories, suggestions, messages, activityLog, queue]);
  const compressionActions = useMemo(() => buildMemoryCompressionActions(compression), [compression]);
  const toolActions = useMemo(() => buildToolActions(tools), [tools]);
  const toolReadiness = useMemo(() => buildToolReadiness(tools), [tools]);
  const executionLearning = useMemo(() => buildExecutionLearning(loadExecutionOutcomes()), [outcomeVersion]);

  function updateQueue(next) {
    setQueue(next);
    save('actionQueue', next);
  }

  function queueAction(action) {
    const next = [{ ...action, id: action.id || crypto.randomUUID(), status: 'Queued', createdAt: action.createdAt || new Date().toISOString() }, ...queue];
    updateQueue(next);
    logActivity({ engine: 'Proactive Engine', action: 'Queued proactive action', detail: action.title });
  }

  function queueAll() {
    if (!proactive.length) return;
    const stamped = proactive.map((action) => ({ ...action, id: action.id || crypto.randomUUID(), status: 'Queued', createdAt: action.createdAt || new Date().toISOString() }));
    updateQueue([...stamped, ...queue]);
    logActivity({ engine: 'Proactive Engine', action: 'Queued priority stack', detail: `${stamped.length} action(s)` });
  }

  function markInProgress(action) {
    const next = queue.map((item) => item.id === action.id ? { ...item, status: 'In Progress', startedAt: new Date().toISOString() } : item);
    updateQueue(next);
    logActivity({ engine: 'Action Engine', action: 'Started action', detail: action.title });
  }

  function markDone(action) {
    const completedAt = new Date().toISOString();
    const next = queue.map((item) => item.id === action.id ? { ...item, status: 'Done', completedAt } : item);
    updateQueue(next);
    recordExecutionOutcome(action, { success: true, result: 'Completed', completedAt });
    setOutcomeVersion((value) => value + 1);
    logActivity({ engine: 'Action Engine', action: 'Completed action', detail: action.title });
  }

  function remove(action) {
    const next = queue.filter((item) => item.id !== action.id);
    updateQueue(next);
    logActivity({ engine: 'Action Engine', action: 'Removed action', detail: action.title });
  }

  function clearDone() {
    const next = queue.filter((item) => item.status !== 'Done');
    updateQueue(next);
    logActivity({ engine: 'Action Engine', action: 'Cleared completed actions', detail: `${queue.length - next.length} removed` });
  }

  const filteredQueue = useMemo(() => {
    if (filter === 'All') return queue;
    if (filter === 'Done') return queue.filter((item) => item.status === 'Done');
    return queue.filter((item) => item.status !== 'Done');
  }, [queue, filter]);

  const openCount = queue.filter((item) => item.status !== 'Done').length;
  const doneCount = queue.filter((item) => item.status === 'Done').length;

  return (
    <section className="screen">
      <div className="talkHeader">
        <div>
          <p className="eyebrow">ACTION ENGINE / GENESIS 1.4</p>
          <h2>Autonomous Task Runtime</h2>
        </div>
        <button className="deepToggle" type="button" onClick={clearDone}>Clear Done</button>
      </div>

      <div className="briefing">
        <h3>Controlled autonomy</h3>
        <p>Core Self can rank, queue, start, finish and learn from internal work. External communication, spending, destructive changes and production writes remain approval-gated.</p>
        <p className="muted">Open: {openCount} • Done: {doneCount} • Suggested now: {proactive.length}</p>
      </div>

      <div className="briefing">
        <div className="itemTopline">
          <h3>Execution Learning</h3>
          <small>{executionLearning.maturity}</small>
        </div>
        <p><strong>{executionLearning.total}</strong> recorded outcome(s) • <strong>{executionLearning.successRate}%</strong> successful completion history.</p>
        {executionLearning.patterns.length ? (
          <div className="miniScores">
            {executionLearning.patterns.slice(0, 6).map((pattern) => (
              <div className="scoreBadge" key={pattern.signal}>
                <strong>{pattern.successRate}%</strong>
                <span>{pattern.signal}</span>
                <small>{pattern.total} sample(s)</small>
              </div>
            ))}
          </div>
        ) : <p className="muted">Complete actions to start building a behavioural evidence model.</p>}
      </div>

      <div className="briefing">
        <div className="itemTopline">
          <h3>Priority Stack</h3>
          <button type="button" onClick={queueAll}>Queue Stack</button>
        </div>
        {morningStack.length ? morningStack.map((item) => (
          <div className="miniActionCard" key={`${item.rank}-${item.title}`}>
            <strong>#{item.rank} {item.title}</strong>
            <p>{item.nextStep}</p>
            <small>{item.priority}</small>
          </div>
        )) : <p className="muted">No proactive priority stack yet. Add goals, projects, memories, or pending suggestions.</p>}
      </div>

      <div className="briefing">
        <h3>Companion Loop Guardrails</h3>
        <p>{behaviour.behaviourSummary}</p>
        <ul>
          {behaviour.blindSpots.map((spot) => <li key={spot}>{spot}</li>)}
        </ul>
      </div>

      <div className="briefing">
        <h3>Tool Actions</h3>
        <p>{toolReadiness.summary}</p>
        {toolActions.slice(0, 5).map((action) => (
          <div className="miniActionCard" key={action.id}>
            <div className="itemTopline"><strong>{action.title}</strong><small>{action.priority}</small></div>
            <p>{action.detail}</p>
            <p><strong>Next:</strong> {action.nextStep}</p>
            <button type="button" onClick={() => queueAction(action)}>Add to Queue</button>
          </div>
        ))}
      </div>

      <div className="briefing">
        <h3>Memory Compression Actions</h3>
        {compressionActions.length ? compressionActions.map((action) => (
          <div className="miniActionCard" key={action.title}>
            <strong>{action.title}</strong>
            <p>{action.detail}</p>
            <button type="button" onClick={() => queueAction({ ...action, id: `compression-${action.title}`, type: 'Memory Compression', nextStep: action.detail, source: 'Memory Compression' })}>Add to Queue</button>
          </div>
        )) : <p className="muted">No compression action needed right now.</p>}
      </div>

      <div className="briefing">
        <h3>Suggested Actions</h3>
        {proactive.length ? proactive.map((action) => (
          <div className="miniActionCard" key={action.id}>
            <div className="itemTopline">
              <strong>{action.title}</strong>
              <small>{action.type} • {action.priority} • {action.confidence}%</small>
            </div>
            <p>{action.detail}</p>
            <p><strong>Next:</strong> {action.nextStep}</p>
            <button type="button" onClick={() => queueAction(action)}>Add to Queue</button>
          </div>
        )) : <p className="muted">No new suggestions. Current queue already covers the strongest signals.</p>}
      </div>

      <div className="quickChips">
        {['Open', 'Done', 'All'].map((item) => (
          <button key={item} type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </div>

      <div className="list actionQueueList">
        {!filteredQueue.length && (
          <article>
            <strong>No queued actions yet.</strong>
            <p>Use the proactive suggestions above to create the first live action stack.</p>
          </article>
        )}

        {filteredQueue.map((action) => (
          <article key={action.id} className={action.status === 'Done' ? 'doneAction' : ''}>
            <div className="itemTopline">
              <strong>{action.title || action.type}</strong>
              <small>{action.type || 'action'} • {action.status || 'Queued'}</small>
            </div>
            <p>{action.detail}</p>
            <p><strong>Next:</strong> {action.nextStep || 'Review and act.'}</p>
            {action.source && <small>Source: {action.source}</small>}
            <div className="miniActionButtons">
              {action.status !== 'In Progress' && action.status !== 'Done' && <button type="button" onClick={() => markInProgress(action)}>Start</button>}
              {action.status !== 'Done' && <button type="button" onClick={() => markDone(action)}>Done + Learn</button>}
              <button type="button" onClick={() => remove(action)}>Remove</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
