# App launchers

Each app has its own folder, independent of the others:

| App | Opens |
|---|---|
| `gap-mining/` | https://claude.ai/artifact/DbSJahY6U5KLtgZrkwEZTT (Gap Mining Launch List) |
| `war-room/` | https://claude.ai/artifact/2PzxFJ5oDQHpnNjUeC7rD2 (War Room — Agentic OS) |
| `skill-tree/` | https://claude.ai/artifact/FdE6GAtPFz5Je6VLtAMAsZ (Agentic OS Skill Tree) |

## Android

1. On GitHub, go to **Actions → Build launcher APKs**, open the latest green run, and download `<app>-apk`.
2. Unzip it on the phone and tap `app-debug.apk`. Allow "install unknown apps" for your browser or file manager when prompted.
3. The icon appears in the app drawer. Long-press it and choose **Add to Home screen**.

Without GitHub, open `<app>/android` in Android Studio and choose **Build → Build APK(s)**.
Launchers that let you choose a custom icon image (Nova, Lawnchair) can also use `<app>/icon-512.png` on a normal browser shortcut.

## Windows

Copy the `<app>/windows` folder to your PC, then right-click `Install-Shortcut.ps1` and choose **Run with PowerShell**.
This adds the shortcut to the Desktop and to **Start → VibPulse**, and it opens in its own Edge app window.
To pin it, right-click the shortcut and choose **Pin to taskbar**.

## Changing where an icon points

Edit the URL in `APPS` in `make_launchers.py`, then run `python launchers/make_launchers.py <gradle-wrapper-dir>`.
