import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';

// ─── tiny fetch helper (always sends cookie) ──────────────────────────────────
const apiFetch = (path) =>
  fetch(`${API}${path}`, { credentials: 'include' }).then(r => r.json());

// ─── colour helpers ───────────────────────────────────────────────────────────
function scoreColor(s) {
  if (s == null) return 'var(--muted)';
  if (s >= 70)   return 'var(--success)';
  if (s >= 45)   return 'var(--warn)';
  return 'var(--danger)';
}

function scoreLabel(s) {
  if (s == null) return '—';
  if (s >= 70)   return 'Strong';
  if (s >= 45)   return 'Improving';
  return 'Needs work';
}

const SCENARIO_NAMES = {
  'missed-deadline':    'Missed Deadline',
  'salary-negotiation': 'Salary Negotiation',
  'conflict-partner':   'Recurring Argument',
  'harsh-feedback':     'Harsh Feedback',
  'unfair-blame':       'Unfair Blame',
  'interview-pressure': 'Interview Pressure',
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function Dashboard({ user, onBack, onViewSession }) {
  const [stats,     setStats]     = useState(null);
  const [trends,    setTrends]    = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [issues,    setIssues]    = useState(null);
  const [history,   setHistory]   = useState(null);
  const [tab,       setTab]       = useState('overview'); // overview | history

  useEffect(() => {
    Promise.all([
      apiFetch('/api/dashboard/stats'),
      apiFetch('/api/dashboard/trends?days=30'),
      apiFetch('/api/dashboard/breakdown'),
      apiFetch('/api/dashboard/issues'),
      apiFetch('/api/dashboard/history?limit=10'),
    ]).then(([s, t, b, i, h]) => {
      setStats(s);
      setTrends(t);
      setBreakdown(b);
      setIssues(i);
      setHistory(h);
    });
  }, []);

  const loading = !stats || !trends || !breakdown || !issues || !history;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 20px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '8px 14px' }}>
          ← Back
        </button>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>My Dashboard</h2>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
            {user?.name || user?.email}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28,
        background: 'var(--surface)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {['overview', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: tab === t ? 'var(--accent)' : 'transparent',
            color:      tab === t ? '#fff' : 'var(--muted)',
          }}>
            {t === 'overview' ? '📊 Overview' : '🕓 History'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : tab === 'overview' ? (
        <Overview stats={stats} trends={trends} breakdown={breakdown} issues={issues} />
      ) : (
        <History history={history} onViewSession={onViewSession} />
      )}
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────
function Overview({ stats, trends, breakdown, issues }) {
  return (
    <>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <KpiCard icon="🎯" label="Avg Score"       value={stats.avgScore ?? '—'}  sub={scoreLabel(stats.avgScore)}  color={scoreColor(stats.avgScore)} />
        <KpiCard icon="🏆" label="Best Session"    value={stats.bestScore ?? '—'} sub="personal best"               color={scoreColor(stats.bestScore)} />
        <KpiCard icon="📚" label="Sessions"        value={stats.totalSessions}    sub="completed"                   color="var(--accent)" />
        <KpiCard icon="🔥" label="Day Streak"      value={stats.streak}           sub={stats.streak === 1 ? 'day' : 'days'} color="var(--warn)" />
        <KpiCard icon="🧘" label="Blame-Free"      value={stats.blameFreeRate != null ? `${stats.blameFreeRate}%` : '—'} sub="of turns" color="var(--success)" />
        <KpiCard icon="✍️"  label="Avg Clarity"    value={stats.avgClarity != null ? `${stats.avgClarity}/5` : '—'} sub="clarity score" color="var(--accent2)" />
      </div>

      {/* Trend chart */}
      {trends.trends.length > 0 && (
        <Section title="Score Trend — last 30 days">
          <TrendChart data={trends.trends} />
        </Section>
      )}

      {/* Category breakdown */}
      {breakdown.breakdown.length > 0 && (
        <Section title="Performance by Category">
          <CategoryBreakdown data={breakdown.breakdown} />
        </Section>
      )}

      {/* Scenario detail */}
      {breakdown.scenarios.length > 0 && (
        <Section title="By Scenario">
          <ScenarioTable rows={breakdown.scenarios} />
        </Section>
      )}

      {/* Top issues */}
      {issues.issues.length > 0 && (
        <Section title="Most Common Issues">
          <IssuesBars data={issues.issues} />
        </Section>
      )}

      {stats.totalSessions === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎤</div>
          <div style={{ fontSize: 15, marginBottom: 8 }}>No sessions yet</div>
          <div style={{ fontSize: 13 }}>Complete your first practice to see stats here.</div>
        </div>
      )}
    </>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────
function History({ history, onViewSession }) {
  if (!history.sessions.length) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🕓</div>
        <div style={{ fontSize: 15 }}>No sessions recorded yet.</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {history.sessions.map((s, i) => {
        const date    = new Date(s.started_at);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const color   = scoreColor(s.avg_score);
        const isLast  = i === history.sessions.length - 1;

        return (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '14px 20px',
            borderBottom: isLast ? 'none' : '1px solid var(--border)',
            cursor: onViewSession ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,106,247,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={() => onViewSession?.(s.id)}
          >
            {/* Score ring */}
            <ScoreRing score={s.avg_score} color={color} />

            {/* Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>
                {SCENARIO_NAMES[s.scenario_id] || s.scenario_id}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {dateStr} · {timeStr} · {s.turn_count} turns
                {s.blame_turns > 0 && (
                  <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                    ⚠️ {s.blame_turns} blame turn{s.blame_turns > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Status */}
            <div style={{ fontSize: 12, color: s.status === 'complete' ? 'var(--success)' : 'var(--muted)' }}>
              {s.status === 'complete' ? '✓ Done' : 'In progress'}
            </div>

            {onViewSession && (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>›</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase',
        letterSpacing: '0.05em', marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  );
}

function ScoreRing({ score, color }) {
  const r = 18, c = 2 * Math.PI * r;
  const pct = score != null ? Math.min(score / 100, 1) : 0;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${pct * c} ${c}`}
        strokeLinecap="round" transform="rotate(-90 22 22)" />
      <text x="22" y="27" textAnchor="middle" fontSize="10" fontWeight="600"
        fill={score != null ? color : 'var(--muted)'}>
        {score ?? '—'}
      </text>
    </svg>
  );
}

function TrendChart({ data }) {
  if (!data.length) return null;
  const W = 680, H = 160, PAD = { t: 12, r: 16, b: 32, l: 40 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const scores = data.map(d => d.avg_score);
  const minS = Math.max(0,   Math.min(...scores) - 10);
  const maxS = Math.min(100, Math.max(...scores) + 10);

  const xOf = (i) => PAD.l + (i / Math.max(data.length - 1, 1)) * iW;
  const yOf = (s) => PAD.t + iH - ((s - minS) / (maxS - minS)) * iH;

  const pts   = data.map((d, i) => `${xOf(i)},${yOf(d.avg_score)}`).join(' ');
  const area  = `M${xOf(0)},${yOf(data[0].avg_score)} ` +
                data.map((d, i) => `L${xOf(i)},${yOf(d.avg_score)}`).join(' ') +
                ` L${xOf(data.length - 1)},${PAD.t + iH} L${xOf(0)},${PAD.t + iH} Z`;

  // Y axis ticks
  const yTicks = [0, 25, 50, 75, 100].filter(v => v >= minS && v <= maxS);

  // X axis: show first, last, and a couple in between
  const xLabels = data.length <= 6
    ? data.map((d, i) => ({ i, label: d.day.slice(5) }))
    : [0, Math.floor(data.length / 3), Math.floor(2 * data.length / 3), data.length - 1]
        .map(i => ({ i, label: data[i].day.slice(5) }));

  return (
    <div className="card" style={{ padding: '16px 8px 8px', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid lines */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yOf(v)} y2={yOf(v)}
              stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
            <text x={PAD.l - 6} y={yOf(v) + 4} textAnchor="end"
              fontSize="10" fill="var(--muted)">{v}</text>
          </g>
        ))}

        {/* Area fill */}
        <path d={area} fill="rgba(124,106,247,0.1)" />

        {/* Line */}
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots + tooltips */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xOf(i)} cy={yOf(d.avg_score)} r="4"
              fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
            <title>{d.day}: {d.avg_score} ({d.sessions} session{d.sessions > 1 ? 's' : ''})</title>
          </g>
        ))}

        {/* X axis labels */}
        {xLabels.map(({ i, label }) => (
          <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle"
            fontSize="10" fill="var(--muted)">{label}</text>
        ))}
      </svg>
    </div>
  );
}

function CategoryBreakdown({ data }) {
  const CAT_ICONS = { Workplace: '💼', Career: '🎯', Relationships: '💬', Other: '📋' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
      {data.map(cat => {
        const color = scoreColor(cat.avg_score);
        const pct   = cat.avg_score != null ? cat.avg_score : 0;
        return (
          <div key={cat.category} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {CAT_ICONS[cat.category] || '📋'} {cat.category}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color }}>
                {cat.avg_score ?? '—'}
              </span>
            </div>
            {/* bar */}
            <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color,
                borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
              {cat.sessions} session{cat.sessions !== 1 ? 's' : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScenarioTable({ rows }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {rows.map((r, i) => {
        const color = scoreColor(r.avg_score);
        const pct   = r.avg_score != null ? r.avg_score : 0;
        return (
          <div key={r.scenario_id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
            borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                {SCENARIO_NAMES[r.scenario_id] || r.scenario_id}
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color,
                  borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 56 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color }}>{r.avg_score ?? '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.sessions}×</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IssuesBars({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ marginBottom: i < data.length - 1 ? 14 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            fontSize: 13, marginBottom: 5 }}>
            <span>{d.issue}</span>
            <span style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
              {d.count}×
            </span>
          </div>
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${(d.count / max) * 100}%`, height: '100%',
              background: 'var(--danger)', borderRadius: 3,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card" style={{
          height: 90, background: 'var(--surface)',
          animation: 'pulse-skeleton 1.4s ease-in-out infinite',
          opacity: 1 - i * 0.08,
        }} />
      ))}
      <style>{`@keyframes pulse-skeleton {
        0%,100% { opacity: 0.5; } 50% { opacity: 1; }
      }`}</style>
    </div>
  );
}
