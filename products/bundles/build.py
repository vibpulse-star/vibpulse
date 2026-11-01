"""Zip the bundle downloads and render one cover image per bundle.
Etsy allows 5 files per listing, so each bundle ships as a single zip.
Usage: python3 build.py   (run after the three products are built)"""
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "shared"))
from listing_kit import E, render  # noqa: E402

P = HERE.parent
BUNDLES = {
    "MTD-Duo": ("MTD Duo", "Sole trader and landlord", "£19.99", "£31.98",
                ["sole-trader-tracker", "landlord-tracker"],
                "Self-employment and property income count together for Making Tax Digital. Track both, quarter by quarter."),
    "Etsy-Seller-Tax-Kit": ("Etsy Seller Tax Kit", "Profit and tax records", "£16.99", "£27.98",
                            ["etsy-seller-tracker", "sole-trader-tracker"],
                            "True profit per product after every Etsy fee, and your MTD quarterly and SA103 totals."),
}
NAMES = {"sole-trader-tracker": "Sole Trader Quarterly Tracker", "landlord-tracker": "UK Landlord Rental Tracker",
         "etsy-seller-tracker": "UK Etsy Seller Profit Tracker"}

pages = []
for key, (name, sub, price, was, parts, pitch) in BUNDLES.items():
    z = HERE / "dist" / f"{key}.zip"
    z.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        for part in parts:
            for f in sorted((P / part / "dist").iterdir()):
                zf.write(f, f"{NAMES[part]}/{f.name}")
    imgs = "".join(f'<img src="file://{P / part / "listing" / "01-hero.jpg"}" style="width:100%;border-radius:22px;box-shadow:0 30px 70px rgba(31,42,55,.2)">'
                   for part in parts)
    pages.append((f"{key}-cover", f"""<div class=pad><div class=eyebrow>Bundle · {E(price)} instead of {E(was)}</div>
<h1>{E(name)}: <em>{E(sub)}</em></h1>
<p class=lede>{E(pitch)}</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px">{imgs}</div>
<div class=chips><span class=chip>2 trackers</span><span class=chip>2 PDF guides</span><span class="chip ghost">Excel + Google Sheets</span></div></div>"""))
    print("zipped", z.name, round(z.stat().st_size / 1024), "KB")

render(pages, "<p>Bundles have no guide of their own.</p>", HERE / "listing", HERE / "dist" / ".unused.pdf")
(HERE / "dist" / ".unused.pdf").unlink()
print("rendered", len(pages), "covers")
