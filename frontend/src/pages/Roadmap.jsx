import React, { useEffect, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { api } from '../api.js';
import { MasteryPill, Panel, bucketOf } from '../components.jsx';

export default function Roadmap({ token, setTab }) {
  const [data, setData] = useState(null);

  useEffect(() => { api.roadmap(token).then(setData); }, [token]);

  if (!data) return <div className="dim mono">loading roadmap…</div>;

  if (!data.career_goal) {
    return (
      <Panel title="Your Roadmap" icon={<MapIcon size={16} color="var(--keyword)" />}>
        <div className="empty" style={{ padding: '24px 0' }}>
          No career goal set yet. Pick one on the Career AI tab and your roadmap generates automatically.
          <div style={{ marginTop: 12 }}><button className="btn-primary" onClick={() => setTab('career')}>Go to Career AI</button></div>
        </div>
      </Panel>
    );
  }

  return (
    <div className="stack-lg">
      <Panel title="Roadmap" icon={<MapIcon size={16} color="var(--keyword)" />}>
        <div className="dim" style={{ fontSize: 13 }}>Generated from the prerequisite chain of every skill your goal role needs, ordered by dependency and difficulty.</div>
      </Panel>
      <div className="timeline">
        {data.months.map((m) => (
          <div key={m.month} className="timeline-row">
            <div className="timeline-marker"><span className="mono">M{m.month}</span></div>
            <div className="timeline-card">
              {m.concepts.map((c) => (
                <div key={c.id} className="timeline-concept">
                  <span className={`dot ${c.is_project ? '' : bucketOf(c.mastery)}`} style={c.is_project ? { background: 'var(--number)' } : undefined} />
                  <div>
                    <div className="row-title" style={{ fontSize: 14 }}>{c.name}</div>
                    <div className="dim" style={{ fontSize: 12 }}>{c.blurb}</div>
                  </div>
                  {!c.is_project && <MasteryPill mastery={c.mastery ?? 0} />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
