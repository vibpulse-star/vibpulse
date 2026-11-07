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

## Standalone apps (offline, no hosting)

| Platform | Get it | What it is |
|---|---|---|
| **Android** | Download `launch-engine.apk` from the `launch-engine` release, open it, and allow "Install unknown apps" | An offline app. It has no internet permission. Links open in your browser. |
| **Windows** | Download `launch-engine-windows.zip`, extract it, and double-click `Install.cmd` | An Edge app window with its own profile and Desktop and Start menu shortcuts. It needs no admin rights. |

CI builds both (`.github/workflows/launch-engine.yml`). To build them locally, run `python build.py` for `dist/launch-engine.html`, then `cd android && ./gradlew assembleDebug` (needs the Android SDK).

**Set this up before the first phone install.** The APK must always be signed with the same key. Otherwise Android refuses updates, and uninstalling to get round that erases the app's data. Create a key once on your PC:
```powershell
keytool -genkeypair -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
[Convert]::ToBase64String([IO.File]::ReadAllBytes("debug.keystore")) | Set-Clipboard
```
Paste the clipboard into GitHub → repo Settings → Secrets and variables → Actions as `ANDROID_DEBUG_KEYSTORE_B64`, and keep `debug.keystore` somewhere safe. Until that secret exists, CI builds the APK as a test artifact but won't publish it.

**Data safety**
- Data lives on each device.
- The Command screen nags when your last backup is more than 7 days old.
- Import and Reset can be undone from the ⋯ menu.
- Older backups still import. Channels this build doesn't know are kept and the app warns you.

## Interactive app (Windows + Android)

`app/` is an installable web app that works offline. It has:
- **Command**: portfolio totals, the overdue tasks to fix first, and a card per project with progress, GO/NO-GO and warnings.
- **Agenda**: open tasks across all projects for the next 14 days.
- **Project tabs**:
  - **Plan**: tick tasks off and filter by open, gates, overdue or channel.
  - **Gate**: what still blocks GO.
  - **Results**: enter the numbers to get a double down, pivot or kill verdict.
  - **Settings**: edit the project, or download its `.toml`.
- **Library**: the full task library and the reasoning behind each task.

```powershell
python launch.py export            # tasks.toml + projects/*.toml -> app/data.json
cd app; python -m http.server      # open http://localhost:8000, then Install app (Edge/Chrome)
node ..\tests\engine.test.mjs    # app logic tests (mirror test_launch.py)
```
To use it on your phone, host `app/` on any static host (GitHub Pages, or Cloudflare Pages next to Gap-Mining) and install it from Chrome on Android. Data stays on each device. Use **⋯ → Export backup / Import backup** to move it between PC and phone, and **Download manifest** to send app edits back to the CLI.

## Project kinds

| kind | Base plan | Use for |
|---|---|---|
| `saas` | full `core` (presell, legal, payments, analytics, launch day) | Gap-Mining |
| `digital` | `core` minus SaaS-only tasks, plus the `marketplace` channel | Etsy/Payhip trackers and bundles |
| `internal` | `internal` rollout plan: pick one build, deploy, install, back up, verdict | War Room, Skill Tree |

## Your portfolio (projects/)

The manifests come from what exists on your other branches. Targets marked PROPOSED need your sign-off.
- `sole-trader-tracker`, `landlord-tracker`, `etsy-seller-tracker` and `tax-bundles` launch on staggered Tuesdays so they're live before the January Self Assessment rush. Listing copy and images already exist and are marked done.
- `gap-mining` launches 2027-01-12. Its targets come from its own council doc: at least 10 paid at T+30. It has 13 blockers, starting with legal placeholders, domain and Stripe.
- `war-room` and `skill-tree` are internal. Each has 2-3 duplicate builds, and the first gate is choosing one.

## The loop

1. `new`: commit to a date and to success/kill numbers before building hype.
2. `plan` + `done`: work the dated checklist. Tasks marked **[GATE]** block GO.
3. `gate`: run it the day before launch. NO-GO means move the date, not skip the gate.
4. Launch, then do the `retro` task at T+14: **edit `tasks.toml`** with what you learned. That edit is what makes this an engine and not just a checklist.
5. `next-launch` at T+30: create the next manifest. Launch again.

## Channels

`core` is always on. Opt in per manifest from: `email`, `twitter`, `producthunt`, `hn`, `reddit`, `linkedin`, `indiehackers`, `directories`, `play`, `ios`, `ltd`, `validation`, `marketplace`. Unknown ids are rejected. See the channel matrix in PLAYBOOK.md.
