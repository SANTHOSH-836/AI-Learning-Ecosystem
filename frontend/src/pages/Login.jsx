import React, { useState } from 'react';
import { Code2, Sparkles } from 'lucide-react';
import { api } from '../api.js';

export default function Login({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await api.login(email, password)
        : await api.register(email, password, studentName || 'Student');
      onAuthed(res.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function tryDemo() {
    setError('');
    setLoading(true);
    try {
      const res = await api.demoLogin();
      onAuthed(res.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand-title" style={{ justifyContent: 'center', marginBottom: 6 }}>
          <Code2 size={20} color="var(--keyword)" /> EduNexus<span style={{ color: 'var(--keyword)' }}>AI</span>
        </div>
        <div className="dim mono" style={{ textAlign: 'center', fontSize: 12, marginBottom: 20 }}>&gt;&gt;&gt; python_track</div>

        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }} onClick={tryDemo} disabled={loading}>
          <Sparkles size={14} /> Try instant demo
        </button>
        <div className="dim" style={{ textAlign: 'center', fontSize: 11, margin: '4px 0 16px' }}>— or —</div>

        <form onSubmit={submit} className="stack-md">
          {mode === 'register' && (
            <input placeholder="Your name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {error && <div style={{ color: 'var(--error)', fontSize: 12 }}>{error}</div>}
          <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <button
          className="link-btn"
          style={{ margin: '14px auto 0', display: 'flex' }}
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
}
