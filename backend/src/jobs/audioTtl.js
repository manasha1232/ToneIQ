'use strict';
/**
 * Audio TTL job — logs purge events.
 * Audio is never stored to disk; this records that the in-memory buffer was discarded.
 */

const { v4: uuid } = require('uuid');
const db = require('../db');

const TTL_SECONDS = parseInt(process.env.AUDIO_TTL_SECONDS || '60');

async function purgeExpiredAudio() {
  try {
    const cutoff = new Date(Date.now() - TTL_SECONDS * 1000).toISOString();

    // ✅ await the query (IMPORTANT)
    const sessions = await db.all(
      `SELECT s.id FROM sessions s
       LEFT JOIN audio_purge_log p ON p.session_id = s.id
       WHERE s.started_at < ? AND p.id IS NULL
       LIMIT 50`,
      [cutoff]
    );

    // ✅ safety check
    if (!Array.isArray(sessions) || sessions.length === 0) {
      console.log('[ttl] No sessions to purge');
      return;
    }

    for (const s of sessions) {
      await db.run(
        'INSERT INTO audio_purge_log (id, session_id, purged_at) VALUES (?, ?, ?)',
        [uuid(), s.id, new Date().toISOString()]
      );
    }

    console.log(`[ttl] Logged audio purge for ${sessions.length} session(s)`);

  } catch (err) {
    console.error('[ttl] Error in purgeExpiredAudio:', err.message);
  }
}

module.exports = { purgeExpiredAudio };