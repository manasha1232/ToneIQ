'use strict';
const { scoreText } = require('../src/services/ruleEngine');

describe('Rule Engine', () => {
  test('detects blame language (you always)', () => {
    const r = scoreText('You always give me too much work!');
    expect(r.blameFlag).toBe(true);
    expect(r.issue).toMatch(/blame/i);
  });

  test('detects deflection (not my fault)', () => {
    const r = scoreText("It's not my fault the deadline was unrealistic.");
    expect(r.blameFlag).toBe(true);
  });

  test('detects overwork excuse', () => {
    const r = scoreText('I had too much work and no time.');
    expect(r.clarityScore).toBeLessThan(5);
    expect(r.issue).toBeTruthy();
  });

  test('gives full score for assertive response', () => {
    const r = scoreText('I understand the concern. I underestimated the scope and will plan better.');
    expect(r.blameFlag).toBe(false);
    expect(r.clarityScore).toBe(5);
    expect(r.issue).toBeNull();
  });

  test('detects aggressive language', () => {
    const r = scoreText("That's ridiculous — you're wrong.");
    expect(r.clarityScore).toBeLessThanOrEqual(2);
  });

  test('clarityScore is always between 1 and 5', () => {
    const bad = scoreText('shut up you always blame others and that is stupid ridiculous');
    expect(bad.clarityScore).toBeGreaterThanOrEqual(1);
    expect(bad.clarityScore).toBeLessThanOrEqual(5);
  });
});
