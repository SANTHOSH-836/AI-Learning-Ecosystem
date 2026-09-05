import React, { useEffect, useRef, useState } from 'react';
import { Send, Terminal } from 'lucide-react';
import { api } from '../api.js';
import { Panel } from '../components.jsx';

const CHIPS = ['What is OOP?', 'Explain decorators', 'How do generators work?', "What's a list comprehension?", 'Explain exception handling'];

export default function Tutor({ token }) {
  const [history, setHistory] = useState([
    { role: 'assistant', text: 'Hi, I\'m Nexus Tutor. Ask me about any Python concept — try "explain decorators", or tap a topic chip below.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);
  useEffect(() => {
    api.tutorHistory(token).then((res) => { if (res.messages.length) setHistory(res.messages); }).catch(() => {});
  }, [token]);

  async function submit(text) {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    setHistory((h) => [...h, { role: 'user', text: t }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.tutorAsk(token, t);
      setHistory((h) => [...h, { role: 'assistant', text: res.text, level_label: res.level_label, example: res.example }]);
    } catch (e) {
      setHistory((h) => [...h, { role: 'assistant', text: 'Something went wrong reaching the tutor service.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack-lg">
      <Panel title="Nexus Tutor" icon={<Terminal size={16} color="var(--keyword)" />} right={<span className="dim mono" style={{ fontSize: 12 }}>adapts to your mastery level</span>}>
        <div className="repl">
          {history.map((m, i) => (
            <div key={i} className="repl-line">
              {m.role === 'user' ? (
                <div className="mono repl-prompt">&gt;&gt;&gt; {m.text}</div>
              ) : (
                <div className="repl-response">
                  {m.level_label && <span className="chip chip-accent" style={{ marginBottom: 6, display: 'inline-block' }}>{m.level_label} explanation</span>}
                  <div>{m.text}</div>
                  {m.example && <pre className="code-block mono">{m.example}</pre>}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="chip-row" style={{ margin: '10px 0' }}>
          {CHIPS.map((c) => <button key={c} className="chip chip-btn" onClick={() => submit(c)}>{c}</button>)}
        </div>
        <div className="repl-input">
          <span className="mono">&gt;&gt;&gt;</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any Python concept…"
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
          <button className="btn-primary" onClick={() => submit()} disabled={loading}><Send size={14} /></button>
        </div>
      </Panel>
    </div>
  );
}
