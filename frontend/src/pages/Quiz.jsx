import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, ChevronRight, ListChecks, XCircle } from 'lucide-react';
import { api } from '../api.js';
import { MasteryPill, Panel, ProgressBar } from '../components.jsx';

const TOPICS = [
  ['all', 'All topics (mixed)'], ['syntax_basics', 'Python Syntax & Variables'], ['data_types', 'Data Types'],
  ['operators', 'Operators & Expressions'], ['control_flow', 'Control Flow'], ['strings', 'String Manipulation'],
  ['lists_tuples', 'Lists & Tuples'], ['functions', 'Functions'], ['dicts_sets', 'Dictionaries & Sets'],
  ['comprehensions', 'Comprehensions'], ['exceptions', 'Exception Handling'], ['modules_packages', 'Modules & Packages'],
  ['oop_basics', 'OOP Basics'], ['file_handling', 'File Handling'], ['iterators_generators', 'Iterators & Generators'],
  ['oop_advanced', 'Inheritance & Polymorphism'], ['data_structures_py', 'Data Structures in Python'],
  ['testing_py', 'Testing with pytest'], ['libraries_ecosystem', 'Libraries & Environments'],
  ['decorators', 'Decorators'], ['algorithms_py', 'Algorithms in Python'],
];
const NAMES = Object.fromEntries(TOPICS);

export default function Quiz({ token, preset, clearPreset, onComplete }) {
  const [phase, setPhase] = useState('setup');
  const [topic, setTopic] = useState(preset || 'all');
  const [difficulty, setDifficulty] = useState('all');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [picked, setPicked] = useState(null);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => { if (preset) { setTopic(preset); clearPreset(); } }, [preset]);

  async function start() {
    setError('');
    try {
      const res = await api.quizGenerate(token, topic, difficulty, count);
      setQuestions(res.questions);
      setIdx(0);
      setAnswers([]);
      setPicked(null);
      setPhase('active');
    } catch (e) {
      setError(e.message);
    }
  }

  function selectOpt(i) { if (picked == null) setPicked(i); }

  async function next() {
    const q = questions[idx];
    const newAnswers = [...answers, { concept_id: q.concept_id, correct: picked === q.correct }];
    setAnswers(newAnswers);
    setPicked(null);
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      return;
    }
    try {
      const res = await api.quizSubmit(token, newAnswers);
      setResults(res);
      setPhase('results');
      onComplete && onComplete();
    } catch (e) {
      setError(e.message);
    }
  }

  if (phase === 'setup') {
    return (
      <Panel title="AI Quiz Generator" icon={<ListChecks size={16} color="var(--keyword)" />}>
        <div className="stack-md">
          <div className="form-row">
            <label>Topic</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="all">Any</option>
              <option value="1">1 — Foundational</option>
              <option value="2">2 — Core</option>
              <option value="3">3 — Applied</option>
              <option value="4">4 — Advanced</option>
            </select>
          </div>
          <div className="form-row">
            <label>Number of questions</label>
            <input type="range" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            <span className="mono dim">{count} requested (capped to what's available)</span>
          </div>
          {error && <div style={{ color: 'var(--error)', fontSize: 12 }}>{error}</div>}
          <button className="btn-primary" onClick={start}>Start Quiz</button>
        </div>
      </Panel>
    );
  }

  if (phase === 'active') {
    const q = questions[idx];
    return (
      <Panel title={`Question ${idx + 1} of ${questions.length}`} icon={<ListChecks size={16} color="var(--keyword)" />}>
        <ProgressBar value={(idx / questions.length) * 100} />
        <div className="dim mono" style={{ fontSize: 11, margin: '10px 0 2px' }}>{NAMES[q.concept_id] || q.concept_id}</div>
        <div className="quiz-q">{q.q}</div>
        <div className="stack-sm">
          {q.opts.map((o, i) => {
            let cls = 'quiz-opt';
            if (picked != null) {
              if (i === q.correct) cls += ' correct';
              else if (i === picked) cls += ' incorrect';
            }
            return (
              <button key={i} className={cls} onClick={() => selectOpt(i)}>
                <span>{o}</span>
                {picked != null && i === q.correct && <CheckCircle2 size={16} />}
                {picked != null && i === picked && i !== q.correct && <XCircle size={16} />}
              </button>
            );
          })}
        </div>
        {picked != null && <div className="explain-box">{q.exp}</div>}
        {picked != null && (
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={next}>
            {idx + 1 < questions.length ? 'Next question' : 'See results'}
          </button>
        )}
        {error && <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 8 }}>{error}</div>}
      </Panel>
    );
  }

  return (
    <Panel title="Quiz Results" icon={<Award size={16} color="var(--string)" />}>
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="stat-block"><div className="stat-num">{results.accuracy}<span className="stat-unit">%</span></div><div className="dim">Accuracy</div></div>
        <div className="stat-block"><div className="stat-num">{results.correct}/{results.total}</div><div className="dim">Correct</div></div>
        <div className="stat-block"><div className="stat-num">{Object.keys(results.by_concept).length}</div><div className="dim">Concepts covered</div></div>
      </div>
      <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>Per-concept breakdown — knowledge graph updated automatically</div>
      <ul className="list">
        {Object.entries(results.by_concept).map(([id, r]) => (
          <li key={id} className="list-row">
            <div className="row-title">{NAMES[id] || id}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="dim mono" style={{ fontSize: 12 }}>{r.correct}/{r.total} correct</span>
              <ChevronRight size={12} className="dim" />
              <MasteryPill mastery={Math.round(r.new_mastery)} />
            </div>
          </li>
        ))}
      </ul>
      <button className="btn-primary" style={{ marginTop: 14 }} onClick={() => setPhase('setup')}>Take another quiz</button>
    </Panel>
  );
}
