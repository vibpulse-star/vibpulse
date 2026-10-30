#!/usr/bin/env python3
"""Generate Android launcher icons, Android icon-pack (home-screen theme) assets,
and Windows ICO/MSIX tile assets from one spec. Pillow is the only dependency.

Usage:
  python forge.py spec.json --out build/icons        # one icon or a list of icons
  python forge.py --selftest
"""
import argparse, json, os, re, sys, tempfile
from PIL import Image, ImageDraw, ImageFont, ImageOps

MASTER = 1024
ANDROID_DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
ICO_SIZES = [16, 20, 24, 32, 40, 48, 64, 128, 256]
MSIX_SCALES = [100, 125, 150, 200, 400]
# name -> (width, height) at scale-100
MSIX_TILES = {
    "Square44x44Logo": (44, 44), "SmallTile": (71, 71), "Square150x150Logo": (150, 150),
    "Wide310x150Logo": (310, 150), "LargeTile": (310, 310), "StoreLogo": (50, 50),
    "SplashScreen": (620, 300),
}
TARGET_SIZES = [16, 24, 32, 48, 256]

FONT_CANDIDATES = {
    "emoji": ["/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", "C:/Windows/Fonts/seguiemj.ttf",
              "/System/Library/Fonts/Apple Color Emoji.ttc"],
    "text": ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf",
             "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"],
}


def hex_rgba(h, a=255):
    h = h.lstrip("#")
    if not re.fullmatch(r"[0-9a-fA-F]{6}", h):
        raise ValueError(f"bad colour {h!r}, expected #RRGGBB")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def find_font(kind, override=None):
    for p in ([override] if override else []) + FONT_CANDIDATES[kind]:
        if p and os.path.exists(p):
            return p
    raise FileNotFoundError(f"no {kind} font found; set \"font\" in the spec")


def make_background(spec, size):
    """Solid colour or vertical/diagonal two-stop gradient."""
    stops = spec.get("bg", ["#3D5AFE"])
    stops = [stops] if isinstance(stops, str) else stops
    a, b = hex_rgba(stops[0]), hex_rgba(stops[-1])
    grad = Image.linear_gradient("L").resize((size, size))
    if spec.get("gradient", "diagonal") == "diagonal":
        grad = Image.blend(grad, grad.transpose(Image.Transpose.TRANSPOSE), 0.5)  # (x+y)/2
    return Image.composite(Image.new("RGBA", (size, size), b), Image.new("RGBA", (size, size), a), grad)


def render_glyph(spec, size):
    """Transparent square with the glyph (emoji or short text) filling ~it."""
    glyph = spec["glyph"]
    is_emoji = any(ord(c) > 0x2000 for c in glyph)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if is_emoji:
        # Bitmap emoji fonts (Noto) only ship one strike (109px): render there, then scale.
        font_path = find_font("emoji", spec.get("font"))
        try:
            font = ImageFont.truetype(font_path, 109)
        except OSError:
            font = ImageFont.truetype(font_path, 128)
        tmp = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        ImageDraw.Draw(tmp).text((256, 256), glyph, font=font, anchor="mm", embedded_color=True)
        if tmp.getbbox():
            canvas.alpha_composite(fit(tmp.crop(tmp.getbbox()), size), (0, 0))
            return canvas
        # Symbol not in the emoji font (e.g. ✎): fall through to the text font.
    font_path = find_font("text", spec.get("font"))
    font = ImageFont.truetype(font_path, size)
    tmp = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((size, size), glyph, font=font, anchor="mm", fill=hex_rgba(spec.get("fg", "#FFFFFF")))
    tmp = tmp.crop(tmp.getbbox())
    canvas.alpha_composite(fit(tmp, size), (0, 0))
    return canvas


def fit(img, size):
    """Scale img to fit inside size x size, centred on a transparent square."""
    img = ImageOps.contain(img, (size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.alpha_composite(img, ((size - img.width) // 2, (size - img.height) // 2))
    return out


def load_layers(spec, base_dir):
    """Return (background, foreground_art) at MASTER size. Foreground is transparent art, unpadded."""
    bg = make_background(spec, MASTER)
    if "image" in spec:
        img = Image.open(os.path.join(base_dir, spec["image"])).convert("RGBA")
        if img.getextrema()[3][0] == 255:  # fully opaque: treat as full-bleed artwork
            return ImageOps.fit(img, (MASTER, MASTER), Image.LANCZOS), None
        return bg, fit(img.crop(img.getbbox()), MASTER)
    if "glyph" in spec:
        return bg, render_glyph(spec, MASTER)
    raise ValueError(f"icon {spec.get('name')!r} needs \"glyph\" or \"image\"")


def pad(art, size, ratio):
    """Place art centred at `ratio` of a size x size transparent canvas."""
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if art is not None:
        inner = round(size * ratio)
        out.alpha_composite(art.resize((inner, inner), Image.LANCZOS), ((size - inner) // 2,) * 2)
    return out


def monochrome(fg):
    """White silhouette from foreground alpha; Android 13+ tints it for themed icons."""
    white = Image.new("RGBA", fg.size, (255, 255, 255, 255))
    white.putalpha(fg.getchannel("A"))
    return white


def mask(img, shape):
    size = img.width
    m = Image.new("L", (size * 4, size * 4), 0)
    d = ImageDraw.Draw(m)
    if shape == "circle":
        d.ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    else:  # squircle-ish rounded square, as used by most launchers / Windows 11
        d.rounded_rectangle((0, 0, size * 4 - 1, size * 4 - 1), radius=size * 4 * 0.22, fill=255)
    out = img.copy()
    out.putalpha(Image.composite(img.getchannel("A"), Image.new("L", img.size, 0), m.resize(img.size, Image.LANCZOS)))
    return out


def compose(bg, art, size, ratio):
    out = bg.resize((size, size), Image.LANCZOS)
    out.alpha_composite(pad(art, size, ratio))
    return out


def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    return path


def build_android(spec, bg, art, out):
    res = os.path.join(out, "android", "res")
    # Adaptive layers are 108dp; art lives in the 66dp safe zone (61%) unless overridden.
    ratio = spec.get("safe_zone", 0.61)
    fg_master = pad(art, MASTER, ratio)
    for dens, k in ANDROID_DENSITIES.items():
        d = os.path.join(res, f"mipmap-{dens}")
        layer = round(108 * k)
        save(bg.resize((layer, layer), Image.LANCZOS), os.path.join(d, "ic_launcher_background.png"))
        save(fg_master.resize((layer, layer), Image.LANCZOS), os.path.join(d, "ic_launcher_foreground.png"))
        save(monochrome(fg_master).resize((layer, layer), Image.LANCZOS), os.path.join(d, "ic_launcher_monochrome.png"))
        legacy = round(48 * k)
        full = compose(bg, art, legacy, 0.70)
        save(mask(full, "squircle"), os.path.join(d, "ic_launcher.png"))
        save(mask(full, "circle"), os.path.join(d, "ic_launcher_round.png"))
    xml = ('<?xml version="1.0" encoding="utf-8"?>\n'
           '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
           '    <background android:drawable="@mipmap/ic_launcher_background"/>\n'
           '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
           '    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>\n'
           '</adaptive-icon>\n')
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        p = os.path.join(res, "mipmap-anydpi-v26", name)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(xml)
    # Play Store: 512x512 full-square, Google applies the mask itself.
    save(compose(bg, art, 512, 0.70).convert("RGB"), os.path.join(out, "android", "play_store_512.png"))


def build_windows(spec, bg, art, out):
    win = os.path.join(out, "windows")
    master = compose(bg, art, 256, 0.78)
    os.makedirs(win, exist_ok=True)
    mask(master, "squircle").save(os.path.join(win, "app.ico"), sizes=[(s, s) for s in ICO_SIZES])
    assets = os.path.join(win, "Assets")
    for name, (w, h) in MSIX_TILES.items():
        for sc in MSIX_SCALES:
            W, H = round(w * sc / 100), round(h * sc / 100)
            tile = bg.resize((max(W, H),) * 2, Image.LANCZOS).crop(((max(W, H) - W) // 2, (max(W, H) - H) // 2,
                                                                     (max(W, H) + W) // 2, (max(W, H) + H) // 2))
            side = min(W, H)
            # Logo occupies ~2/3 of the short side for tiles, nearly full for the small app-list logo.
            ratio = 0.85 if name in ("Square44x44Logo", "StoreLogo") else 0.60
            tile.alpha_composite(pad(art, side, ratio), ((W - side) // 2, (H - side) // 2))
            save(tile, os.path.join(assets, f"{name}.scale-{sc}.png"))
    for t in TARGET_SIZES:  # taskbar / Start list: transparent "unplated" variant
        art_only = pad(art, t, 0.92) if art is not None else compose(bg, None, t, 0)
        save(art_only, os.path.join(assets, f"Square44x44Logo.targetsize-{t}_altform-unplated.png"))
        save(compose(bg, art, t, 0.80), os.path.join(assets, f"Square44x44Logo.targetsize-{t}.png"))


def build_pack(specs, rendered, out):
    """Android icon pack (Nova/Lawnchair/etc. 'home-screen theme'): drawables + appfilter.xml."""
    pack = os.path.join(out, "iconpack", "res")
    filters, drawables = [], []
    for spec, (bg, art) in zip(specs, rendered):
        name = slug(spec["name"])
        icon = mask(compose(bg, art, 192, 0.66), spec.get("pack_shape", "squircle"))
        save(icon, os.path.join(pack, "drawable-nodpi", f"{name}.png"))
        drawables.append(f'    <item drawable="{name}" />')
        for comp in spec.get("components", []):
            filters.append(f'    <item component="ComponentInfo{{{xml_escape(comp)}}}" drawable="{name}" />')
    os.makedirs(os.path.join(pack, "xml"), exist_ok=True)
    with open(os.path.join(pack, "xml", "appfilter.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n' + "\n".join(filters) + "\n</resources>\n")
    with open(os.path.join(pack, "xml", "drawable.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <version>1</version>\n'
                '    <category title="All" />\n' + "\n".join(drawables) + "\n</resources>\n")


def build_preview(specs, rendered, out):
    """Contact sheet: Android circle / squircle / themed mono, Windows tile, ICO 32px."""
    cell, cols = 160, 5
    sheet = Image.new("RGBA", (cell * cols, cell * len(specs)), (32, 33, 36, 255))
    for row, (bg, art) in enumerate(rendered):
        full = compose(bg, art, 128, 0.70)
        mono_bg = Image.new("RGBA", (128, 128), (60, 64, 72, 255))
        mono_bg.alpha_composite(Image.composite(
            Image.new("RGBA", (128, 128), (200, 210, 255, 255)), Image.new("RGBA", (128, 128), (0, 0, 0, 0)),
            pad(art, 128, 0.61).getchannel("A")))
        tiles = [mask(full, "circle"), mask(full, "squircle"), mask(mono_bg, "circle"),
                 compose(bg, art, 128, 0.60), compose(bg, art, 32, 0.78).resize((128, 128), Image.NEAREST)]
        for col, t in enumerate(tiles):
            sheet.alpha_composite(t, (col * cell + 16, row * cell + 16))
    return save(sheet, os.path.join(out, "preview.png"))


def slug(s):
    return re.sub(r"[^a-z0-9_]", "_", s.lower()).strip("_") or "icon"


def xml_escape(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


def run(spec_path, out, targets):
    with open(spec_path, encoding="utf-8") as f:
        data = json.load(f)
    specs = data if isinstance(data, list) else [data]
    base = os.path.dirname(os.path.abspath(spec_path))
    rendered = [load_layers(s, base) for s in specs]
    for spec, (bg, art) in zip(specs, rendered):
        dest = os.path.join(out, slug(spec["name"])) if len(specs) > 1 else out
        if "android" in targets:
            build_android(spec, bg, art, dest)
        if "windows" in targets:
            build_windows(spec, bg, art, dest)
    if "pack" in targets:
        build_pack(specs, rendered, out)
    return build_preview(specs, rendered, out)


def selftest():
    with tempfile.TemporaryDirectory() as tmp:
        logo = Image.new("RGBA", (300, 200), (0, 0, 0, 0))
        ImageDraw.Draw(logo).ellipse((20, 20, 280, 180), fill=(255, 255, 255, 255))
        logo.save(os.path.join(tmp, "logo.png"))
        spec = [{"name": "Pulse", "glyph": "VP", "bg": ["#FF5F6D", "#FFC371"],
                 "components": ["com.example.pulse/com.example.pulse.MainActivity"]},
                {"name": "Logo", "image": "logo.png", "bg": "#101418"}]
        with open(os.path.join(tmp, "spec.json"), "w") as f:
            json.dump(spec, f)
        out = os.path.join(tmp, "out")
        run(os.path.join(tmp, "spec.json"), out, {"android", "windows", "pack"})
        r = os.path.join(out, "pulse", "android", "res")
        assert Image.open(os.path.join(r, "mipmap-xxxhdpi", "ic_launcher_foreground.png")).size == (432, 432)
        assert Image.open(os.path.join(r, "mipmap-mdpi", "ic_launcher.png")).size == (48, 48)
        mono = Image.open(os.path.join(r, "mipmap-xxxhdpi", "ic_launcher_monochrome.png"))
        assert mono.getextrema()[3][1] == 255 and mono.getpixel((0, 0))[3] == 0, "monochrome must be silhouette"
        assert "<monochrome" in open(os.path.join(r, "mipmap-anydpi-v26", "ic_launcher.xml")).read()
        ico = Image.open(os.path.join(out, "logo", "windows", "app.ico"))
        assert {(16, 16), (32, 32), (256, 256)} <= ico.info["sizes"]
        assert Image.open(os.path.join(out, "logo", "windows", "Assets", "Wide310x150Logo.scale-200.png")).size == (620, 300)
        af = open(os.path.join(out, "iconpack", "res", "xml", "appfilter.xml")).read()
        assert 'ComponentInfo{com.example.pulse/com.example.pulse.MainActivity}" drawable="pulse"' in af
        assert Image.open(os.path.join(out, "preview.png")).size == (800, 320)
    print("selftest ok")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("spec", nargs="?")
    ap.add_argument("--out", default="build/icons")
    ap.add_argument("--targets", default="android,windows,pack", help="comma list: android,windows,pack")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        selftest()
    elif not a.spec:
        ap.error("spec is required")
    else:
        print(run(a.spec, a.out, set(a.targets.split(","))))
