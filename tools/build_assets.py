"""Generate each app's manifest, service worker and icons. Run: python3 tools/build_assets.py"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
APPS = {
    "skill-tree": ("Skill Tree", "ST", "Level up your skills, branch by branch.", ["app.js"]),
    "war-room": ("War Room", "WR", "Today's mission and priority tasks.", ["app.js"]),
    "gap-mining": ("Gap Mining", "GM", "Score and rank market gaps.", ["app.js", "score.js"]),
}

SW = """const PREFIX = '{slug}-';
const CACHE = PREFIX + 'v1';
const FILES = {files};

self.addEventListener('install', (e) => {{
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
}});

// Only delete this app's old caches: all three apps share one origin.
self.addEventListener('activate', (e) => {{
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
}});

// Serve the cached copy instantly (works offline) and refresh it from the network in the background.
self.addEventListener('fetch', (e) => {{
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {{
    const cached = await cache.match(e.request, {{ ignoreSearch: true }});
    const fresh = fetch(e.request)
      .then((res) => {{ if (res.ok) cache.put(e.request, res.clone()); return res; }})
      .catch(() => cached);
    return cached || fresh;
  }}));
}});
"""


def icon(text, size, path):
    img = Image.new("RGB", (size, size), "#000000")
    d = ImageDraw.Draw(img)
    # Keep artwork inside the central 80% so Android's maskable crop never clips it.
    pad = size // 10
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=size // 8, outline="#00ff41", width=max(4, size // 40))
    font = ImageFont.truetype(FONT, size // 3)
    d.text((size / 2, size / 2), text, font=font, fill="#00ff41", anchor="mm")
    img.save(path)


for slug, (name, short, desc, scripts) in APPS.items():
    out = ROOT / slug
    icon(short, 192, out / "icon-192.png")
    icon(short, 512, out / "icon-512.png")
    manifest = {
        "name": name,
        "short_name": name,
        "description": desc,
        "id": "./",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "background_color": "#000000",
        "theme_color": "#000000",
        "icons": [
            {"src": f"icon-{s}.png", "sizes": f"{s}x{s}", "type": "image/png", "purpose": "any maskable"}
            for s in (192, 512)
        ],
    }
    (out / "manifest.webmanifest").write_text(json.dumps(manifest, indent=2) + "\n")
    files = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", *scripts,
             "../shared/app.css", "../shared/install.js", "../shared/store.js", "../shared/dom.js"]
    (out / "sw.js").write_text(SW.format(slug=slug, files=json.dumps(files)))
print("ok")
