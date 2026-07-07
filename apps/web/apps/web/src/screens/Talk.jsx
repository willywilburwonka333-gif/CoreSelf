import { useEffect, useMemo, useRef, useState } from 'react';
import { load, save } from '../services/localStore';
import { buildMessage, ensureConversation, loadLatestConversationMessages, saveConversationMessage } from '../services/conversationService';
import { routeCoreRequest } from '../services/aiRouter';
import { logActivity } from '../services/activityLog';
import { suggestMemoryFromMessage } from '../services/memorySuggestions';
import PresenceBanner from '../components/PresenceBanner';

const CORE_CHAT_VERSION = 'Genesis 0.5.0';
const CURRENT_CORE_CONVERSATION_KEY = 'currentDylanCoreConversationGenesis050';
const CORE_MESSAGE_KEY = 'dylanCoreMessagesGenesis050';
const CORE_META_KEY = 'lastDylanCoreMetaGenesis050';

function statusLabel(meta) {
  if (!meta) return 'Dylan Core ready';
  if (meta.source === 'dylan-core-engine') return meta.route?.reasoning === 'deep' ? 'Dylan Core • Deep Think' : 'Dylan Core • Standard';
  if (meta.source === 'cloud-memory') return 'Dylan Core • Cloud memory';
  if (meta.source === 'local-fallback') return 'Dylan Core • Safe fallback';
  return 'Dylan Core';
}

function routeBadges(meta) {
  const route = meta?.route || {};
  return [
    route.reasoning === 'deep' ? 'Deep Think' : 'Standard',
    meta?.contextUsed?.relevantMemories ? `${meta.contextUsed.relevantMemories} memories` : 'Core memory',
    route.internetAvailable ? 'Live Scan connected' : 'Live Scan queued',
    CORE_CHAT_VERSION,
  ];
}

function MessageText({ text }) {
  return String(text || '')
    .split('\n')
    .map((line, index) => {
      const clean = line.trim();
      if (!clean) return <br key={index} />;
      if (/^[-•]\s+/.test(clean)) return <p key={index} className="coreBullet">{clean}</p>;
      return <p key={index}>{clean}</p>;
    });
}

export default function Talk({ mode }) {
  const [messages, setMessages] = useState(load(CORE_MESSAGE_KEY, [
    buildMessage({ from: 'core', text: 'Dylan. Core pipeline is online. I am now using the Genesis 0.5.0 conversation lane so old generic chat history cannot drag the interface back into onboarding mode. Ask me what is next and I will answer from the Core Self plan.' }),
  ]));
  const [suggestions, setSuggestions] = useState(load('memorySuggestions', []));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastMeta, setLastMeta] = useState(load(CORE_META_KEY, null));
  const [conversationId, setConversationId] = useState(load(CURRENT_CORE_CONVERSATION_KEY, null));
  const [cloudState, setCloudState] = useState('Preparing conversation memory...');
  const [deepNext, setDeepNext] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    let alive = true;
    async function startConversation() {
      const existing = load(CURRENT_CORE_CONVERSATION_KEY, null);
      const result = await ensureConversation(existing, 'Dylan Core Genesis 0.5.0');
      if (!alive) return;
      if (result.ok) {
        setConversationId(result.conversationId);
        save(CURRENT_CORE_CONVERSATION_KEY, result.conversationId);
        const loaded = await loadLatestConversationMessages(result.conversationId, messages);
        if (alive && loaded.ok && loaded.messages?.length) {
          setMessages(loaded.messages);
          save(CORE_MESSAGE_KEY, loaded.messages);
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

  async function send(forceDeep = false, preset = '') {
    const clean = (preset || input).trim();
    if (!clean || isSending) return;

    const userMessage = buildMessage({ from: 'dylan', text: clean });
    const optimistic = [...messages, userMessage];
    setMessages(optimistic);
    save(CORE_MESSAGE_KEY, optimistic);
    setInput('');
    setIsSending(true);
    if (conversationId) saveConversationMessage(conversationId, userMessage).catch(() => null);

    try {
      const memories = load('memories', []);
      const projects = load('projects', []);
      const goals = load('goals', []);
      const plans = load('plans', []);
      const routed = await routeCoreRequest({ input: clean, mode, memories, projects, goals, plans, messages: optimistic, deepThink: forceDeep || deepNext });
      const suggestion = suggestMemoryFromMessage(clean, suggestions);

      const meta = {
        provider: routed.provider,
        model: routed.model,
        source: routed.source,
        confidence: routed.confidence,
        latencyMs: routed.latencyMs,
        error: routed.error,
        route: routed.route,
        contextUsed: routed.contextUsed,
        at: new Date().toISOString(),
      };

      const coreText = suggestion
        ? `${routed.reply}\n\nCore suggestion: this sounds worth saving to Memory.`
        : routed.reply;

      const next = [
        ...optimistic,
        buildMessage({ from: 'core', text: coreText, meta }),
      ];

      setMessages(next);
      save(CORE_MESSAGE_KEY, next);
      setLastMeta(meta);
      setDeepNext(false);
      if (conversationId) saveConversationMessage(conversationId, next[next.length - 1]).catch(() => null);
      save(CORE_META_KEY, meta);

      if (suggestion) {
        const nextSuggestions = [suggestion, ...suggestions];
        setSuggestions(nextSuggestions);
        save('memorySuggestions', nextSuggestions);
        logActivity({ engine: 'Memory Suggestions', action: 'Created suggestion', detail: suggestion.title });
      }

      logActivity({
        engine: 'Dylan Core Engine',
        action: routed.route?.reasoning === 'deep' ? 'Processed with Deep Think route' : 'Processed with Standard route',
        detail: `Mode ${mode}. Context: ${routed.contextUsed.relevantMemories} memories, ${routed.contextUsed.projects} projects, ${routed.contextUsed.goals} goals.`,
      });
    } catch (error) {
      const failMessage = buildMessage({
        from: 'core',
        text: `Core failed safely. ${error.message || 'Unknown error.'}`,
      });
      const next = [...optimistic, failMessage];
      setMessages(next);
      save(CORE_MESSAGE_KEY, next);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="screen talkScreen dylanCoreTalk">
      <div className="coreTalkHeader">
        <div>
          <p className="eyebrow">DYLAN CORE</p>
          <h2>Talk</h2>
          <p className="muted">Core pipeline, identity guard, memory context, compact mobile UI.</p>
        </div>
        <div className="coreStatusStack">
          <span className="online">Online</span>
          <span>{deepNext ? 'Deep next' : 'Standard'}</span>
        </div>
      </div>

      <PresenceBanner mode={mode} />

      <div className={`aiStatusPanel coreIdentityPanel ${lastMeta?.source === 'local-fallback' ? 'fallback' : 'connected'}`}>
        <span>{statusLabel(lastMeta)}</span>
        <small>{cloudState}</small>
        <div className="coreBadges">
          {routeBadges(lastMeta).map((badge) => <em key={badge}>{badge}</em>)}
        </div>
        <small>
          Context loaded: {lastMeta?.contextUsed?.relevantMemories || 0} memories, {lastMeta?.contextUsed?.projects || 0} projects, {lastMeta?.contextUsed?.goals || 0} goals.
        </small>
      </div>

      <div className="quickPrompts">
        <button onClick={() => send(false, 'Where are we now and what is the next build step?')} disabled={isSending}>Next step</button>
        <button onClick={() => send(true, 'Deep think on the Core Self roadmap and tell me the safest next stack.')} disabled={isSending}>Deep roadmap</button>
        <button onClick={() => send(false, 'What do you know about me and my projects?')} disabled={isSending}>Check memory</button>
      </div>

      <div className="chat coreChat">
        {messages.map((m, i) => (
          <div key={i} className={'bubble ' + m.from}>
            <MessageText text={m.text} />
            {m.meta && (
              <small>
                {statusLabel(m.meta)} • {m.meta.contextUsed?.relevantMemories || 0} memories • {m.meta.route?.internetAvailable ? 'Live Scan' : 'Live Scan queued'}
              </small>
            )}
          </div>
        ))}
        {isSending && <div className="bubble core thinking">Dylan Core is thinking with memory and project context...</div>}
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
              send(false);
            }
          }}
          placeholder="Ask Dylan Core..."
          rows={2}
        />
        <button onClick={() => send(false)} disabled={isSending}>{isSending ? 'Thinking' : 'Send'}</button>
        <button className={deepNext ? 'activeDeep' : 'secondary'} onClick={() => setDeepNext((value) => !value)} disabled={isSending}>Deep Think</button>
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
