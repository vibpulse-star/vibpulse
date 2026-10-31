"""Draw the VibPulse mark: a heartbeat line whose main spike is a 'V'. Output: art.png (1024, transparent)."""
import os
from PIL import Image, ImageDraw

S = 4 * 1024  # supersample, downscale for smooth edges
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
u = S / 100
pts = [(4, 55), (20, 55), (30, 18), (50, 84), (70, 18), (80, 55), (96, 55)]
pts = [(x * u, y * u) for x, y in pts]
w = int(12 * u)
d.line(pts, fill="white", width=w, joint="curve")
for x, y in (pts[0], pts[-1]):  # round caps
    d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill="white")
img.resize((1024, 1024), Image.LANCZOS).save(os.path.join(os.path.dirname(__file__), "art.png"))
