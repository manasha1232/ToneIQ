'use strict';
require('dotenv').config();
require('express-async-errors');

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const cron         = require('node-cron');
const jwt          = require('jsonwebtoken');
const db           = require('./db');

const sessionRoutes   = require('./routes/session');
const userRoutes      = require('./routes/user');
const authRoutes      = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const { purgeExpiredAudio } = require('./jobs/audioTtl');

const app  = express();
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

// ✅ CORS (important for Vercel)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));

// ── Optional auth middleware ─────────────────────────────
app.use((req, _res, next) => {
  try {
    const token = req.cookies?.toneiq_token;
    if (token) {
      const payload = jwt.verify(token, JWT_SECRET);
      req.userId = payload.sub;
    }
  } catch (_) {}
  next();
});

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/session',   sessionRoutes);
app.use('/api/user',      userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ✅ Health route (Railway needs this)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date() });
});

// ── Error handler ───────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal error'
  });
});

// ── Start server AFTER DB is ready ──────────────────────
db.ensureDb()
  .then(() => {
    console.log('[db] Connected');

    // Run TTL job every minute
    cron.schedule('* * * * *', () => {
      purgeExpiredAudio().catch(console.error);
    });

    // ✅ CRITICAL FIX (Railway needs 0.0.0.0)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 ToneIQ backend running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ DB init failed:', err);
    process.exit(1);
  });

module.exports = app;
