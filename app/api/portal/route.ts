import { NextResponse } from 'next/server';
import { adminClient, currentUser } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

export async function POST() {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL('/login', site), 303);
  const { data } = await adminClient().from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  if (!data?.stripe_customer_id) return NextResponse.redirect(new URL('/#pricing', site), 303);
  const portal = await stripe().billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${site}/gaps` });
  return NextResponse.redirect(portal.url, 303);
}
