import React from 'react';

export default function FeedbackCard({ feedback, onNext }) {
  const { toneScore, issue, impact, betterResponse, blameFlag, clarityScore } = feedback;
  const color = toneScore >= 70 ? 'var(--success)' : toneScore >= 45 ? 'var(--warn)' : 'var(--danger)';
  const label = toneScore >= 70 ? 'Good' : toneScore >= 45 ? 'Needs work' : 'Weak';

  return (
    <div className="card" style={{ marginTop: 20, borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>📊 Feedback</span>
        <span style={{ fontSize: 22, fontWeight: 700, color }}>{toneScore} <small style={{ fontSize: 13, color: 'var(--muted)' }}>/ 100</small></span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className={`badge ${toneScore >= 70 ? 'badge-success' : toneScore >= 45 ? 'badge-warn' : 'badge-danger'}`}>
          Tone: {label}
        </span>
        {blameFlag && <span className="badge badge-danger">⚠️ Blame language</span>}
        <span className="badge badge-muted">Clarity: {clarityScore}/5</span>
      </div>

      {issue && (
        <div style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--warn)', fontWeight: 600, marginBottom: 4 }}>❌ Issue</div>
          <div style={{ fontSize: 14 }}>{issue}</div>
        </div>
      )}

      {impact && (
        <div style={{ background: 'rgba(224,90,90,0.07)', border: '1px solid rgba(224,90,90,0.15)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, marginBottom: 4 }}>⚠️ Impact</div>
          <div style={{ fontSize: 14 }}>{impact}</div>
        </div>
      )}

      {betterResponse && (
        <div style={{ background: 'rgba(90,201,138,0.08)', border: '1px solid rgba(90,201,138,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>✅ Try this instead</div>
          <div style={{ fontSize: 14, fontStyle: 'italic' }}>"{betterResponse}"</div>
        </div>
      )}

      {!issue && (
        <div style={{ background: 'rgba(90,201,138,0.08)', border: '1px solid rgba(90,201,138,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: 'var(--success)' }}>✅ Good response — clear, calm, and accountable.</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-secondary" onClick={onNext}>Next turn →</button>
      </div>
    </div>
  );
}
