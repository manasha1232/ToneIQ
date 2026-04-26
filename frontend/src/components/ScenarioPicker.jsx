import React, { useState } from 'react';

const CATS = ['All', 'Workplace', 'Career', 'Relationships'];

export default function ScenarioPicker({ scenarios, onStart }) {
  const [cat, setCat] = useState('All');
  const filtered = cat === 'All' ? scenarios : scenarios.filter(s => s.cat === cat);

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {CATS.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 500,
              background:   cat === c ? 'var(--accent)' : 'var(--surface)',
              color:        cat === c ? '#fff'          : 'var(--muted)',
              border:       cat === c ? 'none'          : '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Scenario grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(s => (
          <div
            key={s.id}
            className="card"
            style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            onClick={() => onStart(s)}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{s.cat}</div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{s.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>
              {s.text.slice(0, 90)}…
            </p>
            <button className="btn-primary" style={{ width: '100%' }}>
              Start practice →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
