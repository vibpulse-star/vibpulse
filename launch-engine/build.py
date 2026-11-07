#!/usr/bin/env python3
"""Bundle app/ into ONE self-contained HTML file that runs from disk (file://) with no server.

python build.py   -> dist/launch-engine.html (used by the Android APK and the Windows installer)
Run `python launch.py export` first so the inlined task library and projects are current.
"""
import base64
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"
OUT = ROOT / "dist" / "launch-engine.html"


def inlineEngine(src):
    """engine.js ES module -> plain code plus an `E` namespace object (file:// can't load module imports)."""
    names = re.findall(r"^export (?:const|function) (\w+)", src, flags=re.M)
    return src.replace("export ", "") + f"\nconst E = {{ {', '.join(names)} }};\n"


def version():
    """Short git sha shown in the app so you can tell which build a device runs."""
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "local"


def buildHtml():
    html = (APP / "index.html").read_text(encoding="utf-8")
    css = (APP / "app.css").read_text(encoding="utf-8")
    app = (APP / "app.js").read_text(encoding="utf-8")
    data = json.loads((APP / "data.json").read_text(encoding="utf-8"))
    icon = "data:image/svg+xml;base64," + base64.b64encode((APP / "icon.svg").read_bytes()).decode()
    importLine = "import * as E from './engine.js';\n"
    assert importLine in app, "app.js import line changed; update build.py"
    # </ must not appear raw inside an inline <script>; JSON allows \/ as an escape.
    payload = json.dumps(data, separators=(",", ":")).replace("</", "<\\/")
    script = f"window.LAUNCH_VERSION = {json.dumps(version())};\nwindow.LAUNCH_DATA = {payload};\n" + inlineEngine((APP / "engine.js").read_text(encoding="utf-8")) + app.replace(importLine, "")
    swaps = [
        ('<link rel="stylesheet" href="app.css">', f"<style>\n{css}</style>"),
        ('<link rel="manifest" href="manifest.webmanifest">\n', ""),
        ('<link rel="apple-touch-icon" href="icon-192.png">\n', ""),
        ('href="icon.svg"', f'href="{icon}"'),
        ('src="icon.svg"', f'src="{icon}"'),
        ('<script type="module" src="app.js"></script>', f'<script type="module">\n{script}</script>'),
    ]
    for old, new in swaps:
        assert old in html, f"index.html changed; build.py can't find: {old.strip()}"
        html = html.replace(old, new)
    # file:// can't resolve module imports; fail the build rather than ship a blank app.
    assert not re.search(r"^\s*import\s", html, flags=re.M), "an ES import survived bundling"
    return html


if __name__ == "__main__":
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(buildHtml(), encoding="utf-8", newline="\n")
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
