import { useEffect, useMemo, useRef, useState } from 'react';
import { load, save } from '../services/localStore';
import { CURRENT_CONVERSATION_KEY, buildMessage, ensureConversation, loadLatestConversationMessages, saveConversationMessage } from '../services/conversationService';
import { routeCoreRequest } from '../services/aiRouter';
import { logActivity } from '../services/activityLog';
import { suggestMemoryFromMessage } from '../services/memorySuggestions';
import PresenceBanner from '../components/PresenceBanner';

function statusLabel(meta) {
  if (!meta) return 'Dylan Core ready';
  if (meta.source === 'dylan-core-internet-engine') return 'Internet Scan online';
  if (meta.source === 'dylan-core-engine') return 'Dylan Core Engine online';
  if (meta.source === 'real-ai-brain') return 'Dylan Core Engine online';
  if (meta.source === 'cloud-memory') return 'Cloud memory active';
  return 'Safe fallback mode';
}

function contextLine(meta) {
  const used = meta?.contextUsed;
  if (!used) return 'Identity guard active. Memory, projects, goals and plans load when available.';
  return `Context loaded: ${used.relevantMemories || 0} memories • ${used.projects || 0} projects • ${used.goals || 0} goals • ${used.plans || 0} plans.`;
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
  const [conversationId, setConversationId] = useState(load(CURRENT_CONVERSATION_KEY, null));
  const [cloudState, setCloudState] = useState('Preparing cloud memory...');
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
        deepThink,
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
        action: routed.source === 'dylan-core-engine' ? 'Processed with identity guard' : 'Used fallback safely',
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
          {deepThink ? 'Deep On' : 'Deep'}
        </button>
      </div>
      <PresenceBanner mode={mode} />
      <div className={`aiStatusPanel ${lastMeta?.source === 'dylan-core-engine' || lastMeta?.source === 'real-ai-brain' ? 'connected' : 'fallback'}`}>
        <span>{statusLabel(lastMeta)}</span>
        <small>{cloudState}</small>
        <small>{contextLine(lastMeta)}</small>
        {lastMeta?.internetUsed && <small>Internet Scan used{lastMeta?.sources?.length ? ` • ${lastMeta.sources.length} source(s)` : ''}</small>}
        {lastMeta?.internetNeeded && !lastMeta?.internetUsed && <small>Internet Scan requested but answered safely without live results.</small>}
      </div>
      <div className="quickChips" aria-label="Quick actions">
        <button type="button" onClick={() => send('What is the next best step for Core Self right now?')}>Next Step</button>
        <button type="button" onClick={() => send('What context are you using right now?')}>Context</button>
        <button type="button" onClick={() => send('Summarise the current Core Self build status.')}>Status</button>
        <button type="button" onClick={() => send('Search the internet for the latest useful AI tools for building Core Self cheaply.')}>Web Scan</button>
      </div>
      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={'bubble ' + m.from}>
            <span>{m.text}</span>
            {m.meta && <small>{statusLabel(m.meta)} • {contextLine(m.meta)}</small>}
            {m.meta?.sources?.length > 0 && (
              <small>Sources: {m.meta.sources.slice(0, 3).map((source) => source.title || source.url).join(' • ')}</small>
            )}
          </div>
        ))}
        {isSending && <div className="bubble core thinking">Dylan Core is thinking with identity and context loaded...</div>}
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
      {!!pendingSuggestions && (
        <div className="briefing suggestionNotice">
          <h3>Pending Core Suggestions</h3>
          <p>{pendingSuggestions} memory suggestion(s) are waiting in Memory Vault.</p>
        </div>
      )}
    </section>
  );
}
