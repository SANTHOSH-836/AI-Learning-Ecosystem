import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

export function ProgressBar({ value, colorVar = 'var(--keyword)', height = 8 }) {
  return (
    <div style={{ height, background: 'var(--bg-inset)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: colorVar, transition: 'width .5s ease' }} />
    </div>
  );
}

export function bucketOf(mastery) {
  if (mastery == null || mastery <= 0) return 'unstarted';
  if (mastery < 45) return 'weak';
  if (mastery < 75) return 'developing';
  return 'strong';
}

export const BUCKET_COLOR = { unstarted: 'var(--comment)', weak: 'var(--error)', developing: 'var(--function)', strong: 'var(--string)' };
export const BUCKET_LABEL = { unstarted: 'Not started', weak: 'Weak', developing: 'Developing', strong: 'Strong' };

export function MasteryPill({ mastery }) {
  const b = bucketOf(mastery);
  return (
    <span
      className="mono"
      style={{
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 999,
        background: `color-mix(in srgb, ${BUCKET_COLOR[b]} 18%, transparent)`,
        color: BUCKET_COLOR[b],
        border: `1px solid color-mix(in srgb, ${BUCKET_COLOR[b]} 45%, transparent)`,
      }}
    >
      {mastery}%
    </span>
  );
}

export function Panel({ title, icon, right, children, style }) {
  return (
    <div className="panel" style={style}>
      {(title || right) && (
        <div className="panel-head">
          <div className="panel-title">{icon}{title}</div>
          {right}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </div>
  );
}

export function Explain({ factors }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="link-btn" onClick={() => setOpen((o) => !o)}>
        <Info size={12} /> Why am I seeing this? {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && (
        <ul className="explain-list mono">
          {factors.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      )}
    </div>
  );
}
