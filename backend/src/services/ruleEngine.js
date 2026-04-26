'use strict';
const RULES = require('./rules.json');

function scoreText(transcript) {
  const lower  = transcript.toLowerCase().trim();
  const words  = lower.split(/\s+/).filter(Boolean);
  const wcount = words.length;

  let blameFlag    = false;
  let clarityScore = 5;
  let matchedRules = [];

  // Check all rules — collect ALL matches not just first
  for (const rule of RULES) {
    const hit = rule.patterns.some(p => lower.includes(p.toLowerCase()));
    if (hit) {
      blameFlag    = blameFlag || rule.blameFlag;
      clarityScore = Math.max(1, clarityScore - (rule.clarityPenalty || 0));
      matchedRules.push(rule);
    }
  }

  // Extra penalty for very short replies (under 4 words)
  if (wcount <= 2 && !matchedRules.length) {
    clarityScore = Math.max(1, clarityScore - 2);
    matchedRules.push({
      issue:      'Response too brief — no substance',
      impact:     'One-word or two-word answers signal disengagement.',
      suggestion: 'Try: Give a complete sentence that acknowledges the concern and offers something constructive.',
    });
  }

  // Pick the most severe matched rule to show as primary feedback
  const primary = matchedRules[0] || null;

  return {
    blameFlag,
    clarityScore: Math.max(1, clarityScore),
    issue:      primary ? primary.issue      : null,
    impact:     primary ? primary.impact     : null,
    suggestion: primary ? primary.suggestion : null,
    matchCount: matchedRules.length,
  };
}

module.exports = { scoreText };