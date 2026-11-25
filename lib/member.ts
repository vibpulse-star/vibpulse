import 'server-only';
import { cookies } from 'next/headers';
import { env } from './env';
import { stripe } from './stripe';
import { signToken, verifyToken } from './token';

export const MEMBER_COOKIE = 'gm_member';
const THIRTY_DAYS = 30 * 864e5;

/** Stripe is the only source of truth for access: no subscriptions table, no webhook to drift. */
// shortcut: one Stripe API call per members-page view; add a KV cache when traffic makes that slow or costly.
export async function hasActiveSubscription(customer: string): Promise<boolean> {
  const subs = await stripe().subscriptions.list({ customer, status: 'all', limit: 5 });
  return subs.data.some((s) => s.status === 'active' || s.status === 'trialing');
}

export async function memberCustomer(): Promise<string | null> {
  return verifyToken((await cookies()).get(MEMBER_COOKIE)?.value, 'session', env().SESSION_SECRET);
}

export async function sessionCookie(customer: string) {
  return {
    name: MEMBER_COOKIE,
    value: await signToken({ cid: customer, p: 'session', exp: Date.now() + THIRTY_DAYS }, env().SESSION_SECRET),
    httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: THIRTY_DAYS / 1000,
  };
}
