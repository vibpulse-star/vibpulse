import type { Metadata } from 'next';
import { requireOwner } from '@/lib/owner';
import { env } from '@/lib/env';
import { duplicateSkills, type SkillSnapshot } from '@/lib/skill-snapshot';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Skill Tree', manifest: '/skill-tree.webmanifest', robots: { index: false } };

export default async function SkillTree() {
  await requireOwner();
  const data = await env().DB.prepare('SELECT taken_at, payload FROM skill_snapshots ORDER BY id DESC LIMIT 1')
    .first<{ taken_at: string; payload: string }>();
  if (!data) return <main><h1>Skill Tree</h1><p>No snapshot yet. Run <code>scripts/skill-snapshot.ps1</code> on your PC.</p></main>;

  const snap = JSON.parse(data.payload) as SkillSnapshot;
  const dupes = duplicateSkills(snap);
  const total = snap.groups.reduce((n, g) => n + g.skills.length, 0);
  const groups = [...snap.groups].sort((a, b) => b.skills.length - a.skills.length);

  return (
    <main>
      <h1>Skill Tree</h1>
      <p className="muted">Snapshot {new Date(data.taken_at + 'Z').toLocaleString('en-GB', { timeZone: 'Europe/London' })} · {groups.length} groups · {total} skills · {dupes.size} overlapping</p>
      {dupes.size > 0 && (
        <details className="card"><summary>Overlaps: the same skill name in several groups</summary>
          <ul>{[...dupes].map(([n, gs]) => <li key={n}><strong>{n}</strong>: {gs.join(', ')}</li>)}</ul>
        </details>
      )}
      <div className="tree"><ul>
        {groups.map((g) => (
          <li key={g.name}><details><summary><strong>{g.name}</strong> <span className="muted">({g.skills.length})</span></summary>
            <ul>{g.skills.map((s) => (
              <li key={s.name}><span style={{ color: dupes.has(s.name) ? '#ffcc00' : undefined }}>{s.name}</span>
                {s.description && <div className="muted" style={{ fontSize: 14 }}>{s.description}</div>}</li>
            ))}</ul>
          </details></li>
        ))}
      </ul></div>
    </main>
  );
}
