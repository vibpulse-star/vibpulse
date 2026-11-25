"""Gap-Mining / War Room / Skill Tree app icons. Same glyph style as the icon pack.

python build.py <MaterialSymbolsRounded[...].ttf> <....codepoints>
then: python ../../../.claude/skills/icon-forge/scripts/forge.py icons.json --out out
"""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "iconpack"))
from build_spec import gradient, render

HERE = os.path.dirname(os.path.abspath(__file__))
APPS = [("Gap-Mining", "diamond", 155), ("War Room", "swords", 355), ("Skill Tree", "family_history", 268)]

if __name__ == "__main__":
    font, cp_path = sys.argv[1:3]
    with open(cp_path, encoding="utf-8") as f:
        cps = {n: int(h, 16) for n, h in (line.split() for line in f if line.strip())}
    os.makedirs(os.path.join(HERE, "glyphs"), exist_ok=True)
    specs = []
    for name, symbol, hue in APPS:
        rel = f"glyphs/{symbol}.png"
        render(font, cps, symbol, os.path.join(HERE, rel))
        specs.append({"name": name, "image": rel, "trim": False, "safe_zone": 0.72, "bg": gradient(hue)})
    with open(os.path.join(HERE, "icons.json"), "w", encoding="utf-8") as f:
        json.dump(specs, f, indent=1)
