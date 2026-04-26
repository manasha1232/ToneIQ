'use strict';
/**
 * AI adapter — Groq primary, mock fallback (stable version)
 */

const fetch = require('node-fetch');

const SYSTEM_PROMPT = `You are a realistic conversation partner in a communication-skills training app called ToneIQ.
React naturally to what the user says — like a real manager, colleague, or interviewer would.
Keep replies to 1-3 sentences. Be direct but fair.
GUARDRAILS:
- Do NOT give medical, legal, financial or therapeutic advice.
- Do NOT roleplay violence or self-harm scenarios.
- If the user seems distressed say: "I notice this may be difficult. Please reach out to a trusted person if you need support."`;

const MOCK_AI_RESPONSES = [
  "That's not good enough. You should have flagged the issue earlier so we could plan around it.",
  "I understand things get busy, but deadlines exist for a reason. What's your plan to prevent this next time?",
  "I appreciate you acknowledging it. What specifically will you do differently going forward?",
  "That's a fair point. Let's figure out how to prevent this together.",
  "Okay, I hear you. Let's set up a check-in earlier in the project next time.",
];

// 🔁 GROQ CALL with fallback models
async function callGroq(prompt, preferredModel) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const MODELS = [
    preferredModel,
    'llama-3.3-70b-versatile',  // ✅ current best
    'llama-3.1-8b-instant'      // ✅ fallback fast
  ];

  for (const model of MODELS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.log(`[ai] Model failed: ${model}`);
        continue;
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim();

      if (reply) {
        console.log(`[ai] Groq OK using ${model}`);
        return reply;
      }

    } catch (e) {
      console.log(`[ai] Error with ${model}:`, e.message);
    }
  }

  throw new Error('All Groq models failed');
}

function buildPrompt(scenario, conversationHistory) {
  let prompt = `Scenario: ${scenario}\n\n`;

  if (conversationHistory.length > 0) {
    prompt += 'Conversation so far:\n';
    for (const t of conversationHistory) {
      if (t.user_transcript) prompt += `User: ${t.user_transcript}\n`;
      if (t.ai_response)     prompt += `You: ${t.ai_response}\n`;
    }
    prompt += '\n';
  }

  prompt += 'Respond naturally as the other person (1-3 sentences only):';
  return prompt;
}

// 🧠 MAIN AI
async function getAiReply(scenario, conversationHistory) {
  if (process.env.GROQ_API_KEY) {
    try {
      const reply = await callGroq(
        buildPrompt(scenario, conversationHistory),
        'llama-3.3-70b-versatile' // ✅ updated
      );
      if (reply) return reply;
    } catch (e) {
      console.error('[ai] Groq error:', e.message);
    }
  }

  console.log('[ai] Using mock response');
  return MOCK_AI_RESPONSES[Math.floor(Math.random() * MOCK_AI_RESPONSES.length)];
}

// ✍️ COACHING AI
async function getBetterResponse(scenario, userTranscript, issue) {
  const prompt = `You are a communication coach. Write ONE improved response (1-2 sentences) that is calm, clear and accountable.
Scenario: ${scenario}
User said: "${userTranscript}"
Issue: ${issue}
Write only the improved response, no explanation, no quotes:`;

  if (process.env.GROQ_API_KEY) {
    try {
      const reply = await callGroq(
        prompt,
        'llama-3.1-8b-instant'
      );
      if (reply) return reply;
    } catch (e) {
      console.error('[ai] Groq better-response error:', e.message);
    }
  }

  return "I understand. I'll take ownership of this and make sure it doesn't happen again.";
}

module.exports = { getAiReply, getBetterResponse };