'use strict';
const express = require('express');
const db      = require('../db');
const router  = express.Router();

// DELETE /api/user/:id/data — privacy delete
router.delete('/:id/data', async (req, res) => {
  const userId = req.params.id;
  const sessions = await db.all('SELECT id FROM sessions WHERE user_id = ?', [userId]);
  for (const s of sessions) {
    await db.run('DELETE FROM turns WHERE session_id = ?', [s.id]);
  }
  await db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
  await db.run('DELETE FROM users WHERE id = ?', [userId]);
  res.json({ deleted: true, userId, deletedAt: new Date().toISOString() });
});

module.exports = router;