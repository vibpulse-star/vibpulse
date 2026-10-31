import type { Metadata } from 'next';
import { requireOwner } from '@/lib/owner';
import { adminClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { PUBLISH_THRESHOLD, WEIGHTS } from '@/lib/score';
import { addGap, addPriority, togglePriority } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'War Room', manifest: '/war-room.webmanifest', robots: { index: false } };

async function monthlyPrice(): Promise<number | null> {
  try {
    const p = await stripe().prices.retrieve(process.env.STRIPE_PRICE_ID!);
    return p.unit_amount == null ? null : p.unit_amount / 100;
  } catch { return null; }
}

export default async function WarRoom({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireOwner();
  const sp = await searchParams;
  const db = adminClient();
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const [subs, newSubs, priorities, hotGaps, drafts, price] = await Promise.all([
    db.from('subscriptions').select('id', { count: 'exact', head: true }).in('status', ['active', 'trialing']),
    db.from('subscriptions').select('id', { count: 'exact', head: true }).in('status', ['active', 'trialing']).gte('updated_at', since),
    db.from('priorities').select('*').order('done').order('created_at', { ascending: false }).limit(20),
    db.from('gaps').select('id,title,score,published_at').eq('status', 'published').gte('score', PUBLISH_THRESHOLD)
      .order('published_at', { ascending: false }).limit(5),
    db.from('gaps').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    monthlyPrice(),
  ]);
  const active = subs.count ?? 0;

  return (
    <main>
      <h1>War Room</h1>
      {sp.m && <p role="status">{sp.m}</p>}
      <div className="grid">
        <div className="card"><div className="muted">MRR</div><div className="stat">{price == null ? '—' : `£${(active * price).toLocaleString('en-GB')}`}</div></div>
        <div className="card"><div className="muted">Active subscribers</div><div className="stat">{active}</div></div>
        <div className="card"><div className="muted">Subs changed (7d)</div><div className="stat">{newSubs.count ?? 0}</div></div>
        <div className="card"><div className="muted">Draft gaps</div><div className="stat">{drafts.count ?? 0}</div></div>
      </div>

      <h2>Today&apos;s priorities</h2>
      <form action={addPriority} style={{ display: 'flex', gap: 8 }}>
        <input name="title" required maxLength={200} aria-label="New priority" placeholder="Revenue-first task" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {priorities.data?.map((p) => (
          <li key={p.id}>
            <form action={togglePriority} style={{ display: 'inline' }}>
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="done" value={String(!p.done)} />
              <button className="ghost" type="submit" aria-label={p.done ? 'Mark not done' : 'Mark done'}>{p.done ? '☑' : '☐'}</button>
            </form>{' '}
            <span style={{ textDecoration: p.done ? 'line-through' : undefined }}>{p.title}</span>
          </li>
        ))}
      </ul>

      <h2>Gap alerts (score ≥ {PUBLISH_THRESHOLD}, newest)</h2>
      <table><tbody>
        {hotGaps.data?.map((g) => <tr key={g.id}><td>{g.title}</td><td>{Number(g.score).toFixed(1)}</td>
          <td className="muted">{g.published_at?.slice(0, 10)}</td></tr>)}
      </tbody></table>

      <h2>New gap</h2>
      <form action={addGap} className="card">
        <label>Title <input name="title" required maxLength={200} /></label>
        <label>Market <input name="market" required maxLength={120} /></label>
        <label>Gap type <select name="gap_type">{['pricing', 'feature', 'service', 'quality', 'market', 'adoption'].map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Report (evidence, competitor weaknesses, product idea, £ min/ideal/max) <textarea name="summary" required rows={10} maxLength={8000} /></label>
        <div className="grid">
          {Object.entries(WEIGHTS).map(([k, w]) => (
            <label key={k}>{k} ×{w} <input name={k} type="number" min={0} max={10} step={0.5} required /></label>
          ))}
        </div>
        <label>Sources, one per line as <code>Name | https://url</code><textarea name="sources" rows={4} /></label>
        <label><input type="checkbox" name="publish" style={{ width: 'auto' }} /> Publish now (needs score ≥ {PUBLISH_THRESHOLD})</label>
        <label><input type="checkbox" name="is_sample" style={{ width: 'auto' }} /> Free public sample</label>
        <button type="submit">Save gap</button>
      </form>
    </main>
  );
}
