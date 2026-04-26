'use strict';
/**
 * TTS adapter — browser SpeechSynthesis handles all TTS (free, no API key, works deployed).
 * Returns null always — frontend checks for null and uses window.speechSynthesis.
 * ElevenLabs code removed to keep the codebase honest about what's actually used.
 */

async function synthesize(_text) {
  // Signal frontend to use browser SpeechSynthesis
  return null;
}

module.exports = { synthesize };