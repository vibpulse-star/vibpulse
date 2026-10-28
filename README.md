# VibPulse Apps

Three installable apps (PWAs) that run on Android and Windows from one hosted copy:

| App | Path | What it does |
|-----|------|--------------|
| Skill Tree | `skill-tree/` | Skills with parent/child unlocks, levels 0–5, XP total |
| War Room | `war-room/` | Daily mission + prioritised task board (To do → In progress → Blocked → Done) |
| Gap Mining | `gap-mining/` | Score gaps: Market 0.25 + Growth 0.20 + Competition 0.20 + Fit 0.15 + Profit 0.20 |

All work offline after first load. Data stays on each device; use **Export backup / Import backup** to move it between phone and PC.

## Go live (one-time)

1. Merge to `main`.
2. GitHub → repo **Settings → Pages → Source: GitHub Actions**. The workflow deploys to `https://vibpulse-star.github.io/vibpulse/`.

## Install

- **Android:** open the app URL in Chrome → tap **Install app** → icon lands on your home screen.
- **Windows:** open the app URL in Edge or Chrome → click **Install app** → it appears in Start; right-click to pin to taskbar/desktop.
  Fallback: `powershell -ExecutionPolicy Bypass -File .\setup-desktop.ps1` creates desktop shortcuts.

## Develop

- `python3 -m http.server` then open `http://localhost:8000/`.
- Changed icons/app list? `python3 tools/build_assets.py`. Changed app files? Bump `v1` in `tools/build_assets.py` so installed apps pick up the update.
- Tests: `node tests/score.test.mjs`.
