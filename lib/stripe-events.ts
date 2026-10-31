import type Stripe from 'stripe';

export type SubRow = {
  id: string; user_id: string; status: string; price_id: string | null; current_period_end: string | null;
};
export interface EventStore {
  /** false if the event id was already recorded */
  claim(id: string, type: string): Promise<boolean>;
  release(id: string): Promise<void>;
  upsertSubscription(row: SubRow): Promise<void>;
  /** re-read from the Stripe API so out-of-order events can't write stale state */
  fetchSubscription(id: string): Promise<Stripe.Subscription>;
}

const SUB_EVENTS = new Set([
  'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted',
]);

export function toSubRow(sub: Stripe.Subscription): SubRow {
  const userId = sub.metadata?.user_id;
  if (!userId) throw new Error(`subscription ${sub.id} has no metadata.user_id`);
  const item = sub.items.data[0];
  return {
    id: sub.id,
    user_id: userId,
    status: sub.status,
    price_id: item?.price.id ?? null,
    current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
  };
}

/** Idempotent: a repeated event id is a no-op. A failed handler releases the claim so Stripe's retry runs again. */
export async function handleStripeEvent(event: Stripe.Event, store: EventStore): Promise<'handled' | 'duplicate' | 'ignored'> {
  if (!SUB_EVENTS.has(event.type)) return 'ignored';
  if (!(await store.claim(event.id, event.type))) return 'duplicate';
  try {
    const { id } = event.data.object as Stripe.Subscription;
    await store.upsertSubscription(toSubRow(await store.fetchSubscription(id)));
    return 'handled';
  } catch (e) {
    await store.release(event.id);
    throw e;
  }
}

export const isActive = (status: string | null | undefined) => status === 'active' || status === 'trialing';
