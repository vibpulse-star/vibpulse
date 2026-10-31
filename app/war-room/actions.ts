'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireOwner } from '@/lib/owner';
import { env } from '@/lib/env';
import { gapScore, PUBLISH_THRESHOLD, WEIGHTS, type Factors } from '@/lib/score';

const GAP_TYPES = ['pricing', 'feature', 'service', 'quality', 'market', 'adoption'];
const text = (f: FormData, k: string, max: number) => {
  const v = String(f.get(k) ?? '').trim();
  if (!v || v.length > max) throw new Error(`${k} is required (max ${max} chars)`);
  return v;
};

export async function addPriority(f: FormData) {
  await requireOwner();
  await env().DB.prepare('INSERT INTO priorities (title) VALUES (?)').bind(text(f, 'title', 200)).run();
  revalidatePath('/war-room');
}

export async function togglePriority(f: FormData) {
  await requireOwner();
  await env().DB.prepare('UPDATE priorities SET done = ? WHERE id = ?')
    .bind(f.get('done') === 'true' ? 1 : 0, Number(f.get('id'))).run();
  revalidatePath('/war-room');
}

export async function addGap(f: FormData) {
  await requireOwner();
  let msg: string;
  try {
    const gap_type = String(f.get('gap_type'));
    if (!GAP_TYPES.includes(gap_type)) throw new Error('invalid gap type');
    const factors = Object.fromEntries(Object.keys(WEIGHTS).map((k) => [k, Number(f.get(k))])) as Factors;
    const score = gapScore(factors); // throws on out-of-range input
    const publish = f.get('publish') === 'on';
    if (publish && score < PUBLISH_THRESHOLD) throw new Error(`score ${score} is below ${PUBLISH_THRESHOLD}; saved nothing`);

    // one source per line: "Name | https://url"
    const sources = String(f.get('sources') ?? '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const [name, url] = l.split('|').map((s) => s.trim());
      if (!name || !/^https?:\/\/\S+$/.test(url ?? '')) throw new Error(`bad source line: ${l}`);
      return { name: name.slice(0, 120), url };
    });

    const db = env().DB;
    const gap = await db.prepare(
      `INSERT INTO gaps (title, market, summary, gap_type, market_size, growth, competition, fit, profit, is_sample, status, published_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`)
      .bind(text(f, 'title', 200), text(f, 'market', 120), text(f, 'summary', 8000), gap_type,
        factors.market_size, factors.growth, factors.competition, factors.fit, factors.profit,
        f.get('is_sample') === 'on' ? 1 : 0, publish ? 'published' : 'draft', publish ? new Date().toISOString() : null)
      .first<{ id: number }>();
    if (sources.length) {
      await db.batch(sources.map((s) =>
        db.prepare('INSERT INTO gap_sources (gap_id, source_name, url) VALUES (?,?,?)').bind(gap!.id, s.name, s.url)));
    }
    msg = publish ? `published (${score}/10)` : `draft saved (${score}/10)`;
  } catch (e) {
    msg = `error: ${(e as Error).message}`;
  }
  revalidatePath('/war-room');
  redirect(`/war-room?m=${encodeURIComponent(msg)}`);
}
