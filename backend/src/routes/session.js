'use strict';
const express = require('express');
const { startSession, processTurn, getReport } = require('../services/session');

const router = express.Router();

// POST /api/session/start
router.post('/start', async (req, res) => {
  const { scenarioId, scenarioText } = req.body;
  if (!scenarioId) return res.status(400).json({ error: 'scenarioId required' });

  // Get user ID from cookie/auth if available, else anonymous
  const userId = req.userId || req.body.userId || 'anonymous';

  const result = await startSession({ userId, scenarioId, scenarioText });
  res.json(result);
});

// POST /api/session/turn
router.post('/turn', async (req, res) => {
  const { sessionId, transcript, turnIndex } = req.body;

  console.log('[turn] sessionId:', sessionId);
  console.log('[turn] transcript received:', transcript ? `"${String(transcript).slice(0, 80)}"` : 'NONE');

  if (!sessionId)          return res.status(400).json({ error: 'sessionId required' });
  if (!transcript?.trim()) return res.status(400).json({ error: 'transcript required' });

  const result = await processTurn({
    sessionId,
    transcript: String(transcript).trim(),
    turnIndex:  parseInt(turnIndex) || 0,
  });
  res.json(result);
});

// GET /api/session/:id/report
router.get('/:id/report', async (req, res) => {
  const report = await getReport(req.params.id);
  if (!report) return res.status(404).json({ error: 'Session not found' });
  res.json(report);
});

module.exports = router;