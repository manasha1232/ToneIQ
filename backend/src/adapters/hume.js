'use strict';
const fetch = require('node-fetch');

// ─────────────────────────────────────────────
// Enhanced Rule-Based Scoring (fallback)
// ─────────────────────────────────────────────
function mockToneScore(transcript) {
  const lower  = (transcript || '').toLowerCase().trim();
  const words  = lower.split(/\s+/).filter(Boolean);
  const wcount = words.length;
  let score    = 72;

  const positives = [
    { w: ['understand', 'understood'],                        val: +6 },
    { w: ['apologize', 'apologies', 'sorry'],                 val: +5 },
    { w: ['my responsibility', 'my fault', 'i take'],         val: +8 },
    { w: ['plan', 'next time', 'going forward', 'prevent'],   val: +7 },
    { w: ['together', 'collaborate', 'work with'],            val: +5 },
    { w: ['i will', "i'll", 'i commit'],                      val: +6 },
    { w: ['appreciate', 'thank', 'grateful'],                 val: +4 },
    { w: ['learn', 'improve', 'better'],                      val: +5 },
    { w: ['solution', 'propose', 'suggest'],                  val: +6 },
  ];

  const negatives = [
    { w: ["i don't care", 'i dont care', 'dont care'],        val: -35 },
    { w: ['shut up', 'back off', 'leave me'],                 val: -40 },
    { w: ['you always', 'you never'],                         val: -18 },
    { w: ['not my fault', "it's not my"],                     val: -18 },
    { w: ['whatever', 'who cares', "doesn't matter"],         val: -15 },
    { w: ['ridiculous', 'stupid', "that's dumb"],             val: -20 },
    { w: ["i guess", "i don't know", 'if you say'],           val: -10 },
    { w: ['too much work', 'too busy', 'no time'],            val: -10 },
    { w: ['fine whatever', 'ok fine'],                        val: -10 },
  ];

  for (const p of positives) {
    if (p.w.some(w => lower.includes(w))) score += p.val;
  }
  for (const n of negatives) {
    if (n.w.some(w => lower.includes(w))) score += n.val;
  }

  if (wcount <= 2) score -= 15;
  else if (wcount <= 4) score -= 8;
  else if (wcount >= 15) score += 5;

  if (lower.includes('?')) score += 4;

  return Math.max(5, Math.min(100, Math.round(score)));
}

// ─────────────────────────────────────────────
// Hume API (Correct v0 Batch API)
// ─────────────────────────────────────────────
async function callHume(transcript) {
  // STEP 1: Submit job
  const submitRes = await fetch('https://api.hume.ai/v0/batch/jobs', {
    method: 'POST',
    headers: {
      'X-Hume-Api-Key': process.env.HUME_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      models: {
        language: { granularity: 'sentence' }
      },
      text: [transcript],
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Hume submit ${submitRes.status}: ${err.slice(0, 100)}`);
  }

  const job = await submitRes.json();
  const jobId = job.job_id;

  if (!jobId) {
    throw new Error('Hume: no job_id returned');
  }

  // STEP 2: Poll results
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise(r => setTimeout(r, 700));

    const pollRes = await fetch(
      `https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`,
      {
        headers: {
          'X-Hume-Api-Key': process.env.HUME_API_KEY,
        },
      }
    );

    if (!pollRes.ok) continue;

    const data = await pollRes.json();

    const emotions =
      data?.[0]?.results?.predictions?.[0]
        ?.models?.language?.grouped_predictions?.[0]
        ?.predictions?.[0]?.emotions;

    if (!emotions || !emotions.length) continue;

    const get = (name) =>
      emotions.find(e => e.name === name)?.score || 0;

    // Tone calculation
    const raw =
      get('Calmness')      * 25 +
      get('Concentration') * 15 +
      get('Determination') * 20 +
      get('Interest')      * 10 +
      get('Satisfaction')  * 8  -
      get('Anger')         * 30 -
      get('Contempt')      * 25 -
      get('Disgust')       * 20 -
      get('Distress')      * 15 -
      get('Annoyance')     * 12;

    // Normalize → 5–100
    const toneScore = Math.max(
      5,
      Math.min(100, Math.round((raw + 1) * 47.5 + 5))
    );

    const topEmotion = [...emotions].sort((a, b) => b.score - a.score)[0];

    console.log(
      `[hume] Real score: ${toneScore} | Top: ${topEmotion?.name}`
    );

    return {
      toneScore,
      confidence: 0.9,
      source: 'hume',
    };
  }

  throw new Error('Hume: job timed out');
}

// ─────────────────────────────────────────────
// Main function (safe + fallback)
// ─────────────────────────────────────────────
async function analyzeTone(transcript) {
  if (!transcript || !transcript.trim()) {
    return { toneScore: 5, confidence: 0.5, source: 'empty' };
  }

  if (process.env.HUME_API_KEY) {
    try {
      return await callHume(transcript);
    } catch (err) {
      console.error('[hume] Error → fallback:', err.message);
    }
  } else {
    console.log('[hume] No API key — using mock');
  }

  const toneScore = mockToneScore(transcript);

  console.log(`[hume] Mock score: ${toneScore}`);

  return {
    toneScore,
    confidence: 0.7,
    source: 'mock',
  };
}

module.exports = { analyzeTone };