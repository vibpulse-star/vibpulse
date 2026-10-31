import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { adminClient } from '@/lib/supabase';
import { parseSnapshot } from '@/lib/skill-snapshot';

function authorized(req: NextRequest) {
  const expected = process.env.SKILL_SNAPSHOT_TOKEN ?? '';
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
  const { error } = await adminClient().from('skill_snapshots').insert({ payload });
  if (error) return NextResponse.json({ error: 'store failed' }, { status: 500 });
  return NextResponse.json({ ok: true, groups: payload.groups.length });
}
