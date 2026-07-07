import { useState } from 'react';
import { load, save } from '../services/localStore';
import { routeCoreRequest } from '../services/aiRouter';
import { logActivity } from '../services/activityLog';
import PresenceBanner from '../components/PresenceBanner';

export default function Talk({ mode }) {
  const [messages, setMessages] = useState(load('messages', [
    { from: 'core', text: 'I am Dylan Core Genesis. Teach me, and I will grow into your Core.' },
  ]));
  const [input, setInput] = useState('');

  async function send() {
    const clean = input.trim();
    if (!clean) return;
    const memories = load('memories', []);
    const projects = load('projects', []);
    const goals = load('goals', []);
    const routed = await routeCoreRequest({ input: clean, mode, memories, projects, goals });

    const next = [
      ...messages,
      { from: 'dylan', text: clean },
      { from: 'core', text: routed.reply },
    ];
    setMessages(next);
    save('messages', next);
    logActivity({
      engine: 'AI Router',
      action: 'Processed message',
      detail: `Mode ${mode}. Context used: ${routed.contextUsed.relevantMemories} relevant memories.`,
    });
    setInput('');
  }

  return (
    <section className="screen">
      <h2>Talk</h2>
      <PresenceBanner mode={mode} />
      <div className="chat">
        {messages.map((m, i) => <div key={i} className={'bubble ' + m.from}>{m.text}</div>)}
      </div>
      <div className="inputRow">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Speak to Dylan Core..." />
        <button onClick={send}>Send</button>
      </div>
    </section>
  );
}
