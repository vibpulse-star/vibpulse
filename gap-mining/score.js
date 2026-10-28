// VibPulse gap score: weighted 1–10 factor ratings → 0–100.
export const WEIGHTS = { market: 0.25, growth: 0.2, competition: 0.2, fit: 0.15, profit: 0.2 };
export const FACTORS = {
  market: 'Market size',
  growth: 'Growth',
  competition: 'Competition gap (10 = weak rivals)',
  fit: 'Fit with you',
  profit: 'Profit potential',
};
export const GAP_TYPES = ['pricing', 'feature', 'service', 'quality', 'market', 'adoption'];

export function scoreGap(ratings) {
  return Math.round(Object.entries(WEIGHTS).reduce((t, [k, w]) => t + w * ratings[k], 0) * 10);
}
