'use strict';
/**
 * STT adapter
 * Browser Web Speech API sends transcript as text directly — no API key needed.
 * Whisper fallback kept only if OPENAI_API_KEY is explicitly set.
 */
const fetch    = require('node-fetch');
const FormData = require('form-data');

async function transcribe(audioBuffer, mimeType = 'audio/webm', directTranscript = null) {
  // Priority 1: direct transcript from browser Web Speech API (always used)
  if (directTranscript && directTranscript.trim()) {
    return directTranscript.trim();
  }

  // Priority 2: Whisper — only if someone explicitly sets OPENAI_API_KEY
  if (process.env.OPENAI_API_KEY) {
    try {
      const form = new FormData();
      form.append('file', audioBuffer, { filename: 'audio.webm', contentType: mimeType });
      form.append('model', 'whisper-1');
      form.append('language', 'en');
      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method:  'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, ...form.getHeaders() },
        body:    form,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) return data.text;
      }
    } catch (e) {
      console.error('[stt] Whisper error:', e.message);
    }
  }

  // Priority 3: nothing received — return empty so feedback still works
  console.log('[stt] No transcript received');
  return '(no speech detected)';
}

module.exports = { transcribe };