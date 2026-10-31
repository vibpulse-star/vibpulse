import { redirect } from 'next/navigation';
import { userClient } from '@/lib/supabase';

async function sendLink(form: FormData) {
  'use server';
  const email = String(form.get('email') ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) redirect('/login?e=email');
  const next = String(form.get('next') ?? '/gaps');
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/gaps';
  const { error } = await (await userClient()).auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(safeNext)}` },
  });
  redirect(error ? '/login?e=send' : '/login?sent=1');
}

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <main>
      <h1>Sign in</h1>
      {sp.sent ? <p role="status">Check your inbox for a sign-in link.</p> : (
        <form action={sendLink} className="card" style={{ maxWidth: 480 }}>
          <label>Email <input name="email" type="email" required autoComplete="email" /></label>
          <input type="hidden" name="next" value={sp.next ?? '/gaps'} />
          <button type="submit">Email me a link</button>
          {sp.e && <p role="alert">{sp.e === 'email' ? 'Enter a valid email.' : 'Could not send the link, try again.'}</p>}
        </form>
      )}
    </main>
  );
}
