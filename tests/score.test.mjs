import assert from 'node:assert/strict';
import { WEIGHTS, scoreGap } from '../gap-mining/score.js';

assert.equal(Object.values(WEIGHTS).reduce((a, b) => a + b, 0).toFixed(10), '1.0000000000');
assert.equal(scoreGap({ market: 10, growth: 10, competition: 10, fit: 10, profit: 10 }), 100);
assert.equal(scoreGap({ market: 1, growth: 1, competition: 1, fit: 1, profit: 1 }), 10);
assert.equal(scoreGap({ market: 8, growth: 6, competition: 4, fit: 10, profit: 5 }), 65); // 2+1.2+.8+1.5+1 = 6.5
console.log('score tests passed');
