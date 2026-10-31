"""Listing images and PDF guide for the UK Etsy Seller Profit Tracker.
Usage: python3 render.py ../dist ../listing"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))
import build_etsy as b  # noqa: E402
from listing_kit import E, cards, gbp, lo_csv, render, table, uk, window  # noqa: E402

dist = Path(sys.argv[1] if len(sys.argv) > 1 else "../dist")
out = Path(sys.argv[2] if len(sys.argv) > 2 else "../listing")
s = lo_csv(dist / "UK-Etsy-Seller-Profit-Tracker-EXAMPLE.xlsx")
TABS = ["Start Here", "Settings", "Products", "Sales", "Expenses", "Profit per Product", "Monthly Summary"]
TAG = '<div class=tag>Example figures shown</div>'
sales = [r for r in s["Sales"][4:] if len(r) > 13 and r[1]]
per = [r for r in s["Profit per Product"][4:] if len(r) > 9 and r[1]]
month = s["Monthly Summary"]
year = month[17]
pct = lambda v: f"{float(v.rstrip('%')):.1f}%" if v else ""  # noqa: E731
mon = lambda v: __import__("datetime").date(int(v[6:]), int(v[:2]), 1).strftime("%b %Y")  # LibreOffice CSV gives mm/dd/yyyy  # noqa: E731

line = sales[3]  # the Offsite Ads sale
fees_tbl = table(["One sale (example)", "£"], [
    ["Item price + postage", gbp(line[9])], ["Etsy fees (all of them)", gbp(line[10])], ["VAT on Etsy fees", gbp(line[11])],
    ["Cost of goods", gbp(line[12])], ["Postage you paid", gbp(line[8])], ["What you actually keep", gbp(line[13])]],
    tot=("What you actually keep",))

pages = [("01-hero", f"""<div class=pad><div class=eyebrow>For UK Etsy sellers</div>
<h1>See what you <em>really keep</em> from every Etsy sale</h1>
<div class=chips><span class=chip>Every Etsy fee</span><span class=chip>VAT on fees</span><span class="chip ghost">£90k VAT check</span></div>
{window("UK-Etsy-Seller-Profit-Tracker.xlsx", TABS, "Profit per Product", table(
    ["Product (example)", "Units", "Revenue", "Fees + VAT", "Profit", "Margin"],
    [[E(r[2]), E(r[3]), gbp(r[4]), gbp(r[5]), gbp(r[8]), pct(r[9])] for r in per], num_from=1))}</div>{TAG}""")]

pages.append(("02-included", f"""<div class=pad><div class=eyebrow>What you get</div><h1>7 tabs. One job each.</h1>
{cards([("Settings", "Etsy UK fee rates, all editable"), ("Products", "Cost per unit for up to 200 products"),
        ("Sales", "Fees, VAT and profit on every line"), ("Expenses", "Ads, supplies, software, insurance"),
        ("Profit per Product", "Which products earn their keep"), ("Monthly Summary", "Your year, month by month"),
        ("VAT threshold check", "Rolling 12 months against £90,000"), ("PDF guide + example file", "See it filled in first")])}</div>"""))

pages.append(("03-one-sale", f"""<div class=pad><div class=eyebrow>Sales</div><h1>Every fee, <em>on every sale</em></h1>
<p class=lede>Transaction, payment processing, regulatory operating fee, listing renewal and Offsite Ads, plus VAT on fees if you aren't VAT registered.</p>
<div class=card style="padding:0;overflow:hidden">{fees_tbl}</div></div>{TAG}"""))

mrows = [[mon(r[1]), gbp(r[3]), gbp(r[4]), gbp(r[6]), gbp(r[9])] for r in month[5:17] if r[3] not in ("0", "")]
mrows.append(["Year", gbp(year[3]), gbp(year[4]), gbp(year[6]), gbp(year[9])])
pages.append(("04-monthly", f"""<div class=pad><div class=eyebrow>Monthly Summary</div><h1>Your shop, <em>month by month</em></h1>
{window("Monthly Summary", TABS, "Monthly Summary", table(["Month (example)", "Revenue", "Etsy fees", "Cost of goods", "Profit"], mrows, tot=("Year",)))}
</div>{TAG}"""))

pages.append(("05-vat-check", f"""<div class=pad><div class=eyebrow>VAT threshold check</div><h1>Know before you <em>hit £90,000</em></h1>
<div class=card style="display:grid;gap:26px"><p style="font-size:40px">Etsy revenue in the last 12 months</p>
<div class=big>{gbp(month[22][2])}</div><h3 style="font-size:52px">{E(month[24][1])}</h3>
<p style="font-size:36px">Left before the threshold: {gbp(month[23][2])}</p></div>
<p class=lede>A rolling 12-month total, the way the VAT threshold is tested, with a warning once you're within £15,000.</p></div>{TAG}"""))

pages.append(("06-compatibility", f"""<div class=pad><div class=eyebrow>Works where you work</div><h1>No macros. <em>No subscription.</em> No app.</h1>
{cards([("Microsoft Excel", "Windows and Mac, 2016 or later"), ("Google Sheets", "Free. Upload to Google Drive and open"),
        ("Apple Numbers", "Opens the .xlsx directly"), ("LibreOffice", "Free and open source")])}
<p class=lede>One instant download. Fee rates sit in Settings, so you update them in seconds if Etsy changes them.</p></div>"""))

pages.append(("07-guide", f"""<div class=pad><div class=eyebrow>Includes a PDF guide</div><h1>Set up in <em>10 minutes</em></h1>
<div style="display:grid;gap:34px">{cards([("1  Settings", "Shop name, VAT number yes or no, fee rates."),
                                            ("2  Products", "Each product's materials and packaging cost."),
                                            ("3  Sales", "Copy each order in. Profit appears straight away.")], "x").replace('class="x"', '')}</div>
<p class=lede>A plain-English guide and a filled-in example shop come with it.</p></div>"""))

pages.append(("08-faq", f"""<div class=pad><div class=eyebrow>Before you buy</div><h1>Is this right for you?</h1>
<div style="display:grid;gap:30px">{cards([("Who is it for?", "UK sellers on Etsy who want true profit per product after every fee."),
        ("Are the fees exact?", "They are worked out from Etsy's published UK rates (June 2026), so they can differ by pennies from your statement."),
        ("Does it do my tax return?", "No. It tracks profit. Pair it with the Sole Trader Quarterly Tracker for tax totals."),
        ("Other platforms?", "Built for Etsy fees only. Edit the rates for another platform at your own risk.")], "x").replace('class="x"', '')}</div></div>"""))

fees = "".join(f"<tr><td>{E(label)}</td><td>{rate:.2%}</td></tr>" if "%" in fmt else f"<tr><td>{E(label)}</td><td>£{rate:.2f}</td></tr>"
               for label, rate, fmt in b.FEES)
guide = f"""
<h1>UK Etsy Seller Profit Tracker<br><span style="font-size:15pt;color:#5B6675;font-weight:600">Guide</span></h1>
<p>This spreadsheet works out what you keep from every Etsy sale after every Etsy fee, VAT on those fees, your materials and postage,
then totals it per product and per month, and checks your sales against the £90,000 VAT registration threshold. It works in Excel,
Google Sheets, Apple Numbers and LibreOffice.</p>
<div class=box><b>Please read.</b> Fees are worked out from the rates in Settings, so they can differ slightly from your Etsy payment
account (Offsite Ads, for example, are capped per order). Check the rates against Etsy's fee page and update them when Etsy changes
them. This is a record-keeping tool, not tax advice.</div>
<h2>What's in the download</h2>
<ul><li><b>UK-Etsy-Seller-Profit-Tracker.xlsx</b>, the blank tracker.</li>
<li><b>UK-Etsy-Seller-Profit-Tracker-EXAMPLE.xlsx</b>, filled in with an example candle shop.</li><li>This guide.</li></ul>
<h2>Set up in 3 steps</h2>
<ol><li>On <b>Settings</b>, type your shop name. Choose Yes for "Given Etsy a UK VAT number?" only if you have. Etsy then doesn't charge VAT on your fees.</li>
<li>On <b>Products</b>, add each product's SKU, name and materials and packaging cost per unit.</li>
<li>On <b>Sales</b>, add each order: date, order number, SKU, quantity, item price, postage charged, whether it came from an Offsite Ad, and the postage you paid.</li></ol>
<h2>Fee rates in Settings</h2>
<table><tr><th>Fee (Etsy UK, as published June 2026)</th><th>Rate</th></tr>{fees}</table>
<p class=muted>If Etsy changes a rate, change it at the start of a new year or start a fresh copy, so that past sales keep the rates they were charged.</p>
<h2 class=page>Orders with more than one product</h2>
<p>Use one row per product with the same order number. Put the order's postage on the first row only. The fixed 20p processing fee is counted once per order automatically.</p>
<h2>Other costs</h2>
<p>Put costs that aren't tied to one sale (Etsy Ads, bulk supplies, software, insurance) on <b>Expenses</b>. They come off your monthly profit.
The categories match the SA103 self-employment lines, so the totals carry straight into your tax records.</p>
<h2>The VAT threshold check</h2>
<p>You must register for VAT if your taxable turnover in any rolling 12 months goes over £90,000. The Monthly Summary adds up your Etsy revenue
for the 12 months to the date in Settings (or today) and warns you within £15,000. It counts Etsy only: add sales from anywhere else yourself.</p>
<h2>Good habits</h2>
<ul><li>Add sales weekly from your Etsy Orders page.</li><li>Check Profit per Product monthly: a low margin is a pricing problem, not a sales problem.</li>
<li>Grey cells hold formulas and are protected without a password (Review &gt; Unprotect Sheet).</li></ul>
<h2>Licence</h2>
<p class=muted>For your own shop. You may not resell, share or redistribute the file or this guide. Etsy is a trademark of Etsy, Inc.
This product is not affiliated with or endorsed by Etsy.</p>"""

render(pages, guide, out, dist / "UK-Etsy-Seller-Profit-Tracker-Guide.pdf")
print("rendered", len(pages), "images and the guide")
