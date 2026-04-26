'use strict';
const { v4: uuid } = require('uuid');
const db           = require('../db');
const { getAiReply, getBetterResponse } = require('../adapters/ai');
const { analyzeTone }                   = require('../adapters/hume');
const { scoreText }                     = require('./ruleEngine');

const MAX_TURNS = 6;

async function startSession({ userId, scenarioId, scenarioText }) {
  const id  = uuid();
  const now = new Date().toISOString();
  await db.run(
    'INSERT INTO sessions (id, user_id, scenario_id, status, started_at) VALUES (?, ?, ?, ?, ?)',
    [id, userId || 'anonymous', scenarioId, 'active', now]
  );
  return { sessionId: id, scenarioText, maxTurns: MAX_TURNS };
}

async function processTurn({ sessionId, transcript, turnIndex }) {
  if (!transcript?.trim()) {
    throw Object.assign(new Error('Empty transcript — nothing was transcribed.'), { status: 400 });
  }
  const text = transcript.trim();

  // 1. Rule engine + tone analysis in parallel
  const [ruleResult, toneResult] = await Promise.all([
    Promise.resolve(scoreText(text)),
    analyzeTone(text),
  ]);

  // 2. Composite score: 60% tone, 40% clarity
  const clarityNorm = (ruleResult.clarityScore / 5) * 100;
  const toneScore   = Math.round(toneResult.toneScore * 0.6 + clarityNorm * 0.4);

  // 3. History for AI context
  const history = await db.all(
    'SELECT user_transcript, ai_response FROM turns WHERE session_id = ? ORDER BY turn_index',
    [sessionId]
  );

  // 4. AI reply
  const session = await db.get('SELECT scenario_id FROM sessions WHERE id = ?', [sessionId]);
  const aiReply = await getAiReply(session?.scenario_id || '', history);

  // 5. Better response suggestion
  let betterResponse = null;
  if (ruleResult.issue) {
    betterResponse = await getBetterResponse(
      session?.scenario_id || '', text, ruleResult.issue
    );
  }

  // 6. Persist turn
  const turnId = uuid();
  const now    = new Date().toISOString();
  await db.run(
    `INSERT INTO turns
       (id, session_id, turn_index, user_transcript, ai_response,
        tone_score, blame_flag, clarity_score,
        feedback_issue, feedback_impact, feedback_better, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      turnId, sessionId, parseInt(turnIndex), text, aiReply,
      toneScore, ruleResult.blameFlag ? 1 : 0, ruleResult.clarityScore,
      ruleResult.issue, ruleResult.impact, betterResponse, now,
    ]
  );

  // 7. Mark complete if last turn
  const isLast = (parseInt(turnIndex) + 1) >= MAX_TURNS;
  if (isLast) {
    await db.run(
      "UPDATE sessions SET status = 'complete', completed_at = ? WHERE id = ?",
      [now, sessionId]
    );
  }

  return {
    transcript: text,
    aiReply,
    audioBase64: null,
    feedback: {
      toneScore,
      blameFlag:     ruleResult.blameFlag,
      clarityScore:  ruleResult.clarityScore,
      issue:         ruleResult.issue,
      impact:        ruleResult.impact,
      suggestion:    ruleResult.suggestion,
      betterResponse,
    },
    isComplete: isLast,
    turnIndex,
  };
}

async function getReport(sessionId) {
  const session = await db.get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
  if (!session) return null;
  const turns   = await db.all(
    'SELECT * FROM turns WHERE session_id = ? ORDER BY turn_index', [sessionId]
  );
  const scores   = turns.map(t => t.tone_score).filter(v => v != null);
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const issues   = turns.map(t => t.feedback_issue).filter(Boolean);
  return { session, turns, avgScore, topIssues: [...new Set(issues)] };
}

module.exports = { startSession, processTurn, getReport };