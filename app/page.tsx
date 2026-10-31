import { publishedGaps } from '@/lib/gaps';
import { PRICE_LABEL } from '@/lib/brand';
import { GapCard } from './gap-card';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [sample] = await publishedGaps(true, 1);

  return (
    <main>
      <h1>Find the gap before anyone else builds it.</h1>
      <p>Every week you get market gaps taken from real complaints and failing products. Each one is scored on
        market size, growth, competition, fit and profit, with sources and a product you could sell.</p>
      <p><a className="btn" href="#pricing">Get this week&apos;s gaps</a></p>

      <h2>This week&apos;s free sample</h2>
      {sample ? <GapCard g={sample} /> : <p className="muted">The first sample report is coming soon.</p>}

      <h2 id="pricing">Pricing</h2>
      <div className="card">
        <h3>Gap-Mining Pro: {PRICE_LABEL}</h3>
        <ul>
          <li>New scored gaps every week (only gaps scoring 7/10 or higher)</li>
          <li>Full archive with evidence and sources</li>
          <li>Cancel any time from your billing page</li>
        </ul>
        <form action="/api/checkout" method="post"><button type="submit">Subscribe</button></form>
      </div>
    </main>
  );
}
