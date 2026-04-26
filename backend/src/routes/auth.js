'use strict';

const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const { v4: uuid } = require('uuid');
const db         = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const SALT_ROUNDS        = 12;
const JWT_SECRET         = process.env.JWT_SECRET || 'CHANGE-ME';
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000;

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

// ── Helpers ─────────────────────────────────────────
function issueToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').toLowerCase());
}

function passwordError(pw) {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-zA-Z]/.test(pw)) return 'Password must contain at least one letter.';
  if (!/[0-9]/.test(pw))    return 'Password must contain at least one number.';
  return null;
}

// ── REGISTER ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !isValidEmail(email))
    return res.status(400).json({ error: 'Invalid email' });

  const pwErr = passwordError(password);
  if (pwErr) return res.status(400).json({ error: pwErr });

  const existing = await db.get(
    'SELECT id FROM users WHERE lower(email) = lower(?)',
    [String(email)]
  );

  if (existing)
    return res.status(409).json({ error: 'Email already exists' });

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const id   = uuid();
  const now  = new Date().toISOString();

  await db.run(
    `INSERT INTO users (id, email, name, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      String(id),
      String(email.toLowerCase().trim()),
      String(name || ''),
      String(hash),
      String(now)
    ]
  );

  const token = issueToken(id);

  return res.cookie('toneiq_token', token, COOKIE_OPTS)
    .status(201)
    .json({ user: { id, email, name } });
});

// ── LOGIN ───────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password)
    return res.status(400).json({ error: 'Email & password required' });

  const user = await db.get(
    `SELECT id, email, name, password_hash FROM users WHERE lower(email)=lower(?)`,
    [String(email)]
  );

  const sentinel = '$2b$12$invalidhashXXXXXXXXXXXXXXXXXXXXXXXX';
  const match = await bcrypt.compare(password, user?.password_hash || sentinel);

  if (!user || !match)
    return res.status(401).json({ error: 'Invalid credentials' });

  await db.run(
    'UPDATE users SET last_login_at = ? WHERE id = ?',
    [new Date().toISOString(), String(user.id)]
  );

  const token = issueToken(user.id);

  return res.cookie('toneiq_token', token, COOKIE_OPTS)
    .json({ user: { id: user.id, email: user.email, name: user.name } });
});

// ── LOGOUT ──────────────────────────────────────────
router.post('/logout', (_req, res) => {
  return res.clearCookie('toneiq_token', { ...COOKIE_OPTS, maxAge: 0 })
    .json({ loggedOut: true });
});

// ── ME ──────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  const user = await db.get(
    'SELECT id, email, name FROM users WHERE id = ?',
    [String(req.userId)]
  );

  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({ user });
});

// ── FORGOT PASSWORD ─────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};

  if (!email || !isValidEmail(email))
    return res.status(400).json({ error: 'Invalid email' });

  const user = await db.get(
    'SELECT id FROM users WHERE lower(email)=lower(?)',
    [String(email)]
  );

  if (!user)
    return res.json({ message: 'If email exists, link sent' });

  const rawToken  = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires   = new Date(Date.now() + RESET_TOKEN_EXPIRY).toISOString();

  await db.run(
    'UPDATE users SET reset_token=?, reset_token_expires=? WHERE id=?',
    [String(tokenHash), String(expires), String(user.id)]
  );

  const resetLink = `http://localhost:5173/reset-password?token=${rawToken}`;
  console.log('[auth] Reset link:', resetLink);

  return res.json({ message: 'Reset link sent', _devResetLink: resetLink });
});

// ── RESET PASSWORD ─────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};

  if (!token)
    return res.status(400).json({ error: 'Token required' });

  const pwErr = passwordError(password);
  if (pwErr) return res.status(400).json({ error: pwErr });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now = new Date().toISOString();

  const user = await db.get(
    `SELECT id FROM users WHERE reset_token=? AND reset_token_expires > ?`,
    [String(tokenHash), String(now)]
  );

  if (!user)
    return res.status(400).json({ error: 'Invalid or expired token' });

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  await db.run(
    `UPDATE users SET password_hash=?, reset_token=NULL, reset_token_expires=NULL WHERE id=?`,
    [String(hash), String(user.id)]
  );

  return res.json({ message: 'Password updated successfully' });
});

module.exports = router;