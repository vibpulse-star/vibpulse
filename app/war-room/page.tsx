import type { Metadata } from 'next';
import { requireOwner } from '@/lib/owner';
import { env } from '@/lib/env';
import { stripe } from '@/lib/stripe';
import { PUBLISH_THRESHOLD, WEIGHTS } from '@/lib/score';
import { addGap, addPriority, togglePriority } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'War Room', manifest: '/war-room.webmanifest', robots: { index: false } };

/** Revenue straight from Stripe: active subscriptions × their monthly amount. */
async function revenue() {
  let mrr = 0, active = 0, recent = 0;
  const weekAgo = Date.now() / 1000 - 7 * 86400;
  for await (const sub of stripe().subscriptions.list({ status: 'active', limit: 100 })) {
    active++;
    if (sub.created > weekAgo) recent++;
    for (const item of sub.items.data) {
      const { unit_amount, recurring } = item.price;
      if (unit_amount == null || !recurring) continue;
      const perMonth = recurring.interval === 'year' ? 1 / 12 : recurring.interval === 'month' ? 1 : NaN;
      mrr += (unit_amount / 100) * (item.quantity ?? 1) * (perMonth / (recurring.interval_count || 1));
    }
  }
  return { mrr: Number.isFinite(mrr) ? mrr : null, active, recent };
}

export default async function WarRoom({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireOwner();
  const sp = await searchParams;
  const db = env().DB;
  const [rev, priorities, hotGaps, drafts] = await Promise.all([
    revenue().catch(() => null),
    db.prepare('SELECT * FROM priorities ORDER BY done, created_at DESC LIMIT 20').all<{ id: number; title: string; done: number }>(),
    db.prepare(`SELECT id, title, score, published_at FROM gaps WHERE status = 'published' AND score >= ?
                ORDER BY published_at DESC LIMIT 5`).bind(PUBLISH_THRESHOLD).all<{ id: number; title: string; score: number; published_at: string }>(),
    db.prepare(`SELECT count(*) AS n FROM gaps WHERE status = 'draft'`).first<{ n: number }>(),
  ]);

  return (
    <main>
      <h1>War Room</h1>
      {sp.m && <p role="status">{sp.m}</p>}
      <div className="grid">
        <div className="card"><div className="muted">MRR</div><div className="stat">{rev?.mrr == null ? '—' : `£${Math.round(rev.mrr).toLocaleString('en-GB')}`}</div></div>
        <div className="card"><div className="muted">Active subscribers</div><div className="stat">{rev?.active ?? '—'}</div></div>
        <div className="card"><div className="muted">New subs (7d)</div><div className="stat">{rev?.recent ?? '—'}</div></div>
        <div className="card"><div className="muted">Draft gaps</div><div className="stat">{drafts?.n ?? 0}</div></div>
      </div>

      <h2>Today&apos;s priorities</h2>
      <form action={addPriority} style={{ display: 'flex', gap: 8 }}>
        <input name="title" required maxLength={200} aria-label="New priority" placeholder="Revenue-first task" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {priorities.results.map((p) => (
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
        {hotGaps.results.map((g) => <tr key={g.id}><td>{g.title}</td><td>{Number(g.score).toFixed(1)}</td>
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
