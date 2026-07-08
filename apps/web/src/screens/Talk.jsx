import { useEffect, useMemo, useRef, useState } from 'react';
import { load, save } from '../services/localStore';
import { CURRENT_CONVERSATION_KEY, buildMessage, ensureConversation, loadLatestConversationMessages, saveConversationMessage } from '../services/conversationService';
import { routeCoreRequest, seedCoreSelfData } from '../services/aiRouter';
import { logActivity } from '../services/activityLog';
import { acceptSuggestion, suggestMemoryFromMessage } from '../services/memorySuggestions';
import PresenceBanner from '../components/PresenceBanner';

function statusLabel(meta) {
  if (!meta) return 'Dylan Core ready';
  if (meta.source === 'dylan-core-internet-engine') return meta.deepThink ? 'Deep Internet Scan online' : 'Internet Scan online';
  if (meta.deepThink) return 'Deep Think online';
  if (meta.source === 'dylan-core-engine') return 'Dylan Core Engine online';
  if (meta.source === 'real-ai-brain') return 'Dylan Core Engine online';
  if (meta.source === 'cloud-memory') return 'Cloud memory active';
  return 'Safe fallback mode';
}

function contextLine(meta) {
  const used = meta?.contextUsed;
  if (!used) return 'Seed pack active. Memory, projects, goals and plans load before every reply.';
  return `Context loaded: ${used.relevantMemories || 0} relevant / ${used.memories || 0} total memories • ${used.projects || 0} projects • ${used.goals || 0} goals • ${used.plans || 0} plans.`;
}

export default function Talk({ mode }) {
  const [messages, setMessages] = useState(load('messages', [
    { from: 'core', text: 'Dylan. Core pipeline online. I will use memory, projects, goals, and plans when they are loaded. What are we fixing next?' },
  ]));
  const [suggestions, setSuggestions] = useState(load('memorySuggestions', []));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [lastMeta, setLastMeta] = useState(load('lastAiMeta', null));
  const [actionQueue, setActionQueue] = useState(load('actionQueue', []));
  const [conversationId, setConversationId] = useState(load(CURRENT_CONVERSATION_KEY, null));
  const [cloudState, setCloudState] = useState('Preparing cloud memory...');
  const [seedState, setSeedState] = useState(load('coreSeedState', null));
  const chatEndRef = useRef(null);


  useEffect(() => {
    const seeded = seedCoreSelfData();
    setSeedState(seeded);
    save('coreSeedState', seeded);
    logActivity({ engine: 'Dylan Core Seed Pack', action: 'Seed context checked', detail: `${seeded.memories} memories, ${seeded.projects} projects, ${seeded.goals} goals, ${seeded.plans} plans available.` });
  }, []);

  useEffect(() => {
    let alive = true;
    async function startConversation() {
      const existing = load(CURRENT_CONVERSATION_KEY, null);
      const result = await ensureConversation(existing, 'Dylan Core Talk');
      if (!alive) return;
      if (result.ok) {
        setConversationId(result.conversationId);
        save(CURRENT_CONVERSATION_KEY, result.conversationId);
        const loaded = await loadLatestConversationMessages(result.conversationId, messages);
        if (alive && loaded.ok && loaded.messages?.length) {
          setMessages(loaded.messages);
          save('messages', loaded.messages);
        }
        setCloudState('Cloud conversation memory active');
      } else {
        setCloudState(result.reason || 'Cloud conversation memory offline');
      }
    }
    startConversation().catch((error) => setCloudState(error.message || 'Cloud conversation memory failed safely'));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const pendingSuggestions = useMemo(
    () => suggestions.filter((item) => item.status === 'Pending').length,
    [suggestions]
  );

  async function send(overrideInput) {
    const clean = (overrideInput ?? input).trim();
    if (!clean || isSending) return;

    const userMessage = buildMessage({ from: 'dylan', text: clean });
    const optimistic = [...messages, userMessage];
    setMessages(optimistic);
    save('messages', optimistic);
    setInput('');
    setIsSending(true);
    if (conversationId) saveConversationMessage(conversationId, userMessage).catch(() => null);

    try {
      const memories = load('memories', []);
      const projects = load('projects', []);
      const goals = load('goals', []);
      const plans = load('plans', []);
      const routed = await routeCoreRequest({ input: clean, mode, memories, projects, goals, plans, messages: optimistic, deepThink });
      const suggestion = suggestMemoryFromMessage(clean, suggestions);

      const meta = {
        provider: routed.provider,
        model: routed.model,
        source: routed.source,
        confidence: routed.confidence,
        latencyMs: routed.latencyMs,
        error: routed.error,
        contextUsed: routed.contextUsed,
        internetNeeded: routed.internetNeeded,
        internetUsed: routed.internetUsed,
        sources: routed.sources || [],
        preparedActions: routed.preparedActions || [],
        orchestratorPlan: routed.orchestratorPlan || null,
        researchPlan: routed.researchPlan || null,
        developerPlan: routed.developerPlan || null,
        toolRuntime: routed.toolReadiness?.runtime || routed.toolRuntime || null,
        deepThink,
        routeProfile: routed.routeProfile,
        deepRecommended: routed.deepRecommended,
        at: new Date().toISOString(),
      };

      const coreText = suggestion
        ? `${routed.reply}\n\nCore Suggestion: this sounds worth saving to Memory.`
        : routed.reply;

      const next = [
        ...optimistic,
        buildMessage({ from: 'core', text: coreText, meta }),
      ];

      setMessages(next);
      save('messages', next);
      setLastMeta(meta);
      if (conversationId) saveConversationMessage(conversationId, next[next.length - 1]).catch(() => null);
      save('lastAiMeta', meta);

      if (suggestion) {
        const nextSuggestions = [suggestion, ...suggestions];
        setSuggestions(nextSuggestions);
        save('memorySuggestions', nextSuggestions);
        logActivity({ engine: 'Memory Suggestions', action: 'Created suggestion', detail: suggestion.title });
      }

      logActivity({
        engine: 'Dylan Core Pipeline',
        action: routed.internetUsed ? 'Used Internet Scan' : (deepThink ? 'Processed with Deep Think' : 'Processed with identity guard'),
        detail: `Mode ${mode}. Context: ${routed.contextUsed.relevantMemories} memories, ${routed.contextUsed.projects} projects, ${routed.contextUsed.goals} goals.`,
      });
    } catch (error) {
      const failMessage = {
        from: 'core',
        text: `Core AI failed safely. ${error.message || 'Unknown error.'}`,
        at: new Date().toISOString(),
      };
      const next = [...optimistic, failMessage];
      setMessages(next);
      save('messages', next);
    } finally {
      setIsSending(false);
    }
  }

  function approveSuggestion(suggestion) {
    const memory = acceptSuggestion(suggestion);
    const currentMemories = load('memories', []);
    save('memories', [memory, ...currentMemories]);
    const nextSuggestions = suggestions.map((item) => item.id === suggestion.id ? { ...item, status: 'Accepted', acceptedAt: new Date().toISOString() } : item);
    setSuggestions(nextSuggestions);
    save('memorySuggestions', nextSuggestions);
    logActivity({ engine: 'Memory Vault', action: 'Accepted memory suggestion', detail: memory.title });
  }

  function rejectSuggestion(suggestion) {
    const nextSuggestions = suggestions.map((item) => item.id === suggestion.id ? { ...item, status: 'Rejected', rejectedAt: new Date().toISOString() } : item);
    setSuggestions(nextSuggestions);
    save('memorySuggestions', nextSuggestions);
    logActivity({ engine: 'Memory Vault', action: 'Rejected memory suggestion', detail: suggestion.title });
  }

  function savePreparedAction(action) {
    const prepared = { ...action, id: action.id || crypto.randomUUID(), savedAt: new Date().toISOString(), status: 'Queued' };
    const nextQueue = [prepared, ...actionQueue].slice(0, 50);
    setActionQueue(nextQueue);
    save('actionQueue', nextQueue);
    logActivity({ engine: 'Action Engine', action: 'Queued prepared action', detail: prepared.title });
  }

  const latestPendingSuggestions = suggestions.filter((item) => item.status === 'Pending').slice(0, 3);
  const latestPreparedActions = lastMeta?.preparedActions || [];

  return (
    <section className="screen talkScreen">
      <div className="talkHeader">
        <div>
          <p className="eyebrow">DYLAN CORE</p>
          <h2>Talk</h2>
        </div>
        <button
          className={`deepToggle ${deepThink ? 'active' : ''}`}
          type="button"
          onClick={() => setDeepThink((value) => !value)}
        >
          {deepThink ? 'Deep Think On' : 'Deep Think'}
        </button>
      </div>
      <PresenceBanner mode={mode} />
      <div className={`aiStatusPanel ${lastMeta?.source === 'dylan-core-engine' || lastMeta?.source === 'real-ai-brain' ? 'connected' : 'fallback'}`}>
        <span>{statusLabel(lastMeta)}</span>
        <small>{cloudState}</small>
        <small>{contextLine(lastMeta)}</small>
        {seedState && <small>Seed pack: {seedState.memories} memories • {seedState.projects} projects • {seedState.goals} goals • {seedState.plans} plans.</small>}
        {actionQueue.length > 0 && <small>Action Queue: {actionQueue.length} saved item(s).</small>}
        {lastMeta?.internetUsed && <small>Internet Scan used{lastMeta?.sources?.length ? ` • ${lastMeta.sources.length} source(s)` : ''}</small>}
        {lastMeta?.internetNeeded && !lastMeta?.internetUsed && <small>Internet Scan requested but answered safely without live results.</small>}
        {lastMeta?.deepRecommended && !lastMeta?.deepThink && <small>Router note: Deep Think may improve this kind of request.</small>}
        {lastMeta?.routeProfile && <small>Route: {lastMeta.routeProfile}</small>}
        {lastMeta?.orchestratorPlan && <small>Orchestrator: {lastMeta.orchestratorPlan.label} • {lastMeta.orchestratorPlan.answerStyle}</small>}
        {lastMeta?.researchPlan && lastMeta.internetNeeded && <small>Research: {lastMeta.researchPlan.fitLabel} • compares against Core Self stack</small>}
        {lastMeta?.developerPlan?.isDeveloperRequest && <small>Developer: {lastMeta.developerPlan.requestType} • {lastMeta.developerPlan.project}</small>}
        {lastMeta?.toolRuntime && <small>Runtime: {lastMeta.toolRuntime.runnable} runnable • {lastMeta.toolRuntime.blocked} gated</small>}
        {latestPreparedActions.length > 0 && <small>Action Engine prepared {latestPreparedActions.length} action(s).</small>}
      </div>
      <div className="quickChips" aria-label="Quick actions">
        <button type="button" onClick={() => send('What is the next best step for Core Self right now?')}>Next Step</button>
        <button type="button" onClick={() => send('What context are you using right now?')}>Context</button>
        <button type="button" onClick={() => send('Summarise the current Core Self build status.')}>Status</button>
        <button type="button" onClick={() => { setDeepThink(true); send('Deep Think: what is the strongest next architecture move for Core Self?'); }}>Deep Plan</button>
        <button type="button" onClick={() => send('Search the internet for the latest useful AI tools for building Core Self cheaply, compare them against our actual stack, tell me what to use now, what to skip, and cite sources.')}>Web Scan</button>
        <button type="button" onClick={() => send('Create an action plan for the next Core Self build.')}>Action Plan</button>
        <button type="button" onClick={() => { const seeded = seedCoreSelfData(); setSeedState(seeded); save('coreSeedState', seeded); }}>Reseed Core</button>
      </div>
      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={'bubble ' + m.from}>
            <span>{m.text}</span>
            {m.meta && <small>{statusLabel(m.meta)} • {contextLine(m.meta)}{m.meta.deepThink ? ' • Deep Think' : ''}{m.meta.orchestratorPlan ? ` • ${m.meta.orchestratorPlan.label}` : ''}{m.meta.developerPlan?.isDeveloperRequest ? ` • ${m.meta.developerPlan.requestType}` : ''}</small>}
            {m.meta?.sources?.length > 0 && (
              <div className="sourceCards">
                {m.meta.sources.slice(0, 4).map((source, sourceIndex) => (
                  <a
                    key={source.url || source.title || sourceIndex}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="sourceCard"
                  >
                    <strong>{sourceIndex + 1}. {source.title || 'Source'}</strong>
                    <span>{source.url}</span>
                  </a>
                ))}
              </div>
            )}
            {m.meta?.preparedActions?.length > 0 && (
              <small>Actions prepared: {m.meta.preparedActions.map((action) => action.title).join(' • ')}</small>
            )}
          </div>
        ))}
        {isSending && <div className="bubble core thinking">Dylan Core is thinking with identity, context, and router loaded...</div>}
        <div ref={chatEndRef} />
      </div>
      <div className="inputRow">
        <textarea
          value={input}
          disabled={isSending}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask Dylan Core..."
          rows={2}
        />
        <button onClick={() => send()} disabled={isSending}>{isSending ? 'Thinking' : 'Send'}</button>
      </div>
      {actionQueue.length > 0 && (
        <div className="briefing actionNotice">
          <h3>Action Queue</h3>
          {actionQueue.slice(0, 5).map((action) => (
            <div className="miniActionCard" key={action.id}>
              <strong>{action.title}</strong>
              <p>{action.nextStep || action.detail}</p>
              <small>{action.type} • {action.status}</small>
            </div>
          ))}
        </div>
      )}
      {latestPreparedActions.length > 0 && (
        <div className="briefing actionNotice">
          <h3>Prepared Actions</h3>
          {latestPreparedActions.map((action) => (
            <div className="miniActionCard" key={action.id}>
              <strong>{action.title}</strong>
              <p>{action.nextStep}</p>
              <button type="button" onClick={() => savePreparedAction(action)}>Save to Action Queue</button>
            </div>
          ))}
        </div>
      )}
      {!!pendingSuggestions && (
        <div className="briefing suggestionNotice">
          <h3>Pending Core Suggestions</h3>
          <p>{pendingSuggestions} memory suggestion(s) are waiting in Memory Vault.</p>
          {latestPendingSuggestions.map((suggestion) => (
            <div className="miniActionCard" key={suggestion.id}>
              <strong>{suggestion.title}</strong>
              <p>{suggestion.content}</p>
              <div className="miniActionButtons">
                <button type="button" onClick={() => approveSuggestion(suggestion)}>Save Memory</button>
                <button type="button" onClick={() => rejectSuggestion(suggestion)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
