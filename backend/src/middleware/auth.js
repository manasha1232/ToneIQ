'use strict';
/**
 * Auth middleware — verifies httpOnly JWT cookie on protected routes.
 * Attaches req.userId for downstream handlers.
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function requireAuth(req, res, next) {
  const token = req.cookies?.toneiq_token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    // Token expired or tampered with
    res.clearCookie('toneiq_token');
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

module.exports = { requireAuth };
