# VibPulse

One Next.js app on Cloudflare Workers, three products, installable as PWAs on Windows (Edge/Chrome → Install) and Android (Chrome → Add to Home screen).

| Route | Product | Access |
|---|---|---|
| `/`, `/gaps` | **Gap-Mining**: weekly scored market gaps, Stripe subscription | Public landing; archive for subscribers |
| `/war-room` | **War Room**: MRR, subscribers, today's priorities, gap alerts, gap entry | Owner only (`OWNER_EMAIL`) |
| `/skill-tree` | **Skill Tree**: map of your Claude skills/plugins, with overlaps | Owner only |

Design decisions are recorded in `docs/council-design.md`.

## Setup (Cloudflare Workers + D1, no other backend)
1. `npm install`, then `npx wrangler login`.
2. **Database**: run `npx wrangler d1 create vibpulse`, paste the `database_id` into `wrangler.jsonc`, then `npm run db:migrate`.
3. **Domain**: add your domain to Cloudflare. Set `SITE_URL` and `MAIL_FROM` in `wrangler.jsonc`, then add it under the Worker's Custom Domains. `workers_dev` is off so no unprotected URL exists.
4. **Owner login (Cloudflare Access, free)**: in Zero Trust → Access → Applications, add a self-hosted app for `<domain>/war-room*` and `<domain>/skill-tree*`, with a policy that allows only your email (one-time PIN or Google). Copy its Application Audience tag into `ACCESS_AUD`, and set `ACCESS_TEAM_DOMAIN` in `wrangler.jsonc`.
5. **Stripe**: create a recurring £149/month price, turn on the Customer Portal (allow cancellation), and copy the `price_…` id. No webhook is needed: access is checked live against Stripe.
6. **Email (sign-in links for returning subscribers)**: in Resend, verify the domain in `MAIL_FROM` and create an API key.
7. **Secrets**: run `npx wrangler secret put <NAME>` for each of `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `SESSION_SECRET` (32+ random chars), `ACCESS_AUD`, `SKILL_SNAPSHOT_TOKEN` (32+ random chars) and `RESEND_API_KEY`.
8. `npm run deploy`. For local testing: copy `.dev.vars.example` to `.dev.vars`, then run `npx wrangler d1 migrations apply vibpulse --local` and `npm run preview`.
9. **Windows PC**: run `.\setup-desktop.ps1 -SiteUrl https://<domain> -Token <SKILL_SNAPSHOT_TOKEN>`. It installs Git and Node and registers an hourly Skill Tree snapshot. Only skill names and descriptions leave the PC.

## How access works
- **Subscribers**: they pay through Stripe Checkout with no account. They come back to a signed 30-day cookie holding their Stripe customer id. On a new device they enter their email, and the site emails a 15-minute sign-in link. Every members-page view asks Stripe whether the subscription is active.
- **You**: Cloudflare Access sits in front of `/war-room` and `/skill-tree`, and the app also verifies the Access JWT, so a misconfigured rule still returns 404.

## Workflow
Write gaps in War Room → New gap. Score each factor 0–10. The weighted score uses .25/.20/.20/.15/.20, and you can only publish at ≥7. Tick "Free public sample" for the landing-page teaser.

## Checks
`npm test` covers the score formula, signed-token tampering, purpose and expiry, and snapshot validation. `npm run build` runs the type-check.

## Before taking money
- Fill in every `[BRACKET]` in `app/legal/*`.
- Don't add claims you can't prove: no "registered"/®, "patented", "SOC 2/PCI certified" or "guaranteed profit". UK law (DMCC Act 2024, CAP Code, s.95 TMA 1994) applies.
- Get gap data only from sources whose terms allow commercial use. Don't scrape Reddit, Amazon or G2.
