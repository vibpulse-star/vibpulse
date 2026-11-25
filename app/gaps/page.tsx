import { memberCustomer, hasActiveSubscription } from '@/lib/member';
import { publishedGaps } from '@/lib/gaps';
import { GapCard } from '../gap-card';

export const dynamic = 'force-dynamic';

export default async function Gaps({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const customer = await memberCustomer();
  const member = customer ? await hasActiveSubscription(customer) : false;
  const gaps = await publishedGaps(!member);

  return (
    <main>
      <h1>Gap archive</h1>
      {sp.welcome && <p role="status">Welcome aboard. Your gaps are below.</p>}
      {member ? (
        <form action="/api/portal" method="post"><button className="ghost" type="submit">Manage billing</button></form>
      ) : (
        <div className="card"><p>You&apos;re seeing the free sample only. {customer ? 'Your subscription is not active.' : <>Already subscribed? <a href="/login">Sign in</a>.</>}</p>
          <form action="/api/checkout" method="post"><button type="submit">Subscribe to unlock every gap</button></form></div>
      )}
      {gaps.map((g) => <GapCard key={g.id} g={g} />)}
    </main>
  );
}
