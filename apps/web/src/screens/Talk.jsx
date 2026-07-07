import { useMemo, useState } from 'react';
import { load, save } from '../services/localStore';
import { routeCoreRequest } from '../services/aiRouter';
import { logActivity } from '../services/activityLog';
import { suggestMemoryFromMessage } from '../services/memorySuggestions';
import PresenceBanner from '../components/PresenceBanner';

function statusLabel(meta) {
  if (!meta) return 'Core ready';
  if (meta.source === 'real-ai-brain') return `Real AI • ${meta.provider}${meta.model ? ` • ${meta.model}` : ''}`;
  return 'Fallback mode • local Core reply';
}

export default function Talk({ mode }) {
  const [messages, setMessages] = useState(load('messages', [
    { from: 'core', text: 'I am Dylan Core Genesis. Teach me, and I will grow into your Core.' },
  ]));
  const [suggestions, setSuggestions] = useState(load('memorySuggestions', []));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastMeta, setLastMeta] = useState(load('lastAiMeta', null));

  const pendingSuggestions = useMemo(
    () => suggestions.filter((item) => item.status === 'Pending').length,
    [suggestions]
  );

  async function send() {
    const clean = input.trim();
    if (!clean || isSending) return;

    const userMessage = { from: 'dylan', text: clean, at: new Date().toISOString() };
    const optimistic = [...messages, userMessage];
    setMessages(optimistic);
    save('messages', optimistic);
    setInput('');
    setIsSending(true);

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
        { from: 'core', text: coreText, at: new Date().toISOString(), meta },
      ];

      setMessages(next);
      save('messages', next);
      setLastMeta(meta);
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
        {isSending && <div className="bubble core thinking">Core is thinking with memory context...</div>}
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
