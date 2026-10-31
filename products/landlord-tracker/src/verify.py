"""Recalculate the landlord EXAMPLE workbook in LibreOffice and check its totals
against an independent Python calculation. Exit 1 on any mismatch."""
import csv
import subprocess
import sys
import tempfile
from collections import defaultdict
from datetime import date
from pathlib import Path

import build_landlord as b

dist = Path(sys.argv[1] if len(sys.argv) > 1 else "../dist")
Y = 2026
BOUNDS = [(date(Y, 4, 6), date(Y, 7, 5)), (date(Y, 7, 6), date(Y, 10, 5)),
          (date(Y, 10, 6), date(Y + 1, 1, 5)), (date(Y + 1, 1, 6), date(Y + 1, 4, 5))]
share = dict(b.SAMPLE_PROPS)


def quarter(d):
    return next((i for i, (s, e) in enumerate(BOUNDS) if s <= d <= e), None)


inc, exp = defaultdict(float), defaultdict(float)
prop = defaultdict(lambda: defaultdict(float))
for d, p, _, t, amt, _ in b.SAMPLE_INCOME:
    q = quarter(d)
    if q is not None:
        inc[(t, q)] += amt * share[p]
        prop[p]["inc"] += amt
for d, p, _, c, amt, _ in b.SAMPLE_EXPENSES:
    q = quarter(d)
    if q is not None:
        exp[(c, q)] += amt * share[p]
        prop[p]["fin" if c == b.FINANCE else "exp"] += amt

with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["soffice", "--headless", "--convert-to",
                    'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,false,false,false,-1',
                    "--outdir", tmp, str(dist / "UK-Landlord-Rental-Tracker-EXAMPLE.xlsx")], check=True, capture_output=True)
    read = lambda name: list(csv.reader(next(Path(tmp).glob(f"*-{name}.csv")).open(encoding="utf-8")))  # noqa: E731
    summ, per, ye = read("Quarterly Summary"), read("Per Property"), read("Year End")


def money(s):
    s = s.replace("£", "").replace(",", "").strip()
    return -float(s.strip("-()")) if s.startswith(("-", "(")) else float(s or 0)


fails, n = [], 0


def check(what, got, want):
    global n
    n += 1
    if abs(got - round(want, 2)) > 0.005:
        fails.append(f"{what}: got {got} want {want:.2f}")


rows = {r[1]: r for r in summ if len(r) > 11 and r[1]}
for q in range(4):
    ti = sum(inc[(t, q)] for t in b.INCOME_TYPES)
    te = sum(exp[(c, q)] for c in b.DEDUCTIBLE)
    for t in b.INCOME_TYPES:
        check(f"{t} Q{q+1}", money(rows[t][2 + q]), inc[(t, q)])
    for c in b.DEDUCTIBLE:
        check(f"{c} Q{q+1}", money(rows[c][2 + q]), exp[(c, q)])
    check(f"Total income Q{q+1}", money(rows["Total income"][2 + q]), ti)
    check(f"Total expenses Q{q+1}", money(rows["Total allowable expenses"][2 + q]), te)
    check(f"Profit Q{q+1}", money(rows["NET PROPERTY PROFIT"][2 + q]), ti - te)
    check(f"Finance Q{q+1}", money(rows[b.FINANCE + " (not deducted)"][2 + q]), exp[(b.FINANCE, q)])
    cum = sum(sum(inc[(t, k)] for t in b.INCOME_TYPES) - sum(exp[(c, k)] for c in b.DEDUCTIBLE) for k in range(q + 1))
    check(f"Cumulative profit Q{q+1}", money(rows["NET PROPERTY PROFIT"][8 + q]), cum)

prow = {r[1]: r for r in per if len(r) > 7 and r[1]}
for p, s in b.SAMPLE_PROPS:
    v = prop[p]
    check(f"{p} income", money(prow[p][3]), v["inc"])
    check(f"{p} expenses", money(prow[p][4]), v["exp"])
    check(f"{p} finance", money(prow[p][5]), v["fin"])
    check(f"{p} your profit", money(prow[p][7]), (v["inc"] - v["exp"]) * s)

yr = {r[1]: r for r in ye if len(r) > 2 and r[1]}
year_inc = sum(inc.values())
year_exp = sum(v for (c, _), v in exp.items() if c != b.FINANCE)
check("Year income", money(yr["Income from property (rents and other income)"][2]), year_inc)
check("Year expenses", money(yr["Total allowable expenses"][2]), year_exp)
check("Year profit", money(yr["Net property profit (or loss if negative)"][2]), year_inc - year_exp)
check("Qualifying income", money(yr["Qualifying income"][2]), year_inc + 24000)
want_status = "Over £30,000: Making Tax Digital applies from April 2027"
n += 1
if want_status not in yr:
    fails.append(f"MTD status missing: want '{want_status}'")
n += 1
if "Your expenses are higher than the allowance: claim expenses." not in yr:
    fails.append("Property allowance message wrong")

if fails:
    print("FAIL", *fails, sep="\n  ")
    sys.exit(1)
print(f"PASS: {n} checks. Your-share profit £{year_inc - year_exp:,.2f}, qualifying income £{year_inc + 24000:,.2f}")
