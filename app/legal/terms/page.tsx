// TEMPLATE: fill every [BRACKET] and have it checked before taking payments.
import { PRICE_LABEL } from '@/lib/brand';

export default function Terms() {
  return (
    <main>
      <h1>Terms of sale</h1>
      <p>Seller: [LEGAL NAME], [ADDRESS], [CONTACT EMAIL].</p>
      <p>Service: weekly market-gap research reports plus archive access, {PRICE_LABEL} incl. VAT where applicable, billed monthly by Stripe.</p>
      <p>Cancel any time from &quot;Manage billing&quot;. Access continues to the end of the paid period.</p>
      <p>Cooling-off: [STATE THE 14-DAY RIGHT AND HOW IT IS HANDLED FOR IMMEDIATE DIGITAL ACCESS].</p>
      <p>Reports are research and opinion, not financial advice. No result or income is guaranteed.</p>
      <p>Governing law: England and Wales.</p>
    </main>
  );
}
