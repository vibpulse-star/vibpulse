import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { stripe } from '@/lib/stripe';
import { sessionCookie } from '@/lib/member';

export async function GET(req: NextRequest) {
  const site = env().SITE_URL;
  const id = req.nextUrl.searchParams.get('session_id') ?? '';
  if (!id.startsWith('cs_')) return NextResponse.redirect(`${site}/#pricing`, 303);
  // Verify with Stripe; the query string alone proves nothing.
  const s = await stripe().checkout.sessions.retrieve(id).catch(() => null);
  const customer = typeof s?.customer === 'string' ? s.customer : s?.customer?.id;
  if (!s || s.status !== 'complete' || !customer) return NextResponse.redirect(`${site}/#pricing`, 303);
  const res = NextResponse.redirect(`${site}/gaps?welcome=1`, 303);
  res.cookies.set(await sessionCookie(customer));
  return res;
}
