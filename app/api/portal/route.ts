import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { stripe } from '@/lib/stripe';
import { memberCustomer } from '@/lib/member';

export async function POST() {
  const site = env().SITE_URL;
  const customer = await memberCustomer();
  if (!customer) return NextResponse.redirect(`${site}/login`, 303);
  const portal = await stripe().billingPortal.sessions.create({ customer, return_url: `${site}/gaps` });
  return NextResponse.redirect(portal.url, 303);
}
