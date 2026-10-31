---
name: apk-links
description: Give the user a direct download link for the APK of any Android app or project in this repo. Use whenever an Android app is created or changed, or when the user asks for an APK, download link, install link, "upload link", or how to get an app onto their phone.
---

# APK Links

Every Android project in this repo gets a stable, direct `.apk` link that always serves the newest build:

```
https://github.com/vibpulse-star/vibpulse/releases/download/apk-<app>/<app>.apk
```

`.github/workflows/android-apks.yml` makes this happen. Don't build APKs locally: this container can't reach the Android SDK host (`dl.google.com`).

## Convention (the workflow only finds projects that follow it)
- The project lives at `<anything>/<app>/android/` and has `gradlew` plus `app/build.gradle`.
- `<app>` is lowercase letters, digits and hyphens only, e.g. `war-room`. Other names are skipped.
- `gradlew` is executable in git (`git ls-files -s` shows `100755`).
- New launcher-style apps: add them to `APPS` in `launchers/make_launchers.py` and re-run it.

## Workflow when an app is added or changed
1. Commit and push. Any push touching `**/android/**` triggers the build. Pull-request runs only build; they don't publish.
2. Wait for the `Android APKs` run to finish. Don't promise a link before it is green.
3. Verify each link before sending it: `curl -sI <url>` must return `302`, with a `Location` that contains `filename%3D<app>.apk`. A `404` means it isn't published. Don't follow the redirect (`-L`): this container's proxy blocks the asset host (`objects.githubusercontent.com`), so a full download fails here even when the link works on a phone.
4. Send the user one link per app, plus the install steps:
   - Open the link on the phone and download.
   - Tap the file, then allow "Install unknown apps" for the browser when Android asks.
   - Long-press the new icon in the app drawer and choose **Add to Home screen**.
5. If the build failed, fix it and push again. Never send a link for a red build: the release still holds the older APK, and the user would get stale code.

## Gotchas
- **Updates over an installed app:** this only works if the repo secret `ANDROID_DEBUG_KEYSTORE_B64` is set (a base64 keystore). Without it, every build is signed with a fresh key, so the user must uninstall the old version first. Tell them so.
- **Pushes from any branch overwrite the same link.** That's fine for a solo repo. If someone else starts pushing, restrict publishing to `master`.
- These are unsigned-for-store debug builds. They are not for the Play Store.
- Windows has no APK. For desktop shortcuts, use the `windows/Install-Shortcut.ps1` that `launchers/make_launchers.py` generates.
