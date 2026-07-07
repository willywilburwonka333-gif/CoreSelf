import { useMemo, useState } from 'react';
import { load, save } from '../services/localStore';
import { logActivity } from '../services/activityLog';

export default function Actions() {
  const [queue, setQueue] = useState(load('actionQueue', []));
  const [filter, setFilter] = useState('Open');

  function updateQueue(next) {
    setQueue(next);
    save('actionQueue', next);
  }

  function markInProgress(action) {
    const next = queue.map((item) => item.id === action.id ? { ...item, status: 'In Progress', startedAt: new Date().toISOString() } : item);
    updateQueue(next);
    logActivity({ engine: 'Action Engine', action: 'Started action', detail: action.title });
  }

  function markDone(action) {
    const next = queue.map((item) => item.id === action.id ? { ...item, status: 'Done', completedAt: new Date().toISOString() } : item);
    updateQueue(next);
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
          <p className="eyebrow">ACTION ENGINE</p>
          <h2>Action Queue</h2>
        </div>
        <button className="deepToggle" type="button" onClick={clearDone}>Clear Done</button>
      </div>

      <div className="briefing">
        <h3>Prepared, not autonomous yet</h3>
        <p>Dylan Core can prepare tasks, reminders, memory updates, goal updates and code plans. This screen keeps them visible until real reminder/calendar/tool execution is wired in.</p>
        <p className="muted">Open: {openCount} • Done: {doneCount} • Total: {queue.length}</p>
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
            <p>Ask Dylan Core to create a task, reminder, code plan or project action, then save it from Talk.</p>
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
            <div className="miniActionButtons">
              {action.status !== 'In Progress' && action.status !== 'Done' && <button type="button" onClick={() => markInProgress(action)}>Start</button>}
              {action.status !== 'Done' && <button type="button" onClick={() => markDone(action)}>Done</button>}
              <button type="button" onClick={() => remove(action)}>Remove</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
