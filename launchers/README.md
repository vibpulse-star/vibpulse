# App launchers

Each app has its own folder, independent of the others:

| App | Opens |
|---|---|
| `gap-mining/` | https://claude.ai/artifact/DbSJahY6U5KLtgZrkwEZTT (Gap Mining Launch List) |
| `war-room/` | https://claude.ai/artifact/2PzxFJ5oDQHpnNjUeC7rD2 (War Room — Agentic OS) |
| `skill-tree/` | https://claude.ai/artifact/FdE6GAtPFz5Je6VLtAMAsZ (Agentic OS Skill Tree) |

## Android

Open the link on your phone, download, tap the file, and allow "Install unknown apps" when asked:

- Gap-Mining: https://github.com/vibpulse-star/vibpulse/releases/download/apk-gap-mining/gap-mining.apk
- War Room: https://github.com/vibpulse-star/vibpulse/releases/download/apk-war-room/war-room.apk
- Skill Tree: https://github.com/vibpulse-star/vibpulse/releases/download/apk-skill-tree/skill-tree.apk

Each link always serves the latest build (`.github/workflows/android-apks.yml`). Long-press the new icon in the app drawer and choose **Add to Home screen**.
Launchers that let you choose a custom icon image (Nova, Lawnchair) can also use `<app>/icon-512.png` on a normal browser shortcut.

## Windows

Copy the `<app>/windows` folder to your PC, then right-click `Install-Shortcut.ps1` and choose **Run with PowerShell**.
This adds the shortcut to the Desktop and to **Start → VibPulse**, and it opens in its own Edge app window.
To pin it, right-click the shortcut and choose **Pin to taskbar**.

## Changing where an icon points

Edit the URL in `APPS` in `make_launchers.py`, then run `python launchers/make_launchers.py <gradle-wrapper-dir>`.
