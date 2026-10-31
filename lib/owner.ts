import 'server-only';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from './env';

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

/**
 * Default-deny gate for War Room / Skill Tree. Cloudflare Access (one-time PIN or Google login, owner email only)
 * sits in front of these paths; here we verify its signed JWT so a misconfigured Access rule can't expose them.
 */
export async function requireOwner() {
  const { ACCESS_TEAM_DOMAIN: team, ACCESS_AUD: aud } = env();
  const token = (await headers()).get('cf-access-jwt-assertion');
  if (!team || !aud || !token) notFound();
  jwks ??= createRemoteJWKSet(new URL(`${team}/cdn-cgi/access/certs`));
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: team, audience: aud });
    return payload;
  } catch {
    notFound();
  }
}
