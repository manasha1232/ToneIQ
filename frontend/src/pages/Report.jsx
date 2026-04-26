import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';

export default function Report({ sessionId, onBack }) {
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/session/${sessionId}/report`)
      .then(r => r.json())
      .then(setReport);
  }, [sessionId]);

  if (!report) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>
      Loading report…
    </div>
  );

  const { avgScore, topIssues, turns } = report;
  const color = avgScore >= 70 ? 'var(--success)' : avgScore >= 45 ? 'var(--warn)' : 'var(--danger)';

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>
      <button onClick={onBack} className="btn-secondary" style={{ marginBottom: 24 }}>← Back to home</button>

      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Session Report</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
        Here's how you communicated in this scenario.
      </p>

      {/* Score */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 64, fontWeight: 700, color }}>{avgScore}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>Average Tone Score</div>
        <div style={{ fontSize: 13, marginTop: 8, color }}>
          {avgScore >= 70 ? '✅ Strong performance' : avgScore >= 45 ? '⚠️ Room to improve' : '❌ Needs work'}
        </div>
      </div>

      {/* Issues */}
      {topIssues.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Top patterns to work on</h3>
          {topIssues.map((issue, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 0',
              borderBottom: i < topIssues.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              <span style={{ color: 'var(--warn)' }}>⚠️</span>
              <span style={{ fontSize: 14 }}>{issue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Turn breakdown */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Turn breakdown</h3>
        {turns.map((t, i) => (
          <div key={i} style={{
            padding: '10px 0',
            borderBottom: i < turns.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Turn {i + 1}</span>
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: t.tone_score >= 70 ? 'var(--success)' : t.tone_score >= 45 ? 'var(--warn)' : 'var(--danger)'
              }}>{t.tone_score ?? '—'}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
              You: "{t.user_transcript}"
            </p>
            {t.feedback_issue && (
              <p style={{ fontSize: 12, color: 'var(--warn)' }}>⚠️ {t.feedback_issue}</p>
            )}
            {t.feedback_better && (
              <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>
                ✅ Better: "{t.feedback_better}"
              </p>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button className="btn-primary" onClick={onBack}>Practice again</button>
      </div>
    </div>
  );
}
