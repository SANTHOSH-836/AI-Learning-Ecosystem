import React, { useEffect, useState } from 'react';
import { AlertTriangle, Award, Briefcase, ChevronRight, Flame, Sparkles, Target, TrendingUp } from 'lucide-react';
import { api } from '../api.js';
import { Explain, MasteryPill, Panel, ProgressBar } from '../components.jsx';

export default function Dashboard({ token, setTab, setQuizPreset, refreshKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard(token).then(setData).catch((e) => setError(e.message));
  }, [token, refreshKey]);

  if (error) return <div style={{ color: 'var(--error)' }}>{error}</div>;
  if (!data) return <div className="dim mono">loading dashboard…</div>;

  return (
    <div className="stack-lg">
      <div>
        <h1 className="display">Welcome back, {data.student_name} 👋</h1>
        <p className="dim mono" style={{ marginTop: 4 }}>{'# your Python knowledge state, computed live'}</p>
      </div>

      <div className="grid-4">
        <Panel title="Learning Streak" icon={<Flame size={16} color="var(--error)" />}>
          <div className="stat-num">{data.streak}<span className="stat-unit"> days</span></div>
          <div className="dim" style={{ fontSize: 13 }}>{data.xp.toLocaleString()} XP earned</div>
        </Panel>
        <Panel title="Knowledge Score" icon={<TrendingUp size={16} color="var(--keyword)" />}>
          <div className="stat-num">{data.knowledge_score}<span className="stat-unit">%</span></div>
          <ProgressBar value={data.knowledge_score} />
        </Panel>
        <Panel title="Placement Readiness" icon={<Award size={16} color="var(--string)" />}>
          <div className="stat-num">{data.readiness_score}<span className="stat-unit">%</span></div>
          <ProgressBar value={data.readiness_score} colorVar="var(--string)" />
        </Panel>
        <Panel title="Top Career Match" icon={<Briefcase size={16} color="var(--number)" />}>
          {data.top_career_match ? (
            <>
              <div className="stat-num" style={{ fontSize: 28 }}>{data.top_career_match.score}<span className="stat-unit">%</span></div>
              <div className="dim" style={{ fontSize: 13 }}>{data.top_career_match.career.name}</div>
            </>
          ) : <div className="dim">—</div>}
        </Panel>
      </div>

      <div className="grid-2">
        <Panel
          title="Today's Learning Plan"
          icon={<Target size={16} color="var(--keyword)" />}
          right={<button className="btn-ghost" onClick={() => setTab('roadmap')}>View roadmap <ChevronRight size={14} /></button>}
        >
          {data.todays_plan.length === 0 ? (
            <div className="empty">Every core concept is in good shape. Try a harder quiz to push further.</div>
          ) : (
            <ul className="list">
              {data.todays_plan.map((c) => (
                <li key={c.id} className="list-row">
                  <div>
                    <div className="row-title">{c.name}</div>
                    <div className="dim" style={{ fontSize: 12 }}>{c.blurb}</div>
                  </div>
                  <MasteryPill mastery={c.mastery} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Knowledge Decay Alerts" icon={<AlertTriangle size={16} color="var(--error)" />}>
          {data.decay_alerts.length === 0 ? (
            <div className="empty">Nothing is decaying right now — nice consistency.</div>
          ) : (
            <ul className="list">
              {data.decay_alerts.map((d) => (
                <li key={d.concept.id} className="list-row">
                  <div>
                    <div className="row-title">⚠️ {d.concept.name}</div>
                    <div className="dim" style={{ fontSize: 12 }}>Last studied {d.days} days ago · {d.review_minutes} min review recommended</div>
                  </div>
                  <button className="btn-ghost" onClick={() => { setQuizPreset(d.concept.id); setTab('quiz'); }}>Revise</button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="AI Recommendations for You"
        icon={<Sparkles size={16} color="var(--number)" />}
        right={<button className="btn-ghost" onClick={() => setTab('career')}>Set career goal <ChevronRight size={14} /></button>}
      >
        <div className="grid-2">
          {data.recommendations.map((r, i) => (
            <div key={i} className="rec-card">
              <div className="rec-head"><span style={{ fontSize: 18 }}>{r.icon}</span><span className="row-title">{r.title}</span></div>
              <div className="dim" style={{ fontSize: 13, margin: '6px 0 8px' }}>{r.text}</div>
              <Explain factors={r.factors} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
