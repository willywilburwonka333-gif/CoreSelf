import { useEffect, useMemo, useRef, useState } from 'react';
import { load, save } from '../services/localStore';
import { CURRENT_CONVERSATION_KEY, buildMessage, ensureConversation, loadLatestConversationMessages, saveConversationMessage } from '../services/conversationService';
import { routeCoreRequest } from '../services/aiRouter';
import { logActivity } from '../services/activityLog';
import { suggestMemoryFromMessage } from '../services/memorySuggestions';
import PresenceBanner from '../components/PresenceBanner';

function statusLabel(meta) {
  if (!meta) return 'Core ready';
  if (meta.source === 'real-ai-brain') return `Real AI • ${meta.provider}${meta.model ? ` • ${meta.model}` : ''}`;
  if (meta.source === 'cloud-memory') return 'Cloud conversation memory';
  return 'Fallback mode • local Core reply';
}

export default function Talk({ mode }) {
  const [messages, setMessages] = useState(load('messages', [
    { from: 'core', text: 'I am Dylan Core Genesis 0.3.0. Talk to me, and I will remember the conversation through the Cloud Brain.' },
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

  async function send() {
    const clean = input.trim();
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
      const routed = await routeCoreRequest({ input: clean, mode, memories, projects, goals, plans, messages: optimistic });
      const suggestion = suggestMemoryFromMessage(clean, suggestions);

      const meta = {
        provider: routed.provider,
        model: routed.model,
        source: routed.source,
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
        engine: 'Production AI Backend',
        action: routed.source === 'real-ai-brain' ? 'Processed with OpenAI' : 'Used fallback safely',
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
      <h2>Talk</h2>
      <PresenceBanner mode={mode} />
      <div className={`aiStatusPanel ${lastMeta?.source === 'real-ai-brain' ? 'connected' : 'fallback'}`}>
        <span>{statusLabel(lastMeta)}</span>
        <small>{cloudState}</small>
        <small>
          {lastMeta?.source === 'real-ai-brain'
            ? `Context used: ${lastMeta.contextUsed?.relevantMemories || 0} memories, ${lastMeta.contextUsed?.projects || 0} projects, ${lastMeta.contextUsed?.goals || 0} goals.`
            : 'Real AI activates when Vercel has OPENAI_API_KEY and the deployment is current.'}
        </small>
      </div>
      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={'bubble ' + m.from}>
            <span>{m.text}</span>
            {m.meta && <small>{statusLabel(m.meta)}</small>}
          </div>
        ))}
        {isSending && <div className="bubble core thinking">Core is thinking with long-term memory context...</div>}
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
          placeholder="Speak to Dylan Core..."
          rows={2}
        />
        <button onClick={send} disabled={isSending}>{isSending ? 'Thinking' : 'Send'}</button>
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
