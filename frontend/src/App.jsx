import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase, Code2, GitBranch, LayoutDashboard, ListChecks, LogOut, Map as MapIcon, RotateCcw, Terminal } from 'lucide-react';
import { api } from './api.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Graph from './pages/Graph.jsx';
import Tutor from './pages/Tutor.jsx';
import Quiz from './pages/Quiz.jsx';
import Career from './pages/Career.jsx';
import Roadmap from './pages/Roadmap.jsx';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'graph', label: 'Knowledge Graph', icon: GitBranch },
  { id: 'tutor', label: 'AI Tutor', icon: Terminal },
  { id: 'quiz', label: 'Quiz', icon: ListChecks },
  { id: 'career', label: 'Career AI', icon: Briefcase },
  { id: 'roadmap', label: 'Roadmap', icon: MapIcon },
];
const FILES = { dashboard: 'dashboard.py', graph: 'knowledge_graph.py', tutor: 'nexus_tutor.py', quiz: 'quiz_engine.py', career: 'career_ai.py', roadmap: 'roadmap.py' };
const TOKEN_KEY = 'edunexus_token';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [quizPreset, setQuizPreset] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) { setUser(null); return; }
    api.me(token).then(setUser).catch(() => {
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
    });
  }, [token, refreshKey]);

  const handleAuthed = useCallback((tok) => {
    localStorage.setItem(TOKEN_KEY, tok);
    setToken(tok);
    setTab('dashboard');
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);
  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (!token) return <Login onAuthed={handleAuthed} />;
  if (!user) {
    return (
      <div className="app-root" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
        <div className="mono dim">loading session…</div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title"><Code2 size={18} color="var(--keyword)" /> EduNexus<span style={{ color: 'var(--keyword)' }}>AI</span></div>
          <div className="mono dim" style={{ fontSize: 11 }}>&gt;&gt;&gt; python_track</div>
        </div>
        <nav className="nav">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} className={`nav-item${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="avatar">{user.student_name.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="row-title" style={{ fontSize: 13 }}>{user.student_name}</div>
              <div className="dim mono" style={{ fontSize: 11 }}>Streak {user.streak}d · {user.xp} XP</div>
            </div>
          </div>
          <button className="link-btn" style={{ marginTop: 10 }} onClick={logout}><LogOut size={12} /> Log out</button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <span className="mono dim" style={{ fontSize: 12 }}>python_track / {FILES[tab]}</span>
          <span className="mono dim" style={{ fontSize: 12 }}>{user.email}</span>
        </div>
        <div className="content">
          {tab === 'dashboard' && <Dashboard token={token} setTab={setTab} setQuizPreset={setQuizPreset} refreshKey={refreshKey} />}
          {tab === 'graph' && <Graph token={token} refreshKey={refreshKey} />}
          {tab === 'tutor' && <Tutor token={token} />}
          {tab === 'quiz' && <Quiz token={token} preset={quizPreset} clearPreset={() => setQuizPreset(null)} onComplete={bump} />}
          {tab === 'career' && <Career token={token} onGoalSet={bump} />}
          {tab === 'roadmap' && <Roadmap token={token} setTab={setTab} />}
        </div>
      </main>
    </div>
  );
}
