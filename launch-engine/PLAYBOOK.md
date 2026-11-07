# Launch Playbook

The reasoning behind `tasks.toml`. Evidence tags: **[Certain]** primary source, **[Likely]** good secondary source, **[Guessing]** inference.

## The five laws

1. **A launch is a repeatable event, not a day.** [Certain] Plausible hit the HN front page and still took 324 days to reach ~$400 MRR. Tally's 2.0 relaunch raised weekly signups 91%. Raycast and Cal.com relaunched each new surface. Every manifest ends with `next-launch`.
2. **Audience before launch.** [Likely] Product Hunt and X reward an audience you already have. Tally had 500-1,500 community members before its PH #1. Levels' X audience drove more than 50% of Photo AI traffic. A cold launch gets buried.
3. **Self-serve before launch, not polish.** [Certain] PostHog launched 4-5 weeks after writing its first code, once strangers could deploy unaided. Show HN rejects signup-gated products.
4. **Never ask for votes.** [Certain] HN bans it. PH detects and penalises coordinated voting. Say "we're live, feedback welcome".
5. **Judge the launch by activation and revenue, not rank.** [Likely] Raycast placed #8 on launch day and won anyway. The kill threshold is set before launch, so the result can't be rationalised afterwards.

## Channel choice

| Product type | Primary | Secondary | Skip |
|---|---|---|---|
| Dev tool / open source | hn, twitter | producthunt, reddit, directories | ltd |
| Prosumer / productivity SaaS | producthunt, email | twitter, reddit, indiehackers | |
| B2B SaaS | email, linkedin | producthunt, directories | reddit (mostly) |
| Mobile app | appstore, twitter | producthunt, reddit | hn (unless technical) |
| Info product / template | twitter, email | reddit, indiehackers | hn |

[Guessing] This matrix is my synthesis. Trust your own retro data over it once you have two launches.

## Positioning that works

- **"Open-source / cheaper X alternative."** [Certain] Cal.com ("open-source Calendly alternative") got 1.4k upvotes and #1 of the day, week and month.
- **A contrarian essay the product embodies.** [Certain] Plausible's "leave Google Analytics" post.
- **Dunford's five:** competitive alternatives, unique attributes, value, best-fit customer, category. Write these before any copy.

## Launch-week variant (for mature products)

Supabase / Vercel model: fixed date, flexible scope. Ship one item per day for five days, each with a blog post, a technical thread and a demo. Announce ~2 weeks ahead and run a retro afterwards. [Certain] To use it, create five manifests with consecutive `launch_date`s.

## Failure modes the gates exist to stop

| Failure | Gate / task |
|---|---|
| Launching to no one | `waitlist-page`, `bip-start`, `reddit-karma` |
| Signup-gated "launch" | `self-serve`, `hn-eligibility` |
| Can't tell which channel worked | `analytics` |
| Spike hits broken signup | `load-check` |
| Absent on launch day | `launch-day-block` |
| One launch, then silence | `next-launch`, `retro` |
| Using an LTD as validation | `ltd-decision` only after `verdict` |

## Sources

- Show HN rules: https://news.ycombinator.com/showhn.html
- Tally: https://blog.tally.so/year-1-how-we-bootstrapped-tally-to-11k-users-and-5k-mrr/ · https://blog.tally.so/our-bootstrapped-journey-towards-100k-mrr/
- Plausible: https://plausible.io/blog/bootstrapping-saas
- PostHog: https://news.ycombinator.com/item?id=22376732 · https://newsletter.posthog.com/p/how-we-got-our-first-1000-users
- Cal.com: https://www.producthunt.com/stories/how-this-open-source-calendly-alternative-rocketed-to-product-of-the-day
- Superhuman PMF engine: https://blog.superhuman.com/how-superhuman-built-an-engine-to-find-product-market-fit/
- Supabase launch weeks: https://supabase.com/blog/supabase-how-we-launch
- Small-team launch weeks: https://evilmartians.com/chronicles/how-to-do-launch-weeks-for-developer-tools-startups-and-small-teams
- Lenny on PH (paywalled): https://www.lennysnewsletter.com/p/how-to-successfully-launch-on-product
- Raycast PH history: https://hunted.space/dashboard/raycast/launches/raycast-1-0

Gaps: the PH algorithm claims come from third-party blogs, the AppSumo revenue split varies by contract, and Apple's featuring process wasn't verified against Apple's docs.
