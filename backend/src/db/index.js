'use strict';
/**
 * db/index.js — Turso (hosted SQLite) via @libsql/client.
 *
 * WHY TURSO:
 *  - Your SQL queries are identical to SQLite — zero rewriting
 *  - Free tier: 500 DBs, 9GB storage, 1B row reads/month
 *  - Data survives every redeploy on Railway / Render / Vercel
 *  - Pure JS client — no C++ build tools needed on Windows/ARM
 *
 * LOCAL DEV (no account needed):
 *   TURSO_DB_URL=file:./data/local.db   ← writes a local SQLite file, no token
 *
 * PRODUCTION:
 *   TURSO_DB_URL=libsql://yourdb-you.turso.io
 *   TURSO_DB_TOKEN=eyJ...   (from Turso dashboard → Generate Token)
 */
const { createClient } = require('@libsql/client');

let _client = null;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT '', password_hash TEXT NOT NULL DEFAULT '',
    reset_token TEXT, reset_token_expires TEXT,
    created_at TEXT NOT NULL, last_login_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    scenario_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
    started_at TEXT NOT NULL, completed_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS turns (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL, turn_index INT NOT NULL,
    user_transcript TEXT, ai_response TEXT, tone_score REAL,
    blame_flag INT DEFAULT 0, clarity_score INT,
    feedback_issue TEXT, feedback_impact TEXT, feedback_better TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS progress (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    date TEXT NOT NULL, avg_score REAL, sessions INT DEFAULT 0,
    UNIQUE(user_id, date)
  )`,
  `CREATE TABLE IF NOT EXISTS audio_purge_log (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL, purged_at TEXT NOT NULL
  )`,
];

// Safe migrations — silently skip if column already exists
const MIGRATIONS = [
  `ALTER TABLE users ADD COLUMN name TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN reset_token TEXT`,
  `ALTER TABLE users ADD COLUMN reset_token_expires TEXT`,
  `ALTER TABLE users ADD COLUMN last_login_at TEXT`,
];

function getClient() {
  if (_client) return _client;
  const url = process.env.TURSO_DB_URL;
  if (!url) throw new Error(
    'TURSO_DB_URL not set.\n' +
    '  Local: TURSO_DB_URL=file:./data/local.db\n' +
    '  Prod:  get from https://turso.tech (free)'
  );
  _client = createClient({ url, authToken: process.env.TURSO_DB_TOKEN });
  return _client;
}

function rowsToObjects(result) {
  return result.rows.map(row =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]]))
  );
}

const db = {
  async ensureDb() {
    const client = getClient();
    for (const sql of SCHEMA)     await client.execute(sql);
    for (const sql of MIGRATIONS) { try { await client.execute(sql); } catch (_) {} }
    console.log('[db] Turso ready');
  },

  async run(sql, params = []) {
    await getClient().execute({ sql, args: params });
  },

  async all(sql, params = []) {
    const r = await getClient().execute({ sql, args: params });
    return rowsToObjects(r);
  },

  async get(sql, params = []) {
    const r = await getClient().execute({ sql, args: params });
    if (!r.rows.length) return undefined;
    return Object.fromEntries(r.columns.map((col, i) => [col, r.rows[0][i]]));
  },
};

module.exports = db;
