'use strict';

const express         = require('express');
const db              = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ─────────────────────────────────────────────
// GET /api/dashboard/stats
// ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const uid = req.userId;

  const totalRow = await db.get(
    `SELECT COUNT(*) as count FROM sessions WHERE user_id = ?`,
    [uid]
  );

  const turns = await db.all(
    `SELECT t.tone_score, t.blame_flag, t.clarity_score
     FROM turns t JOIN sessions s ON s.id = t.session_id
     WHERE s.user_id = ?`,
    [uid]
  );

  const scores   = turns.map(t => t.tone_score).filter(v => v != null);
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const sessionAvgs = await db.all(
    `SELECT s.id, AVG(t.tone_score) as avg
     FROM sessions s JOIN turns t ON t.session_id = s.id
     WHERE s.user_id = ?
     GROUP BY s.id`,
    [uid]
  );

  const bestScore = sessionAvgs.length
    ? Math.round(Math.max(...sessionAvgs.map(r => r.avg)))
    : null;

  // streak (based on any session, not only completed)
  const days = await db.all(
    `SELECT DISTINCT date(started_at) as d FROM sessions
     WHERE user_id = ?
     ORDER BY d DESC`,
    [uid]
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < days.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);

    if (days[i].d === expected.toISOString().slice(0, 10)) {
      streak++;
    } else {
      break;
    }
  }

  const blameFree = turns.filter(t => !t.blame_flag).length;
  const blameFreeRate = turns.length
    ? Math.round((blameFree / turns.length) * 100)
    : null;

  const clarityScores = turns.map(t => t.clarity_score).filter(v => v != null);
  const avgClarity = clarityScores.length
    ? parseFloat(
        (clarityScores.reduce((a, b) => a + b, 0) / clarityScores.length).toFixed(1)
      )
    : null;

  const catRows = await db.all(
    `SELECT scenario_id, COUNT(*) as cnt FROM sessions
     WHERE user_id = ?
     GROUP BY scenario_id
     ORDER BY cnt DESC
     LIMIT 1`,
    [uid]
  );

  res.json({
    totalSessions: totalRow?.count || 0,
    avgScore,
    bestScore,
    streak,
    blameFreeRate,
    avgClarity,
    topScenario: catRows[0]?.scenario_id || null,
  });
});

// ─────────────────────────────────────────────
// GET /api/dashboard/history
// ─────────────────────────────────────────────
router.get('/history', async (req, res) => {
  const uid    = req.userId;
  const limit  = Math.min(parseInt(req.query.limit) || 10, 50);
  const offset = parseInt(req.query.offset) || 0;

  const sessions = await db.all(
    `SELECT s.id, s.scenario_id, s.status, s.started_at, s.completed_at,
            AVG(t.tone_score) as avg_score,
            COUNT(t.id) as turn_count
     FROM sessions s
     LEFT JOIN turns t ON t.session_id = s.id
     WHERE s.user_id = ?
     GROUP BY s.id
     ORDER BY s.started_at DESC
     LIMIT ? OFFSET ?`,
    [uid, limit, offset]
  );

  const totalRow = await db.get(
    `SELECT COUNT(*) as count FROM sessions WHERE user_id = ?`,
    [uid]
  );

  res.json({
    sessions: sessions.map(s => ({
      ...s,
      avg_score: s.avg_score != null ? Math.round(s.avg_score) : null,
    })),
    total: totalRow?.count || 0,
    limit,
    offset,
  });
});

// ─────────────────────────────────────────────
// GET /api/dashboard/trends
// ─────────────────────────────────────────────
router.get('/trends', async (req, res) => {
  const uid  = req.userId;
  const days = parseInt(req.query.days) || 30;

  const rows = await db.all(
    `SELECT date(s.started_at) as day,
            ROUND(AVG(t.tone_score), 1) as avg_score,
            COUNT(DISTINCT s.id) as sessions
     FROM sessions s
     JOIN turns t ON t.session_id = s.id
     WHERE s.user_id = ?
       AND s.started_at >= date('now', '-' || ? || ' days')
     GROUP BY day
     ORDER BY day ASC`,
    [uid, days]
  );

  res.json({ trends: rows, days });
});

// ─────────────────────────────────────────────
// GET /api/dashboard/breakdown
// ─────────────────────────────────────────────
router.get('/breakdown', async (req, res) => {
  const uid = req.userId;

  const CAT_MAP = {
    'missed-deadline':    'Workplace',
    'harsh-feedback':     'Workplace',
    'unfair-blame':       'Workplace',
    'salary-negotiation': 'Career',
    'interview-pressure': 'Career',
    'conflict-partner':   'Relationships',
  };

  const rows = await db.all(
    `SELECT s.scenario_id,
            ROUND(AVG(t.tone_score),1) as avg_score,
            COUNT(DISTINCT s.id) as sessions
     FROM sessions s
     JOIN turns t ON t.session_id = s.id
     WHERE s.user_id = ?
     GROUP BY s.scenario_id`,
    [uid]
  );

  const catTotals = {};

  for (const row of rows) {
    const cat = CAT_MAP[row.scenario_id] || 'Other';

    if (!catTotals[cat]) {
      catTotals[cat] = { scores: [], sessions: 0 };
    }

    catTotals[cat].scores.push(row.avg_score);
    catTotals[cat].sessions += row.sessions;
  }

  const breakdown = Object.entries(catTotals).map(([cat, data]) => ({
    category:  cat,
    avg_score: Math.round(
      data.scores.reduce((a, b) => a + b, 0) / data.scores.length
    ),
    sessions: data.sessions,
  }));

  const scenarios = rows.map(r => ({
    scenario_id: r.scenario_id,
    avg_score:   r.avg_score != null ? Math.round(r.avg_score) : null,
    sessions:    r.sessions,
    category:    CAT_MAP[r.scenario_id] || 'Other',
  }));

  res.json({ breakdown, scenarios });
});

// ─────────────────────────────────────────────
// GET /api/dashboard/issues
// ─────────────────────────────────────────────
router.get('/issues', async (req, res) => {
  const uid = req.userId;

  const rows = await db.all(
    `SELECT t.feedback_issue as issue, COUNT(*) as count
     FROM turns t
     JOIN sessions s ON s.id = t.session_id
     WHERE s.user_id = ?
       AND t.feedback_issue IS NOT NULL
       AND t.feedback_issue != ''
     GROUP BY t.feedback_issue
     ORDER BY count DESC
     LIMIT 8`,
    [uid]
  );

  res.json({ issues: rows });
});

module.exports = router;