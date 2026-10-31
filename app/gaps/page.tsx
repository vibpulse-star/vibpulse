import { redirect } from 'next/navigation';
import { userClient } from '@/lib/supabase';
import { isActive } from '@/lib/stripe-events';
import { GapCard, type Gap } from '../gap-card';

export const dynamic = 'force-dynamic';

export default async function Gaps({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const db = await userClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login?next=/gaps');

  const { data: sub } = await db.from('subscriptions').select('status').eq('user_id', user.id)
    .order('updated_at', { ascending: false }).limit(1).maybeSingle();
  // RLS returns only sample gaps to non-members, so this query is safe for everyone
  const { data: gaps } = await db.from('gaps').select('*, gap_sources(url, source_name)')
    .eq('status', 'published').order('published_at', { ascending: false }).limit(100);

  return (
    <main>
      <h1>Gap archive</h1>
      {sp.welcome && !isActive(sub?.status) && <p role="status">Payment received. Access unlocks within a minute; refresh the page.</p>}
      {isActive(sub?.status) ? (
        <form action="/api/portal" method="post"><button className="ghost" type="submit">Manage billing</button></form>
      ) : (
        <div className="card"><p>You&apos;re seeing the free sample only.</p>
          <form action="/api/checkout" method="post"><button type="submit">Subscribe to unlock every gap</button></form></div>
      )}
      {(gaps as Gap[] | null)?.map((g) => <GapCard key={g.id} g={g} />)}
    </main>
  );
}
