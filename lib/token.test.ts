import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signToken, verifyToken } from './token.ts';

const S = 'x'.repeat(32);
const exp = Date.now() + 60_000;

test('round-trips a valid token', async () => {
  assert.equal(await verifyToken(await signToken({ cid: 'cus_1', p: 'session', exp }, S), 'session', S), 'cus_1');
});
test('rejects tampering, wrong purpose, wrong secret, expiry', async () => {
  const t = await signToken({ cid: 'cus_1', p: 'login', exp }, S);
  const [body, sig] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ cid: 'cus_2', p: 'login', exp })).toString('base64url');
  assert.equal(await verifyToken(`${forged}.${sig}`, 'login', S), null);
  assert.equal(await verifyToken(`${body}.${sig}`, 'session', S), null); // login link can't be a session
  assert.equal(await verifyToken(t, 'login', 'y'.repeat(32)), null);
  assert.equal(await verifyToken(t, 'login', S, exp + 1), null);
  assert.equal(await verifyToken('garbage', 'login', S), null);
  assert.equal(await verifyToken(undefined, 'login', S), null);
});
test('refuses short secrets', async () => {
  await assert.rejects(signToken({ cid: 'c', p: 'session', exp }, 'short'));
});
