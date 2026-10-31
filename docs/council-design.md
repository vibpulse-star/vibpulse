# Design Document: VibPulse — Gap-Mining, War Room, Skill Tree
Council: Strategist, Architect, Pathfinder, Skeptic, Herald | Backend: sequential | R2/R3 conducted by Steward (positions converged; one live tension)

## Overview
One Next.js (App Router) app with three route groups, one Supabase Postgres, one Stripe webhook. Installable PWAs (one manifest per section). No Tauri/Capacitor in v1.
- `/` Gap-Mining (public, paid): sample report, email capture, Stripe Checkout + Portal, members gap archive.
- `/war-room` (owner only): MRR + subscriber count (from `subscriptions`), today's 3 priorities, newest gaps ≥7, gap entry form.
- `/skill-tree` (owner only): graph rendered from latest `skill_snapshots` row.

## Architecture
Tables: profiles, subscriptions, stripe_events (idempotency PK), gaps (6-type enum, 5 factor scores, generated weighted `score`), gap_sources, skill_snapshots (jsonb).
Auth: Supabase magic link. Middleware + RLS: owner routes require email == OWNER_EMAIL; published gaps require active subscription.
Webhook `/api/stripe/webhook`: raw-body signature verify → insert event.id (dupe = skip) → upsert subscription on checkout.session.completed / customer.subscription.updated|deleted / invoice.payment_failed. Nightly reconcile later.
Skill snapshot: Windows Scheduled Task (registered by setup-desktop.ps1) walks ~/.claude skills/plugins, POSTs names + descriptions ONLY with bearer secret to `/api/skill-snapshot`.
Hosting: Netlify/Cloudflare free tier (Vercel Hobby bans commercial use). Est. < £50 for the 30-day test.

## Monetization (Herald)
"Weekly Gap Drop": 3 scored reports/week. OWNER DECISION: Pro £149/mo (council proposed £19 + £12 founding; overruled). Web-only purchase (Play Billing rule).
30-day gates: visitor→email ≥8%, ≥10 paid, report views ≥40%. Miss → pivot/drop.

## Risk Assessment (Skeptic)
1. NO spec claims in UI/copy: "registered trademark", "patented", SOC 2/ISO/PCI/HIPAA/FCA "certified", "guarantee zero defects/max profit". Use ™ only.
2. No scraping Reddit/Amazon/G2/Capterra. v1 gaps are owner-curated with cited sources; no personal data stored.
3. Unsigned webhook = free access. Verified + idempotent, entitlement from Stripe state only.
4. Owner routes default-deny; enable MFA on the auth provider.
5. Privacy policy, terms of sale, cancellation via Stripe Portal before taking money.

## Quality Strategy
Tests only where money/security live: webhook signature + idempotency, owner gate, score formula.

## Tension Resolutions
- Herald (concierge: Payment Link + newsletter, no app) vs Architect (build app). RESOLVED → build the app (user's explicit ask), but content stays concierge: Iain writes gaps via War Room form. Webhook kept (small, and Skeptic needs entitlement server-side).
- User chose "wrapped" core vs Pathfinder/Architect "PWA only". RESOLVED → PWA v1; TWA/Tauri only after validation, if ever.
- Spec scope (K8s, ML, 50 sources, SOC 2, 100% coverage) vs £400. RESOLVED → cut; re-add triggers in Strategist table (load, B2B request, 50+ gaps with outcomes, >4h/wk manual effort).
- RESOLVED (owner) → build all 3: Gap-Mining public website, War Room + Skill Tree owner-only.

## Decision Log
Single app/3 routes; Supabase; Stripe hosted; PWA; owner-curated data; no false claims; snapshot names-only.
