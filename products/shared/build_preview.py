"""Pack every product's Etsy/Payhip listing into one JSON file for the dashboard's
Preview tab: the copy from each LISTING.md, the listing images, the PDF guide
pages and the files buyers download. Images are embedded as JPEG data URLs.

Usage: python3 build_preview.py OUT.json
"""
import base64
import io
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from openpyxl import load_workbook
from PIL import Image

P = Path(__file__).resolve().parents[1]
PRODUCTS = [  # folder, name, kind, launch, full, checks
    ("sole-trader-tracker", "Sole Trader Quarterly Tracker 2026-27", "Product", 8.99, 14.99, 191),
    ("landlord-tracker", "UK Landlord Rental Tracker 2026-27", "Product", 9.99, 16.99, 70),
    ("etsy-seller-tracker", "UK Etsy Seller Profit Tracker", "Product", 7.99, 12.99, 4021),
]
BUNDLES = [  # section heading in bundles/LISTING.md, name, zip, cover, parts, price
    ("MTD Duo", "MTD Duo bundle", "MTD-Duo.zip", "MTD-Duo-cover.jpg", ["sole-trader-tracker", "landlord-tracker"], 19.99),
    ("Etsy Seller Tax Kit", "Etsy Seller Tax Kit bundle", "Etsy-Seller-Tax-Kit.zip", "Etsy-Seller-Tax-Kit-cover.jpg",
     ["etsy-seller-tracker", "sole-trader-tracker"], 16.99),
]


def data_url(img, width):
    img = img.convert("RGB")
    img.thumbnail((width, width * 2))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=76, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def guide_pages(pdf):
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdftoppm", "-r", "60", "-jpeg", str(pdf), f"{tmp}/p"], check=True)
        return [data_url(Image.open(f), 620) for f in sorted(Path(tmp).glob("p-*.jpg"))]


def blocks(text):
    return re.findall(r"```\n(.*?)\n```", text, re.S)


def field(text, label):
    m = re.search(rf"\*\*{label}:\*\*\s*(.+)", text)
    return m.group(1).strip() if m else ""


def files(folder):
    return [{"name": f.name, "size_kb": round(f.stat().st_size / 1024)} for f in sorted((P / folder / "dist").iterdir())]


rows = []
for folder, name, kind, launch, full, checks in PRODUCTS:
    md = (P / folder / "LISTING.md").read_text(encoding="utf-8")
    title, tags, desc = blocks(md)[:3]
    blank = next(f for f in (P / folder / "dist").glob("*.xlsx") if "EXAMPLE" not in f.name)
    imgs = sorted((P / folder / "listing").glob("*.jpg"))
    rows.append({
        "product": name, "kind": kind, "launch_gbp": launch, "full_gbp": full, "checks_passed": checks,
        "etsy_title": title, "etsy_title_len": len(title), "tags": [t.strip() for t in tags.split(",")],
        "description": desc,
        "payhip_name": field(md, "Product name") or field(md, "Name"),
        "payhip_short": field(md, "Short description"),
        "images": [data_url(Image.open(f), 900) for f in imgs], "image_names": [f.name for f in imgs],
        "guide_pages": guide_pages(next((P / folder / "dist").glob("*Guide.pdf"))),
        "files": files(folder), "tabs": load_workbook(blank, read_only=True).sheetnames,
    })

bmd = (P / "bundles" / "LISTING.md").read_text(encoding="utf-8")
for heading, name, zipname, cover, parts, price in BUNDLES:
    sec = bmd.split(f"## {heading}\n", 1)[1].split("\n## ", 1)[0]
    title, desc = blocks(sec)[:2]
    tags = re.search(r"\*\*Tags:\*\* `(.*?)`", sec).group(1)
    part_rows = [r for r in rows if r["product"] in {n for f, n, *_ in PRODUCTS if f in parts}]
    rows.append({
        "product": name, "kind": "Bundle", "launch_gbp": price, "full_gbp": price, "checks_passed": None,
        "etsy_title": title, "etsy_title_len": len(title), "tags": [t.strip() for t in tags.split(",")],
        "description": desc, "payhip_name": name.replace(" bundle", ""), "payhip_short": desc.split("\n")[0],
        # Etsy order: bundle cover first, then images 02-08 of the first product in the bundle.
        "images": [data_url(Image.open(P / "bundles" / "listing" / cover), 900)] + part_rows[0]["images"][1:],
        "image_names": [cover] + part_rows[0]["image_names"][1:],
        "guide_pages": [],
        "files": [{"name": zipname, "size_kb": round((P / "bundles" / "dist" / zipname).stat().st_size / 1024)}],
        "tabs": [],
    })

for r in rows:  # the limits Etsy enforces, checked before anything is uploaded
    assert r["etsy_title_len"] <= 140, r["product"]
    assert len(r["tags"]) == 13 and max(map(len, r["tags"])) <= 20, r["product"]
    assert len(r["images"]) <= 10 and all(i.startswith("data:image/jpeg;base64,") for i in r["images"])

out = Path(sys.argv[1] if len(sys.argv) > 1 else "preview.json")
out.write_text(json.dumps(rows), encoding="utf-8")
print(f"{len(rows)} listings, {out.stat().st_size / 1e6:.1f} MB ->", out)
