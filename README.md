# VibPulse

One Next.js app, three products, installable as PWAs on Windows (Edge/Chrome → Install) and Android (Chrome → Add to Home screen).

| Route | Product | Access |
|---|---|---|
| `/`, `/gaps` | **Gap-Mining**: weekly scored market gaps, Stripe subscription | Public landing; archive for subscribers |
| `/war-room` | **War Room**: MRR, subscribers, today's priorities, gap alerts, gap entry | Owner only (`OWNER_EMAIL`) |
| `/skill-tree` | **Skill Tree**: map of your Claude skills/plugins, with overlaps | Owner only |

Design decisions are recorded in `docs/council-design.md`.

## Setup
1. **Supabase**: create a project, then run `supabase/schema.sql` in the SQL editor. Under Auth → URL config, add `https://<domain>/auth/callback`. Turn on MFA for the owner account.
2. **Stripe**: create a product with a recurring £149/month price, and copy its `price_…` id. Turn on the Customer Portal (allow cancellation). Add a webhook to `https://<domain>/api/stripe/webhook` for `customer.subscription.created|updated|deleted`.
3. **Env**: copy `.env.example` to `.env.local` and fill it in. `SKILL_SNAPSHOT_TOKEN` must be at least 32 random characters.
4. `npm install && npm run dev`. Hosts: Netlify or Cloudflare free tier, or Vercel Pro. Vercel Hobby forbids commercial use.
5. **Windows PC**: run `.\setup-desktop.ps1 -SiteUrl https://<domain> -Token <SKILL_SNAPSHOT_TOKEN>`. It installs Git and Node and registers an hourly Skill Tree snapshot. Only skill names and descriptions leave the PC.

## Workflow
Write gaps in War Room → New gap. Score each factor 0–10. The weighted score uses .25/.20/.20/.15/.20, and you can only publish at ≥7. Tick "Free public sample" for the landing-page teaser.

## Checks
`npm test` covers the score formula, webhook idempotency, stale-event re-fetch and snapshot validation. `npm run build` runs the type-check.

## Before taking money
- Fill in every `[BRACKET]` in `app/legal/*`.
- Don't add claims you can't prove: no "registered"/®, "patented", "SOC 2/PCI certified" or "guaranteed profit". UK law (DMCC Act 2024, CAP Code, s.95 TMA 1994) applies.
- Get gap data only from sources whose terms allow commercial use. Don't scrape Reddit, Amazon or G2.
