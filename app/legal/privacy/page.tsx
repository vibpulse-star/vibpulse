// TEMPLATE: fill every [BRACKET] and have it checked before taking payments.
export default function Privacy() {
  return (
    <main>
      <h1>Privacy policy</h1>
      <p>Controller: [LEGAL NAME / TRADING NAME], [ADDRESS], [CONTACT EMAIL]. ICO registration: [NUMBER].</p>
      <p>What we store: your email address (to sign in and send gap reports) and your subscription status.
        Card details are handled by Stripe; we never see or store them.</p>
      <p>Why: to provide the service you subscribed to (contract), and to send service emails.</p>
      <p>Processors: Supabase (database and sign-in), Stripe (payments), [HOSTING PROVIDER].</p>
      <p>Retention: while your account exists, then [N] days. Invoices are kept as UK tax law requires.</p>
      <p>Your rights: access, correction, deletion, objection, and complaint to the ICO (ico.org.uk). Email [CONTACT EMAIL].</p>
    </main>
  );
}
