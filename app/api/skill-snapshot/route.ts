import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
import { parseSnapshot } from '@/lib/skill-snapshot';

function authorized(req: NextRequest) {
  const expected = env().SKILL_SNAPSHOT_TOKEN ?? '';
  const got = (req.headers.get('authorization') ?? '').replace(/^Bearer /, '');
  if (expected.length < 32 || got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const raw = await req.text();
  if (raw.length > 1_000_000) return NextResponse.json({ error: 'too large' }, { status: 413 });
  let payload;
  try { payload = parseSnapshot(JSON.parse(raw)); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
  const db = env().DB;
  await db.batch([ // keep the last 48 snapshots
    db.prepare('INSERT INTO skill_snapshots (payload) VALUES (?)').bind(JSON.stringify(payload)),
    db.prepare('DELETE FROM skill_snapshots WHERE id NOT IN (SELECT id FROM skill_snapshots ORDER BY id DESC LIMIT 48)'),
  ]);
  return NextResponse.json({ ok: true, groups: payload.groups.length });
}
