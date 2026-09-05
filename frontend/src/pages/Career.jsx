import React, { useEffect, useState } from 'react';
import { Briefcase, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../api.js';
import { BUCKET_COLOR, Panel, ProgressBar, bucketOf } from '../components.jsx';

export default function Career({ token, onGoalSet }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setData(await api.careerMatches(token));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, [token]);

  async function setGoal(careerId) {
    await api.setCareerGoal(token, careerId);
    await load();
    onGoalSet && onGoalSet();
  }

  if (error) return <div style={{ color: 'var(--error)' }}>{error}</div>;
  if (!data) return <div className="dim mono">loading career matches…</div>;

  return (
    <div className="stack-lg">
      <Panel title="AI Career Match" icon={<Briefcase size={16} color="var(--number)" />}>
        <div className="dim" style={{ fontSize: 13, marginBottom: 10 }}>Computed from your mastery across each role's weighted skill requirements.</div>
        <div className="stack-md">
          {data.matches.map((m) => (
            <CareerCard key={m.career.id} m={m} isGoal={data.career_goal === m.career.id} onSetGoal={() => setGoal(m.career.id)} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function CareerCard({ m, isGoal, onSetGoal }) {
  const [open, setOpen] = useState(false);
  const { career, score, gaps } = m;

  return (
    <div className={`career-card${isGoal ? ' is-goal' : ''}`}>
      <div className="career-head" onClick={() => setOpen((o) => !o)}>
        <div>
          <div className="row-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {career.name} {isGoal && <span className="chip chip-accent">Current goal</span>}
          </div>
          <div className="dim" style={{ fontSize: 12 }}>{career.blurb}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="stat-num" style={{ fontSize: 22 }}>{score}<span className="stat-unit">%</span></div>
          {open ? <ChevronDown size={16} className="dim" /> : <ChevronRight size={16} className="dim" />}
        </div>
      </div>
      <ProgressBar value={score} colorVar="var(--number)" />
      {open && (
        <div style={{ marginTop: 12 }}>
          <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>Required skills vs your mastery</div>
          <ul className="list">
            {gaps.map((g) => (
              <li key={g.concept.id} className="list-row">
                <div className="row-title" style={{ fontSize: 13 }}>{g.concept.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 160 }}>
                  <ProgressBar value={g.mastery} colorVar={BUCKET_COLOR[bucketOf(g.mastery)]} height={6} />
                  <span className="mono dim" style={{ fontSize: 11, width: 34 }}>{g.mastery}%</span>
                </div>
              </li>
            ))}
          </ul>
          <button className="btn-primary" style={{ marginTop: 10 }} onClick={(e) => { e.stopPropagation(); onSetGoal(); }} disabled={isGoal}>
            {isGoal ? 'This is your goal' : 'Set as career goal'}
          </button>
        </div>
      )}
    </div>
  );
}
