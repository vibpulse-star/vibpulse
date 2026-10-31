'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireOwner } from '@/lib/owner';
import { adminClient } from '@/lib/supabase';
import { gapScore, PUBLISH_THRESHOLD, WEIGHTS, type Factors } from '@/lib/score';

const GAP_TYPES = ['pricing', 'feature', 'service', 'quality', 'market', 'adoption'];
const text = (f: FormData, k: string, max: number) => {
  const v = String(f.get(k) ?? '').trim();
  if (!v || v.length > max) throw new Error(`${k} is required (max ${max} chars)`);
  return v;
};

export async function addPriority(f: FormData) {
  await requireOwner();
  await adminClient().from('priorities').insert({ title: text(f, 'title', 200) });
  revalidatePath('/war-room');
}

export async function togglePriority(f: FormData) {
  await requireOwner();
  await adminClient().from('priorities').update({ done: f.get('done') === 'true' }).eq('id', Number(f.get('id')));
  revalidatePath('/war-room');
}

export async function addGap(f: FormData) {
  await requireOwner();
  let msg = 'saved';
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
      return { source_name: name.slice(0, 120), url };
    });

    const db = adminClient();
    const { data, error } = await db.from('gaps').insert({
      title: text(f, 'title', 200), market: text(f, 'market', 120), summary: text(f, 'summary', 8000),
      gap_type, ...factors, is_sample: f.get('is_sample') === 'on',
      status: publish ? 'published' : 'draft', published_at: publish ? new Date().toISOString() : null,
    }).select('id').single();
    if (error) throw error;
    if (sources.length) {
      const { error: e2 } = await db.from('gap_sources').insert(sources.map((s) => ({ ...s, gap_id: data.id })));
      if (e2) throw e2;
    }
    msg = publish ? `published (${score}/10)` : `draft saved (${score}/10)`;
  } catch (e) {
    msg = `error: ${(e as Error).message}`;
  }
  revalidatePath('/war-room');
  redirect(`/war-room?m=${encodeURIComponent(msg)}`);
}
