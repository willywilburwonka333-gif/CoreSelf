import { useEffect, useMemo, useRef, useState } from 'react';
import { load, save } from '../services/localStore';
import { CURRENT_CONVERSATION_KEY, buildMessage, ensureConversation, loadLatestConversationMessages, saveConversationMessage } from '../services/conversationService';
import { routeCoreRequest } from '../services/aiRouter';
import { logActivity } from '../services/activityLog';
import { suggestMemoryFromMessage } from '../services/memorySuggestions';
import PresenceBanner from '../components/PresenceBanner';

function statusLabel(meta) {
  if (!meta) return 'Core Engine ready';
  if (meta.source === 'dylan-core-engine') return meta.reasoningMode === 'deep' ? 'Dylan Core • Deep Think' : 'Dylan Core • Standard';
  if (meta.source === 'cloud-memory') return 'Cloud conversation memory';
  return 'Core fallback active';
}

function routeLabel(meta) {
  if (!meta?.route) return 'Standard';
  if (meta.route.includes('research')) return 'Deep Research Ready';
  if (meta.route.includes('internet')) return 'Live Scan Ready';
  if (meta.route.includes('deep')) return 'Deep Think';
  return 'Standard';
}

function copyText(text) {
  navigator.clipboard?.writeText(text).catch(() => null);
}

export default function Talk({ mode }) {
  const [messages, setMessages] = useState(load('messages', [
    { from: 'core', text: 'Dylan. Core Engine online. Memory, projects, goals, and Deep Think routing are ready. What is the objective?' },
  ]));
  const [suggestions, setSuggestions] = useState(load('memorySuggestions', []));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastMeta, setLastMeta] = useState(load('lastAiMeta', null));
  const [conversationId, setConversationId] = useState(load(CURRENT_CONVERSATION_KEY, null));
  const [cloudState, setCloudState] = useState('Preparing conversation memory...');
  const chatEndRef = useRef(null);

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
        setCloudState('Cloud memory active');
      } else {
        setCloudState(result.reason || 'Cloud memory offline');
      }
    }
    startConversation().catch((error) => setCloudState(error.message || 'Cloud memory failed safely'));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const pendingSuggestions = useMemo(
    () => suggestions.filter((item) => item.status === 'Pending').length,
    [suggestions]
  );

  const engineState = useMemo(() => {
    const connected = lastMeta?.source === 'dylan-core-engine';
    const context = lastMeta?.contextUsed || {};
    return {
      connected,
      memoryCount: context.relevantMemories || 0,
      projectCount: context.projects || 0,
      goalCount: context.goals || 0,
      reasoning: lastMeta?.reasoningMode === 'deep' ? 'Deep' : 'Standard',
      liveScan: lastMeta?.liveScanAvailable ? 'Connected' : lastMeta?.internetIntent ? 'Ready' : 'Standby',
      route: routeLabel(lastMeta),
    };
  }, [lastMeta]);

  async function send(reasoningMode = 'standard', overrideInput = null) {
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
      const routed = await routeCoreRequest({ input: clean, mode, memories, projects, goals, plans, messages: optimistic, reasoningMode });
      const suggestion = suggestMemoryFromMessage(clean, suggestions);

      const meta = {
        provider: routed.provider,
        model: routed.model,
        source: routed.source,
        route: routed.route,
        reasoningMode: routed.reasoningMode,
        internetIntent: routed.internetIntent,
        liveScanAvailable: routed.liveScanAvailable,
        confidence: routed.confidence,
        latencyMs: routed.latencyMs,
        error: routed.error,
        contextUsed: routed.contextUsed,
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
        engine: 'Dylan Core Engine',
        action: routed.source === 'dylan-core-engine' ? 'Processed through router' : 'Used fallback safely',
        detail: `${routed.reasoningMode || 'standard'} / ${routed.route || 'standard'} / Context: ${routed.contextUsed.relevantMemories} memories, ${routed.contextUsed.projects} projects, ${routed.contextUsed.goals} goals.`,
      });
    } catch (error) {
      const failMessage = {
        from: 'core',
        text: `Core Engine failed safely. ${error.message || 'Unknown error.'}`,
        at: new Date().toISOString(),
      };
      const next = [...optimistic, failMessage];
      setMessages(next);
      save('messages', next);
    } finally {
      setIsSending(false);
    }
  }

  const quickActions = [
    { label: 'Continue Project', text: 'Look at my active projects and tell me the best next move.' },
    { label: 'Review Goals', text: 'Review my goals and tell me what matters most next.' },
    { label: 'Deep Research', text: 'Deep think about Core Self and what we should build next.' },
    { label: 'Live Scan', text: 'When Live Scan is connected, search the internet for the latest information on this.' },
  ];

  return (
    <section className="screen talkScreen">
      <div className="coreHeader">
        <div>
          <span className="eyebrow">CORE ENGINE</span>
          <h2>Dylan Core</h2>
        </div>
        <div className="coreHeaderStatus">
          <strong>{engineState.connected ? 'Online' : 'Fallback'}</strong>
          <small>{cloudState}</small>
        </div>
      </div>

      <PresenceBanner mode={mode} />

      <div className={`aiStatusPanel coreEnginePanel ${engineState.connected ? 'connected' : 'fallback'}`}>
        <div className="engineMetric"><span>Status</span><strong>{engineState.connected ? 'Online' : 'Safe Mode'}</strong></div>
        <div className="engineMetric"><span>Memory</span><strong>{engineState.memoryCount ? `${engineState.memoryCount} loaded` : 'Standby'}</strong></div>
        <div className="engineMetric"><span>Projects</span><strong>{engineState.projectCount}</strong></div>
        <div className="engineMetric"><span>Goals</span><strong>{engineState.goalCount}</strong></div>
        <div className="engineMetric"><span>Reasoning</span><strong>{engineState.reasoning}</strong></div>
        <div className="engineMetric"><span>Live Scan</span><strong>{engineState.liveScan}</strong></div>
      </div>

      <div className="quickActions">
        {quickActions.map((action) => (
          <button key={action.label} type="button" onClick={() => setInput(action.text)} disabled={isSending}>{action.label}</button>
        ))}
      </div>

      <div className="chat coreChat">
        {messages.map((m, i) => (
          <div key={i} className={'bubble ' + m.from}>
            {m.from === 'core' && <b>Dylan Core</b>}
            <span>{m.text}</span>
            {m.meta && (
              <small>
                {statusLabel(m.meta)} • Route: {routeLabel(m.meta)} • Context: {m.meta.contextUsed?.relevantMemories || 0} memories, {m.meta.contextUsed?.projects || 0} projects, {m.meta.contextUsed?.goals || 0} goals
              </small>
            )}
            {m.from === 'core' && (
              <div className="messageActions">
                <button type="button" onClick={() => copyText(m.text)}>Copy</button>
                <button type="button" onClick={() => send('deep', m.text)}>Deep Think</button>
              </div>
            )}
          </div>
        ))}
        {isSending && <div className="bubble core thinking"><b>Dylan Core</b><span>Routing request through memory, projects, goals, and reasoning engine...</span></div>}
        <div ref={chatEndRef} />
      </div>

      <div className="inputRow coreInputRow">
        <textarea
          value={input}
          disabled={isSending}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send('standard');
            }
          }}
          placeholder="Ask Dylan Core..."
          rows={2}
        />
        <div className="sendStack">
          <button onClick={() => send('standard')} disabled={isSending}>{isSending ? 'Thinking' : 'Send'}</button>
          <button className="deepButton" onClick={() => send('deep')} disabled={isSending}>Deep Think</button>
        </div>
      </div>

      {!!pendingSuggestions && (
        <div className="briefing suggestionNotice">
          <h3>Pending Core Suggestions</h3>
          <p>{pendingSuggestions} memory suggestion(s) are waiting in Memory Vault.</p>
        </div>
      )}
    </section>
  );
}
