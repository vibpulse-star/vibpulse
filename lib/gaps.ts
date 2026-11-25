import 'server-only';
import { env } from './env';
import type { Gap } from '@/app/gap-card';

/** Published gaps with their sources; `samplesOnly` for non-members. */
export async function publishedGaps(samplesOnly: boolean, limit = 100): Promise<Gap[]> {
  const db = env().DB;
  const { results: gaps } = await db.prepare(
    `SELECT * FROM gaps WHERE status = 'published' ${samplesOnly ? 'AND is_sample = 1' : ''}
     ORDER BY published_at DESC LIMIT ?`).bind(limit).all<Gap>();
  if (!gaps.length) return [];
  const ids = gaps.map((g) => g.id);
  const { results: sources } = await db.prepare(
    `SELECT gap_id, url, source_name FROM gap_sources WHERE gap_id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids).all<{ gap_id: number; url: string; source_name: string }>();
  return gaps.map((g) => ({ ...g, gap_sources: sources.filter((s) => s.gap_id === g.id) }));
}
