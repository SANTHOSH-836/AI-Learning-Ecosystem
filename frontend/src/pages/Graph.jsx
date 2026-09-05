import React, { useEffect, useMemo, useState } from 'react';
import { GitBranch, Search, X } from 'lucide-react';
import { api } from '../api.js';
import { BUCKET_COLOR, BUCKET_LABEL, MasteryPill, Panel, bucketOf } from '../components.jsx';

export default function Graph({ token, refreshKey }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { api.graph(token).then(setData); }, [token, refreshKey]);

  const concepts = data?.concepts || [];
  const maxLevel = useMemo(() => (concepts.length ? Math.max(...concepts.map((c) => c.level)) : 0), [concepts]);
  const levels = useMemo(() => {
    const arr = Array.from({ length: maxLevel + 1 }, () => []);
    concepts.forEach((c) => arr[c.level].push(c));
    return arr;
  }, [concepts, maxLevel]);
  const positions = useMemo(() => {
    const pos = {};
    const colW = 190;
    const rowH = 100;
    const padX = 90;
    const padY = 50;
    levels.forEach((row, li) => {
      row.forEach((c, ri) => {
        pos[c.id] = { x: padX + li * colW, y: padY + ri * rowH + (6 - row.length) * (rowH / 2 * 0.35) };
      });
    });
    return pos;
  }, [levels]);
  const width = 90 + maxLevel * 190 + 170;
  const height = 50 + 6 * 100 + 60;

  const byId = useMemo(() => Object.fromEntries(concepts.map((c) => [c.id, c])), [concepts]);
  function descendants(id) { return concepts.filter((c) => c.prereqs.includes(id)).map((c) => c.id); }
  function matchesSearch(c) { return search.trim().length > 0 && c.name.toLowerCase().includes(search.toLowerCase()); }

  if (!data) return <div className="dim mono">loading knowledge graph…</div>;
  const sel = selected ? byId[selected] : null;

  return (
    <div className="stack-lg">
      <div className="graph-toolbar">
        <div className="search-box">
          <Search size={14} className="dim" />
          <input placeholder="Search concepts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="legend">
          {Object.entries(BUCKET_LABEL).map(([k, label]) => (
            <span key={k} className="legend-item"><i style={{ background: BUCKET_COLOR[k] }} />{label}</span>
          ))}
        </div>
      </div>

      <div className="graph-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ minWidth: width * 0.6 }}>
          {concepts.map((c) => c.prereqs.map((p) => {
            const a = positions[p];
            const b = positions[c.id];
            if (!a || !b) return null;
            const midX = (a.x + b.x) / 2 + 78;
            return (
              <path
                key={`${p}-${c.id}`}
                d={`M ${a.x + 156} ${a.y + 26} C ${midX} ${a.y + 26}, ${midX} ${b.y + 26}, ${b.x} ${b.y + 26}`}
                fill="none"
                stroke="var(--border)"
                strokeWidth="1.5"
              />
            );
          }))}
          {concepts.map((c) => {
            const p = positions[c.id];
            const m = c.mastery || 0;
            const b = bucketOf(m);
            const isSel = selected === c.id;
            const isMatch = matchesSearch(c);
            return (
              <g key={c.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => setSelected(c.id)}>
                <rect
                  width="156" height="52" rx="9"
                  fill="var(--bg-elevated)"
                  stroke={isSel ? 'var(--keyword)' : isMatch ? 'var(--function)' : 'var(--border)'}
                  strokeWidth={isSel || isMatch ? 2.5 : 1}
                />
                <rect width="5" height="52" rx="2" fill={BUCKET_COLOR[b]} />
                <foreignObject x="12" y="4" width="136" height="44">
                  <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontFamily: 'Inter, sans-serif', fontSize: 11.5, lineHeight: 1.25, color: 'var(--text)', overflow: 'hidden' }}>
                    {c.name}
                  </div>
                </foreignObject>
                <text x="136" y="45" textAnchor="end" fontSize="10" className="mono" fill={BUCKET_COLOR[b]}>{m}%</text>
              </g>
            );
          })}
        </svg>
      </div>

      {sel && (
        <Panel title={sel.name} icon={<GitBranch size={16} color="var(--keyword)" />} right={<button className="btn-ghost" onClick={() => setSelected(null)}><X size={14} /></button>}>
          <div className="grid-2">
            <div>
              <p className="dim" style={{ fontSize: 13 }}>{sel.blurb}</p>
              <div className="stack-sm" style={{ marginTop: 10 }}>
                <div className="kv"><span>Mastery</span><MasteryPill mastery={sel.mastery || 0} /></div>
                <div className="kv"><span>Difficulty</span><span className="mono">{'★'.repeat(sel.diff)}{'☆'.repeat(5 - sel.diff)}</span></div>
                <div className="kv"><span>Last studied</span><span className="mono">{sel.last_studied ? new Date(sel.last_studied).toLocaleDateString() : 'never'}</span></div>
              </div>
            </div>
            <div>
              <div className="dim" style={{ fontSize: 12, marginBottom: 4 }}>Prerequisites</div>
              <div className="chip-row">
                {sel.prereqs.length ? sel.prereqs.map((p) => <span key={p} className="chip">{byId[p]?.name || p}</span>) : <span className="dim" style={{ fontSize: 12 }}>None — foundational</span>}
              </div>
              <div className="dim" style={{ fontSize: 12, margin: '10px 0 4px' }}>Unlocks</div>
              <div className="chip-row">
                {descendants(sel.id).length ? descendants(sel.id).map((d) => <span key={d} className="chip">{byId[d]?.name || d}</span>) : <span className="dim" style={{ fontSize: 12 }}>Nothing downstream yet</span>}
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
