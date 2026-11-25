import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gapScore } from './score.ts';

test('weighted sum matches the VibPulse formula', () => {
  assert.equal(gapScore({ market_size: 10, growth: 10, competition: 10, fit: 10, profit: 10 }), 10);
  assert.equal(gapScore({ market_size: 8, growth: 6, competition: 7, fit: 9, profit: 5 }), 6.95);
});
test('rejects out-of-range factors', () => {
  assert.throws(() => gapScore({ market_size: 11, growth: 0, competition: 0, fit: 0, profit: 0 }), RangeError);
  assert.throws(() => gapScore({ market_size: NaN, growth: 0, competition: 0, fit: 0, profit: 0 }), RangeError);
});
