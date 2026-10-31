import { NextResponse, type NextRequest } from 'next/server';
import { adminClient, currentUser } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL('/login?next=/%23pricing', site), 303);

  const db = adminClient();
  const { data: profile } = await db.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  let customer = profile?.stripe_customer_id as string | null | undefined;
  if (!customer) {
    customer = (await stripe().customers.create({ email: user.email, metadata: { user_id: user.id } })).id;
    await db.from('profiles').update({ stripe_customer_id: customer }).eq('id', user.id);
  }

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    subscription_data: { metadata: { user_id: user.id } }, // webhook maps subscription -> user via this
    success_url: `${site}/gaps?welcome=1`,
    cancel_url: `${site}/#pricing`,
  });
  return NextResponse.redirect(session.url!, 303);
}
