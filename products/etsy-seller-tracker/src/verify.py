"""Recalculate the Etsy EXAMPLE workbook in LibreOffice and check every sale line,
product and month against an independent Python calculation. Exit 1 on mismatch."""
import csv
import subprocess
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

import build_etsy as b

dist = Path(sys.argv[1] if len(sys.argv) > 1 else "../dist")
trans, proc, fixed, reg, listing, offsite, vat = (r for _, r, _ in b.FEES)
unit = {sku: m + p for sku, _, m, p in b.SAMPLE_PRODUCTS}

lines, seen = [], set()
for d, order, sku, qty, item, post, ad, paid in b.SAMPLE_SALES:
    rev = item + post
    fee = rev * (trans + proc + reg) + (fixed if order not in seen else 0) + qty * listing + (rev * offsite if ad == "Yes" else 0)
    seen.add(order)
    v = fee * vat  # example says "No" to a VAT number, so VAT on fees is a cost
    cogs = qty * unit[sku]
    lines.append(dict(d=d, sku=sku, qty=qty, rev=rev, fee=fee, vat=v, cogs=cogs, paid=paid, profit=rev - fee - v - cogs - paid))

with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["soffice", "--headless", "--convert-to",
                    'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,false,false,false,-1',
                    "--outdir", tmp, str(dist / "UK-Etsy-Seller-Profit-Tracker-EXAMPLE.xlsx")], check=True, capture_output=True)
    read = lambda name: list(csv.reader(next(Path(tmp).glob(f"*-{name}.csv")).open(encoding="utf-8")))  # noqa: E731
    sales, per, month = read("Sales"), read("Profit per Product"), read("Monthly Summary")


def money(s):
    s = s.replace("£", "").replace(",", "").replace("%", "").strip()
    return -float(s.strip("-()")) if s.startswith(("-", "(")) else float(s or 0)


fails, n = [], 0


def check(what, got, want):
    global n
    n += 1
    if abs(got - round(want, 2)) > 0.006:
        fails.append(f"{what}: got {got} want {want:.4f}")


for i, ln in enumerate(lines):
    r = sales[4 + i]
    for col, key in zip(range(9, 14), ("rev", "fee", "vat", "cogs", "profit")):
        check(f"Sales line {i + 1} {key}", money(r[col]), ln[key])

prow = {r[1]: r for r in per if len(r) > 9 and r[1]}
for sku, *_ in b.SAMPLE_PRODUCTS:
    mine = [ln for ln in lines if ln["sku"] == sku]
    check(f"{sku} units", money(prow[sku][3]), sum(x["qty"] for x in mine))
    check(f"{sku} profit", money(prow[sku][8]), sum(x["profit"] for x in mine))

by_month = defaultdict(float)
for ln in lines:
    by_month[(ln["d"].year, ln["d"].month)] += ln["profit"]
for d, *_, amt, _ in b.SAMPLE_EXPENSES:
    by_month[(d.year, d.month)] -= amt
for k in range(12):
    y, m = (2026, 4 + k) if k < 9 else (2027, k - 8)
    check(f"Profit {y}-{m:02d}", money(month[5 + k][9]), by_month[(y, m)])
check("Year profit", money(month[17][9]), sum(by_month.values()))
check("Rolling 12-month revenue", money(month[22][2]), sum(ln["rev"] for ln in lines))
n += 1
if not any("Below the VAT threshold." in c for r in month for c in r):
    fails.append("VAT status line missing")

if fails:
    print("FAIL", *fails, sep="\n  ")
    sys.exit(1)
print(f"PASS: {n} checks. Year profit £{sum(by_month.values()):,.2f} on revenue £{sum(x['rev'] for x in lines):,.2f}")
