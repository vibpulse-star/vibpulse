import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { sessionCookie } from '@/lib/member';
import { verifyToken } from '@/lib/token';

// Emailed sign-in link -> 30-day session cookie.
export async function GET(req: NextRequest) {
  const site = env().SITE_URL;
  const customer = await verifyToken(req.nextUrl.searchParams.get('t') ?? '', 'login', env().SESSION_SECRET);
  if (!customer) return NextResponse.redirect(`${site}/login?e=expired`, 303);
  const res = NextResponse.redirect(`${site}/gaps`, 303);
  res.cookies.set(await sessionCookie(customer));
  return res;
}
