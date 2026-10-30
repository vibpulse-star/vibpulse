"""Render Material Symbols glyphs and write icons.json for the home-screen icon pack.

python build_spec.py <MaterialSymbolsRounded[...].ttf> <....codepoints>
then: python ../../.claude/skills/icon-forge/scripts/forge.py icons.json --out out --targets pack
Font: github.com/google/material-design-icons/tree/master/variablefont (Apache 2.0).
"""
import colorsys, json, os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
# (pack name, Material Symbol, hue 0-360, launcher components: Pixel/Google first, then Samsung)
APPS = [
    ("Phone", "call", 140, ["com.google.android.dialer/com.google.android.dialer.extensions.GoogleDialtactsActivity",
                            "com.samsung.android.dialer/com.samsung.android.dialer.DialtactsActivity"]),
    ("Messages", "chat", 210, ["com.google.android.apps.messaging/com.google.android.apps.messaging.ui.ConversationListActivity",
                               "com.samsung.android.messaging/com.android.mms.ui.ConversationComposer"]),
    ("Contacts", "contacts", 190, ["com.google.android.contacts/com.android.contacts.activities.PeopleActivity",
                                   "com.samsung.android.app.contacts/com.samsung.android.contacts.contactslist.PeopleActivity"]),
    ("Browser", "language", 225, ["com.android.chrome/com.google.android.apps.chrome.Main",
                                  "com.sec.android.app.sbrowser/com.sec.android.app.sbrowser.SBrowserMainActivity"]),
    ("Camera", "photo_camera", 330, ["com.google.android.GoogleCamera/com.android.camera.CameraLauncher",
                                     "com.sec.android.app.camera/com.sec.android.app.camera.Camera"]),
    ("Photos", "photo_library", 300, ["com.google.android.apps.photos/com.google.android.apps.photos.home.HomeActivity",
                                      "com.sec.android.gallery3d/com.samsung.android.gallery.app.activity.GalleryActivity"]),
    ("Mail", "mail", 0, ["com.google.android.gm/com.google.android.gm.ConversationListActivityGmail"]),
    ("Maps", "map", 160, ["com.google.android.apps.maps/com.google.android.maps.MapsActivity"]),
    ("Video", "smart_display", 350, ["com.google.android.youtube/com.google.android.youtube.app.honeycomb.Shell$HomeActivity"]),
    ("Store", "shopping_bag", 175, ["com.android.vending/com.android.vending.AssetBrowserActivity",
                                    "com.sec.android.app.samsungapps/com.sec.android.app.samsungapps.SamsungAppsMainActivity"]),
    ("Settings", "settings", 240, ["com.android.settings/com.android.settings.Settings"]),
    ("Calendar", "calendar_month", 260, ["com.google.android.calendar/com.android.calendar.event.LaunchInfoActivity",
                                         "com.samsung.android.calendar/com.samsung.android.app.calendar.activity.MainActivity"]),
    ("Clock", "schedule", 280, ["com.google.android.deskclock/com.android.deskclock.DeskClock",
                                "com.sec.android.app.clockpackage/com.sec.android.app.clockpackage.ClockPackage"]),
    ("Calculator", "calculate", 15, ["com.google.android.calculator/com.android.calculator2.Calculator",
                                     "com.sec.android.app.popupcalculator/com.sec.android.app.popupcalculator.Calculator"]),
    ("Files", "folder", 205, ["com.google.android.apps.nbu.files/com.google.android.apps.nbu.files.home.HomeActivity",
                             "com.sec.android.app.myfiles/com.sec.android.app.myfiles.common.MainActivity"]),
    ("Notes", "sticky_note_2", 50, ["com.google.android.keep/com.google.android.keep.activities.BrowseActivity",
                                    "com.samsung.android.app.notes/com.samsung.android.app.notes.memolist.MemoListActivity"]),
    ("Drive", "cloud", 235, ["com.google.android.apps.docs/com.google.android.apps.docs.app.NewMainProxyActivity"]),
    ("Chats", "forum", 125, ["com.whatsapp/com.whatsapp.Main"]),
    ("Music", "music_note", 115, ["com.spotify.music/com.spotify.music.MainActivity"]),
]


def gradient(hue):
    """Deep -> bright two-stop gradient at fixed saturation, so every icon belongs to one family."""
    def hx(h, l, s):
        return "#%02X%02X%02X" % tuple(round(c * 255) for c in colorsys.hls_to_rgb((h % 360) / 360, l, s))
    return [hx(hue, 0.42, 0.80), hx(hue + 35, 0.58, 0.95)]


def render(font_path, codepoints, symbol, out):
    font = ImageFont.truetype(font_path, 900)
    font.set_variation_by_axes([1, 0, 48, 500])  # FILL=1, GRAD=0, opsz=48, wght=500
    img = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((512, 512), chr(codepoints[symbol]), font=font, anchor="mm", fill="white")
    if not img.getbbox():
        raise SystemExit(f"symbol {symbol!r} rendered empty")
    img.save(out)


def main(font_path, cp_path):
    with open(cp_path, encoding="utf-8") as f:
        codepoints = {n: int(h, 16) for n, h in (line.split() for line in f if line.strip())}
    os.makedirs(os.path.join(HERE, "glyphs"), exist_ok=True)
    specs = []
    for name, symbol, hue, comps in APPS:
        rel = f"glyphs/{symbol}.png"
        render(font_path, codepoints, symbol, os.path.join(HERE, rel))
        specs.append({"name": name, "image": rel, "trim": False, "bg": gradient(hue), "components": comps})
    # Our own app keeps its brand art and colours.
    specs.append({"name": "VibPulse", "image": "../icons/vibpulse/art.png", "bg": ["#7C4DFF", "#00E5FF"],
                  "components": ["com.vibpulse.app/com.vibpulse.app.MainActivity"]})
    with open(os.path.join(HERE, "icons.json"), "w", encoding="utf-8") as f:
        json.dump(specs, f, indent=1, ensure_ascii=False)
    print(f"{len(specs)} icons -> icons.json")


if __name__ == "__main__":
    main(*sys.argv[1:3])
