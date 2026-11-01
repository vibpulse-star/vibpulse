"""Render the 8 Etsy/Payhip listing images (2000x2000 JPG) and the PDF guide.

Every number shown in a mockup is read from the EXAMPLE workbook after
LibreOffice recalculates it, so the images match the real file.

Usage: python3 render.py ../dist ../listing
"""
import csv
import html
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import build_xlsx as b

dist = Path(sys.argv[1] if len(sys.argv) > 1 else "../dist")
out = Path(sys.argv[2] if len(sys.argv) > 2 else "../listing")
out.mkdir(parents=True, exist_ok=True)
work = Path(tempfile.mkdtemp())

subprocess.run(["soffice", "--headless", "--convert-to",
                'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,false,false,false,-1',
                "--outdir", str(work), str(dist / "Sole-Trader-Quarterly-Tracker-EXAMPLE.xlsx")],
               check=True, capture_output=True)


def sheet(name):
    p = next(work.glob(f"*-{name}.csv"))
    return list(csv.reader(p.open(encoding="utf-8")))


def gbp(v):
    try:
        x = float(v)
    except ValueError:
        return html.escape(v)
    return f"£{x:,.2f}" if x >= 0 else f"-£{-x:,.2f}"


def uk(d):  # LibreOffice CSV writes mm/dd/yyyy in this container's locale
    m, dd, y = d.split("/")
    return f"{dd}/{m}/{y}"


summary = sheet("Quarterly Summary")
expenses = sheet("Expenses")
year_end = sheet("Year End")
E = lambda s: html.escape(s)

CSS = """
@font-face{font-family:Inter;src:local('Inter')}
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#1F2A37;--muted:#5B6675;--brand:#1D5C63;--brand2:#2F7C84;--soft:#E3EFEF;--cream:#FFFDF2;--paper:#F5F1E8;--line:#D5DCE0;--warn:#B4532A}
body{width:2000px;height:2000px;font-family:Inter,'DejaVu Sans',sans-serif;color:var(--ink);background:var(--paper);overflow:hidden;position:relative}
.pad{position:absolute;inset:0;padding:120px 130px;display:flex;flex-direction:column;gap:56px}
.eyebrow{font-size:38px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--brand2)}
h1{font-size:118px;line-height:1.02;font-weight:800;letter-spacing:-.025em;color:var(--ink);text-wrap:balance}
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
.tabs b{font-size:26px;font-weight:500;color:var(--muted);padding:16px 22px}
.tabs b.on{background:#fff;color:var(--brand);font-weight:700;border-bottom:5px solid var(--brand)}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
th{background:var(--brand);color:#fff;font-weight:600;text-align:left}
td,th{border:2px solid var(--line);padding:14px 18px;font-size:29px;white-space:nowrap}
td.n,th.n{text-align:right}
tr.tot td{background:var(--soft);font-weight:700}
tr.sec td{color:var(--brand);font-weight:700;font-size:24px;letter-spacing:.08em;border-left:none;border-right:none}
tr.due td{color:var(--warn);font-weight:700}
td.in{background:var(--cream)}
.tag{position:absolute;right:150px;bottom:110px;font-size:28px;color:var(--muted)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:34px}
.card{background:#fff;border-radius:26px;padding:46px 50px;border:2px solid var(--line)}
.card h3{font-size:46px;margin-bottom:14px;color:var(--brand)}
.card p{font-size:34px;line-height:1.4;color:var(--muted)}
.note{font-size:34px;line-height:1.4;color:var(--warn);font-weight:600}
"""


def page(body, name):
    (work / f"{name}.html").write_text(f"<!doctype html><meta charset=utf-8><style>{CSS}</style>{body}", encoding="utf-8")
    return name


def window(title, tab, inner):
    tabs = "".join(f'<b class="{"on" if t == tab else ""}">{E(t)}</b>' for t in
                   ["Start Here", "Settings", "Income", "Expenses", "Mileage", "Quarterly Summary", "Year End"])
    return (f'<div class="win"><div class="bar"><i></i><i></i><i></i><span>{E(title)}</span></div>'
            f'{inner}<div class="tabs">{tabs}</div></div>')


def summary_table(rows_wanted, cols=(2, 3, 4, 5, 6), heads=("Q1", "Q2", "Q3", "Q4", "Year"), due=True, font=None):
    h = "".join(f'<th class="n">{x}</th>' for x in heads)
    body = ""
    for r in summary:
        if len(r) < 7 or r[1] not in rows_wanted:
            continue
        label = r[1].strip()
        if r[1] == "Update due by":
            if due:
                body += f'<tr class="due"><td>Update due by</td>' + "".join(f'<td class="n">{uk(r[c])}</td>' if r[c] else "<td></td>" for c in cols) + "</tr>"
            continue
        cls = "tot" if label.startswith(("Total", "NET")) else ""
        if label == "NET PROFIT (income less allowable expenses)":
            label = "Net profit"
        body += f'<tr class="{cls}"><td>{E(label)}</td>' + "".join(f'<td class="n">{gbp(r[c])}</td>' for c in cols) + "</tr>"
    style = f' style="font-size:{font}px"' if font else ""
    return f'<table{style}><tr><th>Example data</th>{h}</tr>{body}</table>'


pages = []

# 1 Hero
pages.append(page(f"""<div class=pad>
<div class=eyebrow>UK sole traders · tax year 2026-27</div>
<h1>Your <em>Making Tax Digital</em> quarterly totals, ready as you go</h1>
<div class=chips><span class=chip>Excel</span><span class=chip>Google Sheets</span><span class="chip ghost">No macros · no subscription</span></div>
{window("Sole-Trader-Quarterly-Tracker-2026-27.xlsx", "Quarterly Summary", summary_table(
    ["Update due by", "Turnover", "Total income", "Total allowable expenses", "NET PROFIT (income less allowable expenses)"]))}
</div><div class=tag>Example figures shown</div>""", "01-hero"))

# 2 What's included
tabs = [("Start Here", "Set up in 3 steps, inside the file"), ("Settings", "Business name, tax year, quarter dates"),
        ("Income", "Every payment in, quarter filled in for you"), ("Expenses", "SA103 category dropdown, allowable flag"),
        ("Mileage", "45p / 25p allowance worked out"), ("Quarterly Summary", "Each quarter and year to date"),
        ("Year End", "SA103-style totals for your return"), ("PDF guide + example file", "See it filled in before you start")]
cards = "".join(f'<div class=card><h3>{E(a)}</h3><p>{E(c)}</p></div>' for a, c in tabs)
pages.append(page(f"""<div class=pad><div class=eyebrow>What you get</div><h1>7 tabs. One job each.</h1>
<div class=grid2>{cards}</div></div>""", "02-included"))

# 3 Expenses register
exp_rows = ""
for r in expenses[4:12]:
    if not r[1]:
        continue
    exp_rows += (f'<tr><td class=in>{uk(r[1])}</td><td class=in>{E(r[2])}</td><td class=in>{E(r[4])}</td>'
                 f'<td class="n in">{gbp(r[5])}</td><td class=in>{E(r[6])}</td><td>{E(r[7])}</td></tr>')
dropdown = "".join(f'<div style="padding:12px 24px;font-size:27px;{"background:#E3EFEF;font-weight:700" if c.startswith("Phone") else ""}">{E(c)}</div>' for c in b.CATEGORIES[:9])
pages.append(page(f"""<div class=pad><div class=eyebrow>Expenses</div><h1>Pick the <em>SA103 category</em> from a list</h1>
<p class=lede>Type in the cream cells. The quarter fills itself from the date, and anything you mark "No" stays out of your profit.</p>
<div style="position:relative">{window("Expenses", "Expenses", f'<table><tr><th>Date</th><th>Supplier</th><th>Category</th><th class=n>Amount</th><th>Allowable?</th><th>Quarter</th></tr>{exp_rows}</table>')}
<div style="position:absolute;left:640px;top:330px;width:900px;background:#fff;border:3px solid var(--brand);border-radius:16px;box-shadow:0 24px 60px rgba(31,42,55,.25);padding:10px 0">{dropdown}</div></div>
</div><div class=tag>Example figures shown</div>""", "03-expenses"))

# 4 Quarterly summary, full
pages.append(page(f"""<div class=pad style="gap:40px"><div class=eyebrow>Quarterly Summary</div><h1>Every quarter, <em>and year to date</em></h1>
{window("Quarterly Summary", "Quarterly Summary", summary_table(
    ["Update due by", "Turnover", "Other business income", "Total income", "Car, van and travel expenses",
     "Rent, rates, power and insurance costs", "Phone, fax, stationery and other office costs",
     "Advertising and business entertainment costs", "Accountancy, legal and other professional fees",
     "Total allowable expenses", "NET PROFIT (income less allowable expenses)"], font=27))}
<p class=lede style="font-size:40px">Due dates for each update are on the sheet. Cumulative columns match how quarterly updates are sent.</p>
</div><div class=tag>Example figures shown</div>""", "04-summary"))

# 5 Year end
ye_rows = ""
for r in year_end[5:]:
    if len(r) < 4 or not r[1] or not r[2]:
        continue
    if r[1] in ("Turnover", "Any other business income", "Car, van and travel expenses", "Rent, rates, power and insurance costs",
                "Phone, fax, stationery and other office costs", "Advertising and business entertainment costs",
                "Accountancy, legal and other professional fees", "Total expenses", "Net profit (or loss if negative)"):
        cls = "tot" if r[1].startswith(("Total", "Net")) else ""
        ye_rows += f'<tr class="{cls}"><td>{E(r[1])}</td><td class=n>{gbp(r[2])}</td><td class=n>{gbp(r[3]) if r[3] else ""}</td></tr>'
pages.append(page(f"""<div class=pad><div class=eyebrow>Year End</div><h1>Self Assessment totals in <em>SA103 order</em></h1>
{window("Year End", "Year End", f'<table><tr><th>Line (as on the SA103F form)</th><th class=n>Allowable</th><th class=n>Disallowable</th></tr>{ye_rows}</table>')}
<p class=lede>Allowable and disallowable kept apart, the same way the form asks for them.</p>
</div><div class=tag>Example figures shown</div>""", "05-year-end"))

# 6 Compatibility
apps = [("Microsoft Excel", "Windows and Mac, 2016 or later"), ("Google Sheets", "Free. Upload the file to Google Drive and open it"),
        ("Apple Numbers", "Opens the .xlsx directly"), ("LibreOffice", "Free and open source")]
cards = "".join(f'<div class=card><h3>{E(a)}</h3><p>{E(c)}</p></div>' for a, c in apps)
pages.append(page(f"""<div class=pad><div class=eyebrow>Works where you work</div><h1>No macros. <em>No subscription.</em> No app to install.</h1>
<div class=grid2>{cards}</div>
<p class=lede>Plain formulas only, so nothing breaks when you switch between Excel and Google Sheets. One instant download.</p></div>""", "06-compatibility"))

# 7 Guide
steps = [("1", "Settings", "Type your business name and 2026 for the 2026-27 tax year."),
         ("2", "Record", "Add money in, money out and business miles as they happen."),
         ("3", "Send", "Each quarter, copy the Quarterly Summary figures into your MTD software.")]
cards = "".join(f'<div class=card style="display:flex;gap:40px;align-items:center"><div style="font-size:110px;font-weight:800;color:var(--brand)">{n}</div><div><h3>{E(t)}</h3><p>{E(d)}</p></div></div>' for n, t, d in steps)
pages.append(page(f"""<div class=pad><div class=eyebrow>Includes a PDF guide</div><h1>Set up in <em>5 minutes</em></h1>
<div style="display:grid;gap:34px">{cards}</div>
<p class=lede>A plain-English guide comes with it, plus a filled-in example file so you can see how it works first.</p></div>""", "07-guide"))

# 8 FAQ
faq = [("Who is it for?", "UK sole traders and freelancers who keep their own records, including anyone joining Making Tax Digital in 2026, 2027 or 2028."),
       ("Does it send my updates to HMRC?", "No. A spreadsheet can't submit to HMRC. Use these figures with HMRC-recognised bridging or MTD software."),
       ("Does it work out my tax bill?", "No. It keeps your records and adds them up. It is not tax advice."),
       ("Landlords or limited companies?", "Not covered. This is for self-employment income only.")]
cards = "".join(f'<div class=card><h3>{E(q)}</h3><p>{E(a)}</p></div>' for q, a in faq)
pages.append(page(f"""<div class=pad><div class=eyebrow>Before you buy</div><h1>Is this right for you?</h1>
<div style="display:grid;gap:30px">{cards}</div></div>""", "08-faq"))

# PDF guide (A4)
GUIDE_CSS = """
@page{size:A4;margin:22mm 20mm}
body{font-family:Inter,'DejaVu Sans',sans-serif;color:#1F2A37;font-size:11pt;line-height:1.55;width:auto;height:auto;overflow:visible;background:#fff}
h1{font-size:26pt;color:#1D5C63;margin-bottom:4mm;line-height:1.15;font-weight:800}
h2{font-size:14pt;color:#1D5C63;margin:8mm 0 2mm;font-weight:700;break-after:avoid}
p,li{margin-bottom:2.2mm}
ul,ol{padding-left:6mm}
.muted{color:#5B6675}
.box{border:1.5pt solid #B4532A;border-radius:3mm;padding:4mm 5mm;margin:5mm 0;color:#1F2A37}
.box b{color:#B4532A}
table{border-collapse:collapse;width:100%;font-size:10pt;margin:2mm 0}
td,th{border:0.8pt solid #D5DCE0;padding:1.6mm 2.4mm;text-align:left}
th{background:#1D5C63;color:#fff}
.page{break-before:page}
"""
cat_rows = "".join(f"<tr><td>{E(c)}</td></tr>" for c in b.CATEGORIES)
guide = f"""<!doctype html><meta charset=utf-8><style>{GUIDE_CSS}</style>
<h1>Sole Trader Quarterly Tracker<br><span style="font-size:15pt;color:#5B6675;font-weight:600">Guide · tax year 2026-27</span></h1>
<p>This spreadsheet keeps your self-employment income, expenses and business mileage in one place, and adds them up for each
Making Tax Digital quarter and for the year. It works in Microsoft Excel, Google Sheets, Apple Numbers and LibreOffice.</p>
<div class=box><b>Please read.</b> The tracker keeps your records and adds them up. It does not submit anything to HMRC, and it does
not work out the tax you owe. To send quarterly updates, use HMRC-recognised bridging or MTD software with these figures. This is a
record-keeping tool, not tax or accounting advice: check anything you are unsure about with HMRC guidance or an accountant.</div>
<h2>What's in the download</h2>
<ul><li><b>Sole-Trader-Quarterly-Tracker-2026-27.xlsx</b>, the blank tracker you use.</li>
<li><b>Sole-Trader-Quarterly-Tracker-EXAMPLE.xlsx</b>, the same file filled in with example data, so you can see how it works.</li>
<li>This guide.</li></ul>
<h2>Open the file</h2>
<ul><li><b>Excel or Numbers:</b> double-click the .xlsx file. If Excel shows "Protected View", click Enable Editing.</li>
<li><b>Google Sheets:</b> upload the file to Google Drive, open it, then choose File &gt; Save as Google Sheets.</li>
<li><b>LibreOffice:</b> open the .xlsx file directly.</li></ul>
<h2>Set up in 3 steps</h2>
<ol><li>Go to <b>Settings</b>. Type your business name, and the year your tax year starts (type 2026 for 6 April 2026 to 5 April 2027).</li>
<li>Leave <b>Quarter dates</b> on Standard (6th to 5th) unless you have told HMRC you use calendar quarters.</li>
<li>Start recording. Type only in the cream cells.</li></ol>
<h2>Each tab</h2>
<table><tr><th>Tab</th><th>What it's for</th></tr>
<tr><td>Start Here</td><td>The short version of this guide.</td></tr>
<tr><td>Settings</td><td>Business name, tax year, quarter dates, mileage rates and the dropdown lists.</td></tr>
<tr><td>Income</td><td>One row per payment you receive. Choose Turnover, or Other business income for things like royalties.</td></tr>
<tr><td>Expenses</td><td>One row per payment you make, with its SA103 category. Mark it No under Allowable if it is not a deductible business cost.</td></tr>
<tr><td>Mileage</td><td>Business journeys. The simplified allowance (45p a mile for the first 10,000 car or van miles, 25p after) is worked out on the right and added to Car, van and travel expenses.</td></tr>
<tr><td>Quarterly Summary</td><td>Totals for each quarter, the year so far, and the date each update is due.</td></tr>
<tr><td>Year End</td><td>Totals in the same order as the SA103F self-employment pages, with allowable and disallowable kept apart.</td></tr></table>
<h2 class=page>Quarters and deadlines (standard dates)</h2>
<table><tr><th>Quarter</th><th>Period</th><th>Update due by</th></tr>
<tr><td>Q1</td><td>6 April to 5 July</td><td>7 August</td></tr>
<tr><td>Q2</td><td>6 July to 5 October</td><td>7 November</td></tr>
<tr><td>Q3</td><td>6 October to 5 January</td><td>7 February</td></tr>
<tr><td>Q4</td><td>6 January to 5 April</td><td>7 May</td></tr></table>
<p>Your final declaration for the year is due by 31 January after the tax year ends. The Quarter column on every register fills itself in from
the date. If it shows <b>Outside year</b> in red, that date is not in the tax year set in Settings.</p>
<h2>Who has to use Making Tax Digital</h2>
<p>From 6 April 2026, sole traders and landlords with qualifying income over £50,000 must keep digital records and send quarterly updates.
The threshold falls to £30,000 from April 2027 and £20,000 from April 2028. Qualifying income is your total gross self-employment and
property income before expenses. Check GOV.UK for the current rules.</p>
<h2>Expense categories</h2>
<table><tr><th>Categories in the dropdown (SA103F order)</th></tr>{cat_rows}</table>
<p class=muted>If your turnover is under £90,000 you may be able to report expenses as a single total. Entertaining clients is never an
allowable expense, and depreciation is not allowable (capital allowances are claimed instead).</p>
<h2 class=page>Good habits</h2>
<ul><li>Record things weekly. It takes minutes, and the quarterly totals are then always ready.</li>
<li>Put a receipt or invoice reference on every row, and keep the receipts. HMRC can ask to see records for at least 5 years after the 31 January deadline.</li>
<li>Use one copy of the file per tax year. For next year, save a copy, clear the cream cells and change the year in Settings.</li>
<li>Claim either the mileage allowance or your actual vehicle costs for a vehicle, not both.</li></ul>
<h2>Changing the protected cells</h2>
<p>Grey cells hold formulas and are protected without a password, so they don't get typed over by mistake. In Excel choose Review &gt;
Unprotect Sheet. Google Sheets removes this protection when you open the file.</p>
<h2>Questions</h2>
<p>Message the shop you bought from and include which app you use (Excel, Google Sheets, Numbers or LibreOffice).</p>
<h2>Licence</h2>
<p class=muted>For your own business records. You may not resell, share or redistribute the file or this guide, in original or edited form.
Making Tax Digital rules and rates are as published for the 2026-27 tax year; check GOV.UK for changes.</p>
"""
(work / "guide.html").write_text(guide, encoding="utf-8")

js = f"""
const {{chromium}} = require('playwright');
(async () => {{
  const b = await chromium.launch();
  const p = await b.newPage({{viewport: {{width: 2000, height: 2000}}}});
  for (const n of {json.dumps(pages)}) {{
    await p.goto('file://{work}/' + n + '.html');
    await p.screenshot({{path: '{out.resolve()}/' + n + '.jpg', type: 'jpeg', quality: 90}});
  }}
  const g = await b.newPage();
  await g.goto('file://{work}/guide.html');
  await g.pdf({{path: '{dist.resolve()}/Sole-Trader-Quarterly-Tracker-Guide.pdf', format: 'A4', printBackground: true}});
  await b.close();
}})();
"""
(work / "shot.js").write_text(js)
subprocess.run(["node", str(work / "shot.js")], check=True)
print("rendered", len(pages), "images and the guide")
