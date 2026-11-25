"""Lay the pack out as a 4-column home screen (out/homescreen.png) to judge it as a set."""
import json, os, re
from PIL import Image, ImageDraw, ImageFont

os.chdir(os.path.dirname(os.path.abspath(__file__)))
specs = json.load(open("icons.json", encoding="utf-8"))
cols, cell = 4, 220
W, H = cols * cell, -(-len(specs) // cols) * cell + 40
g = Image.linear_gradient("L").resize((W, H))
sheet = Image.merge("RGB", [g.point(lambda v: 20 + v // 8), g.point(lambda v: 22 + v // 10),
                            g.point(lambda v: 40 + v // 5)]).convert("RGBA")
try:
    font = ImageFont.truetype("DejaVuSans.ttf", 22)
except OSError:
    font = ImageFont.load_default()
d = ImageDraw.Draw(sheet)
for i, s in enumerate(specs):
    slug = re.sub(r"[^a-z0-9_]", "_", s["name"].lower())
    icon = Image.open(f"out/iconpack/res/drawable-nodpi/{slug}.png").resize((144, 144), Image.LANCZOS)
    x, y = (i % cols) * cell, (i // cols) * cell + 20
    sheet.alpha_composite(icon, (x + 38, y + 10))
    d.text((x + cell // 2, y + 180), s["name"], font=font, fill="white", anchor="mm")
sheet.convert("RGB").save("out/homescreen.png")
