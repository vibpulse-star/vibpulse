// HMAC-signed, expiring tokens (WebCrypto works in Workers and Node).
type Payload = { cid: string; p: 'session' | 'login'; exp: number };

const enc = new TextEncoder();
const b64 = (b: ArrayBuffer | Uint8Array) => Buffer.from(b instanceof Uint8Array ? b : new Uint8Array(b)).toString('base64url');
const key = (secret: string) => {
  if (secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 chars');
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
};

export async function signToken(p: Payload, secret: string): Promise<string> {
  const body = b64(enc.encode(JSON.stringify(p)));
  return `${body}.${b64(await crypto.subtle.sign('HMAC', await key(secret), enc.encode(body)))}`;
}

export async function verifyToken(token: string | undefined, purpose: Payload['p'], secret: string, now = Date.now()): Promise<string | null> {
  const [body, sig] = (token ?? '').split('.');
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify('HMAC', await key(secret), Buffer.from(sig, 'base64url'), enc.encode(body));
  if (!ok) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as Payload;
    return p.p === purpose && typeof p.cid === 'string' && p.exp > now ? p.cid : null;
  } catch { return null; }
}
