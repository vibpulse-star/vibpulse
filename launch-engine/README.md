# Launch Engine

One task library (`tasks.toml`) and one manifest per project (`projects/<slug>.toml`). Every project, current or future, launches from the same evidence-backed checklist. Lessons from each retro go back into the library, so the next launch starts smarter. The reasoning is in `PLAYBOOK.md`.

Requires Python 3.11+, stdlib only. Works in Windows PowerShell and Linux the same way.

```powershell
cd launch-engine
python launch.py new myapp --date 2026-12-08   # create manifest
# edit projects/myapp.toml: name, one_liner, audience, url, success_metric/target, kill_threshold, channels
python launch.py plan myapp                    # -> projects/myapp.plan.md (dated checklist, paste into Obsidian)
python launch.py done myapp positioning analytics
python launch.py gate myapp                    # GO / NO-GO, exit 1 if blocked
python launch.py status                        # overdue + next 3 across ALL projects
python test_launch.py                          # self-check
```

## The loop

1. `new`: commit to a date and to success/kill numbers before building hype.
2. `plan` + `done`: work the dated checklist. Tasks marked **[GATE]** block GO.
3. `gate`: run it the day before launch. NO-GO means move the date, not skip the gate.
4. Launch, then do the `retro` task at T+14: **edit `tasks.toml`** with what you learned. That edit is what makes this an engine and not just a checklist.
5. `next-launch` at T+30: create the next manifest. Launch again.

## Channels

`core` is always on. Opt in per manifest from: `email`, `twitter`, `producthunt`, `hn`, `reddit`, `linkedin`, `indiehackers`, `directories`, `appstore`, `ltd`. See the channel matrix in PLAYBOOK.md.
