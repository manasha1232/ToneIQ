import React from 'react';
import ScenarioPicker from '../components/ScenarioPicker';

const SCENARIOS = [
  {
    id:      'missed-deadline',
    cat:     'Workplace',
    aiLabel: 'AI Manager',
    title:   'Missed Deadline',
    text:    'Your manager opens the 1:1 with: "You missed the deadline we agreed on last week. What happened?"',
    icon:    '📋',
  },
  {
    id:      'salary-negotiation',
    cat:     'Career',
    aiLabel: 'AI Recruiter',
    title:   'Salary Negotiation',
    text:    'Your recruiter says: "The budget for this role is fixed at ₹12L. There\'s really no room to move."',
    icon:    '💼',
  },
  {
    id:      'conflict-partner',
    cat:     'Relationships',
    aiLabel: 'AI Partner',
    title:   'Recurring Argument',
    text:    'Your partner says: "You always cancel plans at the last minute. It makes me feel like I\'m not a priority."',
    icon:    '💬',
  },
  {
    id:      'harsh-feedback',
    cat:     'Workplace',
    aiLabel: 'AI Colleague',
    title:   'Harsh Feedback',
    text:    'Your senior colleague says in a team meeting: "This work isn\'t up to standard. Did you even review it before submitting?"',
    icon:    '🗣️',
  },
  {
    id:      'unfair-blame',
    cat:     'Workplace',
    aiLabel: 'AI Team Lead',
    title:   'Unfair Blame',
    text:    'Your team lead says: "The client complained. You were the last one to touch this — what did you do?"',
    icon:    '⚡',
  },
  {
    id:      'interview-pressure',
    cat:     'Career',
    aiLabel: 'AI Interviewer',
    title:   'Interview Under Pressure',
    text:    'Interviewer: "Your resume shows you left your last job after 4 months. That\'s a red flag for us. Why should we trust your commitment?"',
    icon:    '🎯',
  },
];

export default function Home({ user, onStart, onLogout, onDashboard }) {
  const displayName = user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 40,
      }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          👋 Hey, <span style={{ color: 'var(--text)', fontWeight: 500 }}>{displayName}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onDashboard}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 8, padding: '7px 14px',
              fontSize: 13, color: 'var(--accent)', cursor: 'pointer',
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={onLogout}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 8, padding: '7px 14px',
              fontSize: 13, color: 'var(--muted)', cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎤</div>
        <h1 style={{ fontSize: 32, fontWeight: 600, marginBottom: 8 }}>ToneIQ</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 440, margin: '0 auto' }}>
          Practice difficult conversations with AI before they happen in real life.
        </p>
      </div>

      <ScenarioPicker scenarios={SCENARIOS} onStart={onStart} />
    </div>
  );
}
