import { useState } from 'react';
import { load, save } from '../services/localStore';
import { coreReply } from '../services/coreReply';

export default function Talk({ mode }) {
  const [messages, setMessages] = useState(load('messages', [
    { from: 'core', text: 'I am Dylan Core Genesis. Teach me, and I will grow into your Core.' },
  ]));
  const [input, setInput] = useState('');

  function send() {
    const clean = input.trim();
    if (!clean) return;
    const next = [
      ...messages,
      { from: 'dylan', text: clean },
      { from: 'core', text: coreReply(clean, mode) },
    ];
    setMessages(next);
    save('messages', next);
    setInput('');
  }

  return (
    <section className="screen">
      <h2>Talk</h2>
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
