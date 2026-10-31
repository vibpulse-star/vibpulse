import { NextResponse, type NextRequest } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { handleStripeEvent, type EventStore } from '@/lib/stripe-events';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text(); // raw body required for signature verification
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, sig ?? '', process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }

  const db = adminClient();
  const store: EventStore = {
    async claim(id, type) {
      const { error } = await db.from('stripe_events').insert({ id, type });
      if (error?.code === '23505') return false; // unique violation = already processed
      if (error) throw error;
      return true;
    },
    async release(id) { await db.from('stripe_events').delete().eq('id', id); },
    async upsertSubscription(row) {
      const { error } = await db.from('subscriptions').upsert({ ...row, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    fetchSubscription: (id) => stripe().subscriptions.retrieve(id),
  };

  try {
    return NextResponse.json({ result: await handleStripeEvent(event, store) });
  } catch (e) {
    console.error('stripe webhook failed', event.id, e);
    return NextResponse.json({ error: 'handler failed' }, { status: 500 }); // Stripe retries
  }
}
