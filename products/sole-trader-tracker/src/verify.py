"""Recalculate the EXAMPLE workbook in LibreOffice and check every total
against an independent Python calculation. Exit 1 on any mismatch.

Usage: python3 verify.py ../dist
"""
import csv
import subprocess
import sys
import tempfile
from collections import defaultdict
from datetime import date
from pathlib import Path

import build_xlsx as b

dist = Path(sys.argv[1] if len(sys.argv) > 1 else "../dist")
src = dist / "Sole-Trader-Quarterly-Tracker-EXAMPLE.xlsx"

Y = b.TAX_YEAR
BOUNDS = [(date(Y, 4, 6), date(Y, 7, 5)), (date(Y, 7, 6), date(Y, 10, 5)),
          (date(Y, 10, 6), date(Y + 1, 1, 5)), (date(Y + 1, 1, 6), date(Y + 1, 4, 5))]


def quarter(d):
    for i, (s, e) in enumerate(BOUNDS):
        if s <= d <= e:
            return i
    return None


def tiers(m):
    return min(m, 10000) * 0.45 + max(m - 10000, 0) * 0.25


# Expected figures, worked out directly from the sample rows.
inc = defaultdict(float)
exp = defaultdict(float)
dis = defaultdict(float)
for d, _, _, t, amt, _ in b.SAMPLE_INCOME:
    q = quarter(d)
    if q is not None:
        inc[(t, q)] += amt
for d, _, _, cat, amt, allow, _ in b.SAMPLE_EXPENSES:
    q = quarter(d)
    if q is None:
        continue
    (dis if allow == "No" else exp)[(cat, q)] += amt
car = [0.0] * 4
other = [0.0] * 4
for d, _, v, miles, _ in b.SAMPLE_MILEAGE:
    q = quarter(d)
    if q is None:
        continue
    if v == "Car or van":
        car[q] += miles
    else:
        other[q] += miles * (0.24 if v == "Motorcycle" else 0.20)
mileage, cum = [], 0
for q in range(4):
    before = tiers(cum)
    cum += car[q]
    mileage.append(tiers(cum) - before + other[q])
for q in range(4):
    exp[("Car, van and travel expenses", q)] += mileage[q]

expected = {}
for q in range(4):
    ti = sum(inc[(t, q)] for t in b.INCOME_TYPES)
    te = sum(exp[(c, q)] for c in b.CATEGORIES)
    expected[("Total income", q)] = ti
    expected[("Total allowable expenses", q)] = te
    expected[("NET PROFIT (income less allowable expenses)", q)] = ti - te
    expected[("Disallowable expenses recorded (not deducted)", q)] = sum(dis[(c, q)] for c in b.CATEGORIES)
    expected[("   of which simplified mileage allowance", q)] = mileage[q]
    for c in b.CATEGORIES:
        expected[(c, q)] = exp[(c, q)]
    for t in b.INCOME_TYPES:
        expected[(t, q)] = inc[(t, q)]


def money(s):
    s = s.replace("£", "").replace(",", "").strip()
    neg = s.startswith("-") or s.startswith("(")
    s = s.strip("-()")
    return -float(s) if neg else float(s or 0)


with tempfile.TemporaryDirectory() as tmp:
    # Sheet index -1 exports every sheet to its own CSV, formulas recalculated.
    subprocess.run(["soffice", "--headless", "--convert-to",
                    'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,false,false,false,-1',
                    "--outdir", tmp, str(src)], check=True, capture_output=True)
    files = {p.stem.split("-")[-1]: p for p in Path(tmp).glob("*.csv")}
    summary = next(p for k, p in files.items() if "Summary" in k)
    year_end = next(p for k, p in files.items() if "End" in k)
    rows = list(csv.reader(summary.open(encoding="utf-8")))
    ye = list(csv.reader(year_end.open(encoding="utf-8")))

fails, checked = [], 0
for r in rows:
    if len(r) < 12 or not r[1]:
        continue
    label = r[1]
    if (label, 0) not in expected:
        continue
    running = 0.0
    for q in range(4):
        want = round(expected[(label, q)], 2)
        got = money(r[2 + q])
        running += want
        checked += 1
        if abs(got - want) > 0.005:
            fails.append(f"Summary {label} Q{q+1}: got {got} want {want}")
        got_cum = money(r[8 + q])
        checked += 1
        if abs(got_cum - round(running, 2)) > 0.005:
            fails.append(f"Summary cumulative {label} Q{q+1}: got {got_cum} want {running:.2f}")
    year = money(r[6])
    checked += 1
    if abs(year - round(running, 2)) > 0.005:
        fails.append(f"Summary year {label}: got {year} want {running:.2f}")

ye_map = {r[1]: r for r in ye if len(r) > 3 and r[1]}
year_profit = sum(expected[("NET PROFIT (income less allowable expenses)", q)] for q in range(4))
got_profit = money(ye_map["Net profit (or loss if negative)"][2])
checked += 1
if abs(got_profit - round(year_profit, 2)) > 0.005:
    fails.append(f"Year End profit: got {got_profit} want {year_profit:.2f}")
got_dis = money(ye_map["Total expenses"][3])
checked += 1
want_dis = sum(dis.values())
if abs(got_dis - round(want_dis, 2)) > 0.005:
    fails.append(f"Year End disallowable: got {got_dis} want {want_dis:.2f}")

# Pure check of the tiered mileage maths, including the 10,000-mile crossover.
assert abs(tiers(9990) - 4495.5) < 1e-9
assert abs((tiers(10010) - tiers(9990)) - (10 * 0.45 + 10 * 0.25)) < 1e-9

if fails:
    print("FAIL", *fails, sep="\n  ")
    sys.exit(1)
print(f"PASS: {checked} figures match. Year profit £{year_profit:,.2f}, mileage £{sum(mileage):,.2f}")
