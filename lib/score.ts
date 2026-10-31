// Mirrors the generated `score` column in migrations/0001_init.sql.
export const WEIGHTS = { market_size: 0.25, growth: 0.2, competition: 0.2, fit: 0.15, profit: 0.2 } as const;
export type Factors = Record<keyof typeof WEIGHTS, number>;
export const PUBLISH_THRESHOLD = 7;

export function gapScore(f: Factors): number {
  let s = 0;
  for (const k of Object.keys(WEIGHTS) as (keyof Factors)[]) {
    const v = f[k];
    if (!Number.isFinite(v) || v < 0 || v > 10) throw new RangeError(`${k} must be 0-10`);
    s += v * WEIGHTS[k];
  }
  return Math.round(s * 100) / 100;
}
