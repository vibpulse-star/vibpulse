import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { stripe } from '@/lib/stripe';
import { hasActiveSubscription } from '@/lib/member';
import { signToken } from '@/lib/token';

async function sendLink(form: FormData) {
  'use server';
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) redirect('/login?e=email');
  const e = env();
  const customers = await stripe().customers.list({ email, limit: 10 });
  for (const c of customers.data) {
    if (!(await hasActiveSubscription(c.id))) continue;
    const t = await signToken({ cid: c.id, p: 'login', exp: Date.now() + 15 * 60_000 }, e.SESSION_SECRET);
    const link = `${e.SITE_URL}/api/login?t=${t}`;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: e.MAIL_FROM, to: email, subject: 'Your Gap-Mining sign-in link',
        text: `Sign in to Gap-Mining (link valid 15 minutes):\n\n${link}\n\nIf you didn't ask for this, ignore it.` }),
    });
    if (!r.ok) redirect('/login?e=send');
    break;
  }
  redirect('/login?sent=1'); // same answer either way, so emails can't be probed
}

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const err = { email: 'Enter a valid email.', send: 'Could not send the email, try again.', expired: 'That link expired. Request a new one.' }[sp.e ?? ''];
  return (
    <main>
      <h1>Subscriber sign in</h1>
      {sp.sent ? <p role="status">If that email has an active subscription, a sign-in link is on its way.</p> : (
        <form action={sendLink} className="card" style={{ maxWidth: 480 }}>
          <label>Email used at checkout <input name="email" type="email" required autoComplete="email" /></label>
          <button type="submit">Email me a link</button>
          {err && <p role="alert">{err}</p>}
        </form>
      )}
      <p className="muted">Not a subscriber? <a href="/#pricing">See pricing</a>.</p>
    </main>
  );
}
