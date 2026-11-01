"""Shared helpers for rendering listing images (2000x2000 JPG) and PDF guides.

Mockup numbers always come from LibreOffice's recalculation of the EXAMPLE
workbook, never typed by hand.
"""
import csv
import html
import json
import subprocess
import tempfile
from pathlib import Path

E = html.escape

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#1F2A37;--muted:#5B6675;--brand:#1D5C63;--brand2:#2F7C84;--soft:#E3EFEF;--cream:#FFFDF2;--paper:#F5F1E8;--line:#D5DCE0;--warn:#B4532A}
body{width:2000px;height:2000px;font-family:Inter,'DejaVu Sans',sans-serif;color:var(--ink);background:var(--paper);overflow:hidden;position:relative}
.pad{position:absolute;inset:0;padding:120px 130px;display:flex;flex-direction:column;gap:56px}
.eyebrow{font-size:38px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--brand2)}
h1{font-size:118px;line-height:1.02;font-weight:800;letter-spacing:-.025em;text-wrap:balance}
h1 em{font-style:normal;color:var(--brand)}
.lede{font-size:50px;line-height:1.35;color:var(--muted);max-width:1600px}
.chips{display:flex;gap:22px;flex-wrap:wrap}
.chip{font-size:36px;font-weight:600;padding:18px 34px;border-radius:999px;background:var(--brand);color:#fff}
.chip.ghost{background:transparent;color:var(--brand);border:4px solid var(--brand)}
.win{background:#fff;border-radius:28px;box-shadow:0 40px 90px rgba(31,42,55,.18);overflow:hidden;border:2px solid var(--line)}
.bar{height:74px;background:#EEF1F3;display:flex;align-items:center;gap:16px;padding:0 30px;border-bottom:2px solid var(--line)}
.bar i{width:22px;height:22px;border-radius:50%;background:#D0D6DB;display:block}
.bar span{margin-left:20px;font-size:28px;color:var(--muted)}
.tabs{display:flex;gap:4px;padding:0 24px;background:#F7F8F9;border-top:2px solid var(--line)}
.tabs b{font-size:26px;font-weight:500;color:var(--muted);padding:16px 20px}
.tabs b.on{background:#fff;color:var(--brand);font-weight:700;border-bottom:5px solid var(--brand)}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
th{background:var(--brand);color:#fff;font-weight:600;text-align:left}
td,th{border:2px solid var(--line);padding:14px 18px;font-size:29px;white-space:nowrap}
td.n,th.n{text-align:right}
tr.tot td{background:var(--soft);font-weight:700}
tr.due td{color:var(--warn);font-weight:700}
td.in{background:var(--cream)}
.tag{position:absolute;right:150px;bottom:110px;font-size:28px;color:var(--muted)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:34px}
.card{background:#fff;border-radius:26px;padding:46px 50px;border:2px solid var(--line)}
.card h3{font-size:46px;margin-bottom:14px;color:var(--brand)}
.card p{font-size:34px;line-height:1.4;color:var(--muted)}
.big{font-size:150px;font-weight:800;color:var(--brand);line-height:1}
"""

GUIDE_CSS = """
@page{size:A4;margin:22mm 20mm}
body{font-family:Inter,'DejaVu Sans',sans-serif;color:#1F2A37;font-size:11pt;line-height:1.55}
h1{font-size:26pt;color:#1D5C63;margin-bottom:4mm;line-height:1.15;font-weight:800}
h2{font-size:14pt;color:#1D5C63;margin:8mm 0 2mm;font-weight:700;break-after:avoid}
p,li{margin-bottom:2.2mm}
ul,ol{padding-left:6mm}
.muted{color:#5B6675}
.box{border:1.5pt solid #B4532A;border-radius:3mm;padding:4mm 5mm;margin:5mm 0}
.box b{color:#B4532A}
table{border-collapse:collapse;width:100%;font-size:10pt;margin:2mm 0}
td,th{border:0.8pt solid #D5DCE0;padding:1.6mm 2.4mm;text-align:left}
th{background:#1D5C63;color:#fff}
.page{break-before:page}
"""


def lo_csv(xlsx):
    """Every sheet of a workbook, recalculated by LibreOffice, as {sheet name: rows}."""
    tmp = Path(tempfile.mkdtemp())
    subprocess.run(["soffice", "--headless", "--convert-to",
                    'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,false,false,false,-1',
                    "--outdir", str(tmp), str(xlsx)], check=True, capture_output=True)
    stem = Path(xlsx).stem
    return {p.stem[len(stem) + 1:]: list(csv.reader(p.open(encoding="utf-8"))) for p in tmp.glob("*.csv")}


def gbp(v):
    try:
        x = float(v)
    except ValueError:
        return E(v)
    return f"£{x:,.2f}" if x >= 0 else f"-£{-x:,.2f}"


def uk(d):  # LibreOffice writes mm/dd/yyyy in this container's locale
    m, dd, y = d.split("/")
    return f"{dd}/{m}/{y}"


def window(title, tabs, active, inner):
    t = "".join(f'<b class="{"on" if x == active else ""}">{E(x)}</b>' for x in tabs)
    return (f'<div class="win"><div class="bar"><i></i><i></i><i></i><span>{E(title)}</span></div>'
            f'{inner}<div class="tabs">{t}</div></div>')


def table(head, rows, num_from=1, tot=()):
    h = "".join(f'<th class="{"n" if i >= num_from else ""}">{E(x)}</th>' for i, x in enumerate(head))
    b = ""
    for row in rows:
        cls = "tot" if row[0] in tot else ("due" if row[0] == "Update due by" else "")
        b += f'<tr class="{cls}">' + "".join(f'<td class="{"n" if i >= num_from else ""}">{x}</td>' for i, x in enumerate(row)) + "</tr>"
    return f"<table><tr>{h}</tr>{b}</table>"


def cards(items, cls="grid2"):
    return f'<div class="{cls}">' + "".join(f'<div class=card><h3>{E(a)}</h3><p>{E(b)}</p></div>' for a, b in items) + "</div>"


def render(pages, guide_html, img_dir, pdf_path):
    """pages: [(name, body_html)]. Writes NAME.jpg per page and the guide PDF."""
    work = Path(tempfile.mkdtemp())
    for name, body in pages:
        (work / f"{name}.html").write_text(f"<!doctype html><meta charset=utf-8><style>{CSS}</style>{body}", encoding="utf-8")
    (work / "guide.html").write_text(f"<!doctype html><meta charset=utf-8><style>{GUIDE_CSS}</style>{guide_html}", encoding="utf-8")
    img_dir, pdf_path = Path(img_dir).resolve(), Path(pdf_path).resolve()
    img_dir.mkdir(parents=True, exist_ok=True)
    js = f"""
const {{chromium}} = require('playwright');
(async () => {{
  const b = await chromium.launch();
  const p = await b.newPage({{viewport: {{width: 2000, height: 2000}}}});
  for (const n of {json.dumps([n for n, _ in pages])}) {{
    await p.goto('file://{work}/' + n + '.html');
    await p.screenshot({{path: '{img_dir}/' + n + '.jpg', type: 'jpeg', quality: 90}});
  }}
  const g = await b.newPage();
  await g.goto('file://{work}/guide.html');
  await g.pdf({{path: '{pdf_path}', format: 'A4', printBackground: true}});
  await b.close();
}})();
"""
    (work / "shot.js").write_text(js)
    subprocess.run(["node", str(work / "shot.js")], check=True)
