"""Listing images and PDF guide for the UK Landlord Rental Tracker.
Usage: python3 render.py ../dist ../listing"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))
import build_landlord as b  # noqa: E402
from listing_kit import E, cards, gbp, lo_csv, render, table, uk, window  # noqa: E402

dist = Path(sys.argv[1] if len(sys.argv) > 1 else "../dist")
out = Path(sys.argv[2] if len(sys.argv) > 2 else "../listing")
s = lo_csv(dist / "UK-Landlord-Rental-Tracker-EXAMPLE.xlsx")
TABS = ["Start Here", "Settings", "Income", "Expenses", "Quarterly Summary", "Per Property", "Year End"]
TAG = '<div class=tag>Example figures shown</div>'
summ = {r[1]: r for r in s["Quarterly Summary"] if len(r) > 6 and r[1]}
ye = {r[1]: r for r in s["Year End"] if len(r) > 2 and r[1]}
props = [r for r in s["Per Property"][5:11] if len(r) > 7 and r[1]]


def qrow(label, show=None):
    r = summ[label]
    return [E(show or label)] + [gbp(r[i]) for i in range(2, 7)]


due = summ["Update due by"]
due_row = ["Update due by"] + [uk(due[i]) for i in range(2, 6)] + [""]
hero_tbl = table(["Your share (example)", "Q1", "Q2", "Q3", "Q4", "Year"],
                 [due_row, qrow("Total income"), qrow("Total allowable expenses"),
                  qrow("NET PROPERTY PROFIT", "Net property profit"),
                  qrow(b.FINANCE + " (not deducted)", "Mortgage interest (kept apart)")],
                 tot=("Net property profit",))

pages = [("01-hero", f"""<div class=pad><div class=eyebrow>UK landlords · tax year 2026-27</div>
<h1>Rent and costs, <em>totalled by Making Tax Digital quarter</em></h1>
<div class=chips><span class=chip>Up to 5 properties</span><span class=chip>Joint ownership</span><span class="chip ghost">Excel + Google Sheets</span></div>
{window("UK-Landlord-Rental-Tracker-2026-27.xlsx", TABS, "Quarterly Summary", hero_tbl)}</div>{TAG}""")]

pages.append(("02-included", f"""<div class=pad><div class=eyebrow>What you get</div><h1>7 tabs. One job each.</h1>
{cards([("Start Here", "Set up in 3 steps, inside the file"), ("Settings", "Up to 5 properties and your share of each"),
        ("Income", "Rent in, quarter filled in for you"), ("Expenses", "SA105 lines from a dropdown"),
        ("Quarterly Summary", "Each quarter and year to date"), ("Per Property", "Which let actually earns"),
        ("Year End", "SA105-style totals and the MTD check"), ("PDF guide + example file", "See it filled in first")])}</div>"""))

prow = [[E(r[1]), E(r[2]), gbp(r[3]), gbp(r[4]), gbp(r[5]), gbp(r[7])] for r in props]
pages.append(("03-per-property", f"""<div class=pad><div class=eyebrow>Per Property</div><h1>Own it <em>jointly?</em> Your share is worked out.</h1>
<p class=lede>Enter the full rent and bills. Your % in Settings does the rest, for every quarter and the year.</p>
{window("Per Property", TABS, "Per Property", table(["Property", "Share", "Income", "Expenses", "Mortgage interest", "Your profit"], prow, num_from=2, tot=("All properties",)))}
</div>{TAG}"""))

ye_rows = [[E(k), gbp(ye[k][2])] for k in ["Income from property (rents and other income)", *b.DEDUCTIBLE[:2],
                                           "Legal, management and other professional fees", "Costs of replacing domestic items",
                                           "Total allowable expenses", "Net property profit (or loss if negative)"]]
ye_rows.append(["Residential finance costs (kept apart)", gbp(ye[b.FINANCE + " (kept apart: 20% tax reduction)"][2])])
pages.append(("04-year-end", f"""<div class=pad><div class=eyebrow>Year End</div><h1>Mortgage interest <em>kept apart</em>, the way SA105 wants it</h1>
{window("Year End", TABS, "Year End", table(["Line (SA105 UK property)", "Your share"], ye_rows, tot=("Total allowable expenses", "Net property profit (or loss if negative)")))}
<p class=lede>Finance costs give a 20% tax reduction rather than a deduction, so they stay out of your profit.</p></div>{TAG}"""))

status = next(k for k in ye if k.startswith(("Over £", "£20,000 or less")))
pages.append(("05-mtd-check", f"""<div class=pad><div class=eyebrow>Making Tax Digital check</div><h1>Will MTD apply to you, and <em>when?</em></h1>
<div class=card style="display:grid;gap:30px"><p style="font-size:40px">Rent (your share) {gbp(ye["Property income, your share (gross)"][2])} + self-employment {gbp(ye["Self-employment turnover (from Settings)"][2])}</p>
<div class=big>{gbp(ye["Qualifying income"][2])}</div><h3 style="font-size:56px">{E(status)}</h3></div>
<p class=lede>Property and self-employment income count together. From April 2026 above £50,000, April 2027 above £30,000, April 2028 above £20,000.</p></div>{TAG}"""))

pages.append(("06-compatibility", f"""<div class=pad><div class=eyebrow>Works where you work</div><h1>No macros. <em>No subscription.</em> No app.</h1>
{cards([("Microsoft Excel", "Windows and Mac, 2016 or later"), ("Google Sheets", "Free. Upload to Google Drive and open"),
        ("Apple Numbers", "Opens the .xlsx directly"), ("LibreOffice", "Free and open source")])}
<p class=lede>One instant download. Plain formulas only, so nothing breaks between apps.</p></div>"""))

pages.append(("07-guide", f"""<div class=pad><div class=eyebrow>Includes a PDF guide</div><h1>Set up in <em>5 minutes</em></h1>
{cards([("1  Settings", "Add your properties and your share of each."), ("2  Record", "Rent in, costs out, as they happen."),
        ("3  Send", "Copy the Quarterly Summary into your MTD software.")], "grid1")}
<p class=lede>A plain-English guide and a filled-in example come with it.</p></div>""".replace('class="grid1"', 'style="display:grid;gap:34px"')))

pages.append(("08-faq", f"""<div class=pad><div class=eyebrow>Before you buy</div><h1>Is this right for you?</h1>
{cards([("Who is it for?", "UK landlords with up to 5 properties, in their own name or jointly, including anyone joining MTD in 2026, 2027 or 2028."),
        ("Does it send updates to HMRC?", "No. Use these figures with HMRC-recognised bridging or MTD software."),
        ("Does it work out my tax?", "No. It keeps records and adds them up. It is not tax advice."),
        ("Not covered", "Limited companies, overseas property and capital gains.")], "grid1").replace('class="grid1"', 'style="display:grid;gap:30px"')}</div>"""))

cats = "".join(f"<tr><td>{E(c)}</td></tr>" for c in b.CATEGORIES)
guide = f"""
<h1>UK Landlord Rental Tracker<br><span style="font-size:15pt;color:#5B6675;font-weight:600">Guide · tax year 2026-27</span></h1>
<p>This spreadsheet keeps the rent and costs for up to five UK properties, works out your share of each, and adds everything up for
each Making Tax Digital quarter and for your SA105 UK property pages. It works in Excel, Google Sheets, Apple Numbers and LibreOffice.</p>
<div class=box><b>Please read.</b> The tracker keeps your records and adds them up. It does not submit anything to HMRC and does not
work out the tax you owe. Use HMRC-recognised bridging or MTD software to send quarterly updates. It is a record-keeping tool, not
tax advice: check anything you are unsure about with HMRC guidance or an accountant.</div>
<h2>What's in the download</h2>
<ul><li><b>UK-Landlord-Rental-Tracker-2026-27.xlsx</b>, the blank tracker.</li>
<li><b>UK-Landlord-Rental-Tracker-EXAMPLE.xlsx</b>, filled in with two example properties.</li><li>This guide.</li></ul>
<h2>Open the file</h2>
<ul><li><b>Excel or Numbers:</b> double-click the file. If Excel shows Protected View, click Enable Editing.</li>
<li><b>Google Sheets:</b> upload to Google Drive, open it, then File &gt; Save as Google Sheets.</li></ul>
<h2>Set up in 3 steps</h2>
<ol><li>On <b>Settings</b>, type your name and the year the tax year starts (2026 for 2026-27).</li>
<li>List up to 5 properties with your share of each (100% if you own it alone). Spouses and civil partners are taxed 50:50 unless they
have sent HMRC Form 17.</li>
<li>Record rent on <b>Income</b> and costs on <b>Expenses</b>, choosing the property each time. Enter the full amount; the Your share column works out your part.</li></ol>
<h2>The expense lines</h2>
<table><tr><th>Choose one of these for each cost (SA105 UK property lines)</th></tr>{cats}</table>
<ul><li><b>Mortgage interest</b> goes under Residential property finance costs. Since 2020 it is not deducted from profit; it gives a
basic-rate (20%) tax reduction instead, so the tracker keeps it apart.</li>
<li><b>Improvements</b> such as extensions or upgrades are capital costs, not expenses. Like-for-like replacement of furniture and
appliances goes under Costs of replacing domestic items.</li>
<li><b>Furnished holiday lets</b> are treated as ordinary lets from 6 April 2025.</li></ul>
<h2 class=page>Quarters and deadlines (standard dates)</h2>
<table><tr><th>Quarter</th><th>Period</th><th>Update due by</th></tr>
<tr><td>Q1</td><td>6 April to 5 July</td><td>7 August</td></tr><tr><td>Q2</td><td>6 July to 5 October</td><td>7 November</td></tr>
<tr><td>Q3</td><td>6 October to 5 January</td><td>7 February</td></tr><tr><td>Q4</td><td>6 January to 5 April</td><td>7 May</td></tr></table>
<p>The final declaration is due by 31 January after the tax year ends.</p>
<h2>The Year End checks</h2>
<ul><li><b>Property allowance:</b> you can deduct a flat £1,000 instead of your actual expenses. The sheet tells you which is higher.
If you use the allowance, you cannot also deduct expenses or claim the finance cost reduction.</li>
<li><b>Making Tax Digital:</b> your share of gross rent plus any self-employment turnover (type it in Settings) is compared with the
£50,000 (April 2026), £30,000 (April 2027) and £20,000 (April 2028) thresholds. HMRC tests the year before, so treat it as a guide.</li></ul>
<h2>Good habits</h2>
<ul><li>Record things monthly, with a reference for every row, and keep the receipts and agent statements.</li>
<li>Use one copy per tax year: save a copy, clear the cream cells and change the year.</li>
<li>Grey cells hold formulas and are protected without a password (Review &gt; Unprotect Sheet).</li></ul>
<h2>Licence</h2>
<p class=muted>For your own records. You may not resell, share or redistribute the file or this guide. Rules are as published for the
2026-27 tax year; check GOV.UK for changes.</p>"""

render(pages, guide, out, dist / "UK-Landlord-Rental-Tracker-Guide.pdf")
print("rendered", len(pages), "images and the guide")
