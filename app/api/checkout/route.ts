import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { stripe } from '@/lib/stripe';

// No account needed: Stripe Checkout collects the email and creates the customer.
export async function POST() {
  const site = env().SITE_URL;
  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: env().STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${site}/api/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/#pricing`,
  });
  return NextResponse.redirect(session.url!, 303);
}
