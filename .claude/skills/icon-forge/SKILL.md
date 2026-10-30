---
name: icon-forge
description: Design icon artwork and generate complete Android launcher icons (adaptive + themed/monochrome + legacy + Play Store), Android icon packs for home-screen themes (Nova, Lawnchair, Niagara etc. via appfilter.xml), and Windows icons (multi-size .ico + MSIX/Start tile assets) from one spec. Use when asked for an app icon, launcher icon, home screen theme, icon pack, favicon-style app art, .ico, desktop shortcut icon, or Windows tile.
---

# Icon Forge

One spec → artwork → every Android + Windows icon asset, with a preview sheet to check before shipping.

Script: `.claude/skills/icon-forge/scripts/forge.py` (only needs `pip install pillow`).

## Workflow

1. **Brief.** Get per icon: name, concept, colours. If the user gave none, propose a palette and one concept per icon in one message; don't stall on it.
2. **Artwork.** Pick the cheapest source that meets the brief:
   - `glyph`: an emoji (`"☕"`) or 1–3 letters (`"VP"`). Fastest; good for monograms and theme packs.
   - `image`: a **transparent** PNG logo. If the user has none and wants custom art, draw it yourself as a 1024×1024 transparent PNG with Pillow (shapes, paths) or write an SVG and rasterise with `magick in.svg -background none -resize 1024x1024 out.png`. Keep it bold: it must read at 16px.
   - An **opaque** image is used full-bleed as the background (no themed icon silhouette). Tell the user.
3. **Spec** (`icons.json`, one object or a list):
   ```json
   [{"name": "VibPulse", "glyph": "VP", "bg": ["#7C4DFF", "#00E5FF"], "fg": "#FFFFFF",
     "components": ["com.vibpulse.app/com.vibpulse.app.MainActivity"]},
    {"name": "Logo", "image": "logo.png", "bg": "#101418", "safe_zone": 0.6}]
   ```
   Optional keys: `gradient` (`"diagonal"` default, `"vertical"`), `font` (path), `safe_zone` (adaptive foreground scale, default 0.61 = Android's 66dp/108dp), `pack_shape` (`"squircle"`/`"circle"`), `components` (icon-pack app mappings).
4. **Generate:** `python .claude/skills/icon-forge/scripts/forge.py icons.json --out build/icons [--targets android,windows,pack]`
5. **Review:** open `build/icons/preview.png` and look at it before reporting. Columns: Android circle, Android squircle, Android 13+ themed (monochrome), Windows tile, Windows 32px. Fix anything clipped, illegible at 32px, or empty in the themed column, then regenerate.
6. **Install** (only into projects the user named):
   - Android app: copy `android/res/*` into `app/src/main/res/`; manifest uses `@mipmap/ic_launcher` / `@mipmap/ic_launcher_round`. Upload `android/play_store_512.png` to Play Console.
   - Android icon pack: drop `iconpack/res/` into an icon-pack app module (any standard template; launchers read `res/xml/appfilter.xml`). Get component names on the phone with `adb shell cmd package resolve-activity --brief <pkg>`.
   - Windows desktop shortcut (PowerShell):
     ```powershell
     $s = (New-Object -ComObject WScript.Shell).CreateShortcut("$env:USERPROFILE\Desktop\App.lnk")
     $s.TargetPath = "C:\Path\App.exe"; $s.IconLocation = "C:\Path\app.ico,0"; $s.Save()
     ```
   - Windows MSIX/WinUI: copy `windows/Assets/*` into the project's `Assets/`; names match the default `Package.appxmanifest`.

## Output layout

```
<out>/[<name>/]android/res/mipmap-{mdpi..xxxhdpi}/ic_launcher{,_round,_foreground,_background,_monochrome}.png
                      res/mipmap-anydpi-v26/ic_launcher{,_round}.xml   (adaptive + <monochrome>)
               android/play_store_512.png
               windows/app.ico                                         (16–256 px)
               windows/Assets/{Square44x44Logo,SmallTile,Square150x150Logo,Wide310x150Logo,LargeTile,StoreLogo,SplashScreen}.scale-{100..400}.png
               windows/Assets/Square44x44Logo.targetsize-{16..256}[_altform-unplated].png
<out>/iconpack/res/drawable-nodpi/*.png, res/xml/{appfilter,drawable}.xml
<out>/preview.png
```
With one icon in the spec, the `<name>/` level is omitted.

## Rules
- Run `forge.py --selftest` after editing the script.
- Never overwrite existing launcher icons in a project without listing them to the user first.
- Don't ship trademarked third-party logos inside icon packs; use the user's own art or generic glyphs.

## Sources folded in
- `hitoshura25/claude-devtools` android-app-icon: adaptive layer layout and the check-before-deleting-legacy-icons step. Its Iconify network fetch was dropped; the user's own art is the source.
- `ehmo/platform-design-skills` android: Material guidance (themed icons, 48dp targets).
- `alonw0/web-asset-generator`: emoji/text → icon approach and preview-before-ship validation.
- Microsoft MSIX tile and Android adaptive-icon specs for sizes and safe zones.
