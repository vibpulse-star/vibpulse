import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleStripeEvent, type EventStore, type SubRow } from './stripe-events.ts';

function fakeStore(subStatus = 'active', failUpsert = false) {
  const claimed = new Set<string>();
  const rows: SubRow[] = [];
  const store: EventStore = {
    async claim(id) { if (claimed.has(id)) return false; claimed.add(id); return true; },
    async release(id) { claimed.delete(id); },
    async upsertSubscription(r) { if (failUpsert) throw new Error('db down'); rows.push(r); },
    async fetchSubscription(id) {
      return { id, status: subStatus, metadata: { user_id: 'u1' },
        items: { data: [{ price: { id: 'price_1' }, current_period_end: 1_800_000_000 }] } } as any;
    },
  };
  return { store, claimed, rows };
}
const ev = (id: string, type = 'customer.subscription.updated') =>
  ({ id, type, data: { object: { id: 'sub_1', status: 'incomplete' } } }) as any;

test('handles once, then reports duplicate', async () => {
  const { store, rows } = fakeStore();
  assert.equal(await handleStripeEvent(ev('evt_1'), store), 'handled');
  assert.equal(await handleStripeEvent(ev('evt_1'), store), 'duplicate');
  assert.equal(rows.length, 1);
  // state comes from the API re-fetch, not the (stale) payload
  assert.deepEqual(rows[0], { id: 'sub_1', user_id: 'u1', status: 'active', price_id: 'price_1',
    current_period_end: new Date(1_800_000_000_000).toISOString() });
});
test('ignores unrelated events', async () => {
  const { store, claimed } = fakeStore();
  assert.equal(await handleStripeEvent(ev('evt_2', 'charge.succeeded'), store), 'ignored');
  assert.equal(claimed.size, 0);
});
test('failure releases the claim so the retry runs', async () => {
  const { store, claimed } = fakeStore('active', true);
  await assert.rejects(handleStripeEvent(ev('evt_3'), store));
  assert.equal(claimed.has('evt_3'), false);
});
