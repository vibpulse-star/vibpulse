import { NextResponse, type NextRequest } from 'next/server';
import { userClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const next = req.nextUrl.searchParams.get('next') ?? '/gaps';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/gaps';
  if (code) await (await userClient()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(safeNext, req.url));
}
