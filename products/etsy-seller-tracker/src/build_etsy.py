"""Build the UK Etsy Seller Profit Tracker workbooks (blank + example).

Plain formulas only (IF, SUMIFS, COUNTIFS, COUNTIF, VLOOKUP, EDATE, TODAY).
"""
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "sole-trader-tracker" / "src"))
import build_xlsx as st  # noqa: E402
from openpyxl import Workbook  # noqa: E402
from openpyxl.styles import Alignment, PatternFill  # noqa: E402
from openpyxl.worksheet.datavalidation import DataValidation  # noqa: E402

font, header, title, unlock, BOX, GBP, DMY = st.font, st.header, st.title, st.unlock, st.BOX, st.GBP, st.DMY
FIRST, LAST = 5, 2004          # 2,000 sales / expense rows
P_FIRST, P_LAST = 5, 204       # 200 products
CREAM = PatternFill("solid", fgColor=st.INPUT)
SOFT = PatternFill("solid", fgColor=st.BRAND_SOFT)

# Etsy UK seller fees as published for June 2026. Editable on Settings.
FEES = [
    ("Transaction fee (% of item price + postage)", 0.065, "0.0%"),
    ("Payment processing (% of order total)", 0.04, "0.0%"),
    ("Payment processing (fixed, per order)", 0.20, "£0.00"),
    ("Regulatory operating fee (% of item price + postage)", 0.0048, "0.00%"),
    ("Listing renewal (per item sold, about $0.20)", 0.16, "£0.00"),
    ("Offsite Ads (% of order, when a sale came from an ad)", 0.15, "0%"),
    ("VAT on Etsy fees (if you haven't given Etsy a VAT number)", 0.20, "0%"),
]
F = {k: f"Settings!$C${11 + i}" for i, k in enumerate(["trans", "proc", "fixed", "reg", "listing", "offsite", "vat"])}


def cream(c):
    c.fill = CREAM
    c.border = BOX
    unlock(c)


def settings(wb):
    ws = wb.create_sheet("Settings")
    title(ws, "Settings", "Fill in the cream cells once. Check the fee rates against Etsy's fee page each year.")
    rows = [("Shop name", "Your shop name", "", None),
            ("Given Etsy a UK VAT number?", "No", "If Yes, Etsy doesn't charge VAT on your fees.", None),
            ("First month of your year", date(2026, 4, 1), "The Monthly Summary starts here.", DMY),
            ("VAT check as at", None, "Leave blank to use today's date.", DMY)]
    for i, (label, val, note, fmt) in enumerate(rows):
        r = 4 + i
        ws.cell(row=r, column=2, value=label).font = font(10, True)
        c = ws.cell(row=r, column=3, value=val)
        cream(c)
        if fmt:
            c.number_format = fmt
        ws.cell(row=r, column=4, value=note).font = font(9, color=st.MUTED, italic=True)
    ws["B8"], ws["C8"] = "VAT check date in use", '=IF(C7="",TODAY(),C7)'
    ws["C8"].number_format = DMY
    header(ws, 10, ["Etsy fee", "Rate", "Etsy UK rates as published June 2026"])
    for i, (label, rate, fmt) in enumerate(FEES):
        r = 11 + i
        ws.cell(row=r, column=2, value=label).border = BOX
        c = ws.cell(row=r, column=3, value=rate)
        cream(c)
        c.number_format = fmt
    ws["B19"], ws["C19"] = "VAT registration threshold £", 90000
    cream(ws["C19"])
    ws["C19"].number_format = '£#,##0'
    ws["B20"] = "If Etsy changes a rate, update it at the start of a new year or start a fresh copy, so past sales keep their rates."
    ws["B20"].font = font(9, color=st.MUTED, italic=True)
    for i, v in enumerate(st.CATEGORIES):
        ws.cell(row=4 + i, column=7, value=v).font = font(9, color=st.MUTED)
    for i, v in enumerate(["Yes", "No"]):
        ws.cell(row=4 + i, column=10, value=v).font = font(9, color=st.MUTED)
    ws["G3"] = "Dropdown lists"
    ws["G3"].font = font(10, True, st.MUTED)
    dv = DataValidation(type="list", formula1="=$J$4:$J$5", allow_blank=False)
    ws.add_data_validation(dv)
    dv.add("C5")
    for col, w in {"B": 52, "C": 18, "D": 44, "G": 46, "J": 8}.items():
        ws.column_dimensions[col].width = w
    ws.protection.sheet = True


def sheet(wb, name, sub, labels, widths, inputs, first, last):
    ws = wb.create_sheet(name)
    title(ws, name, sub)
    header(ws, 4, labels)
    for i, w in enumerate(widths):
        ws.column_dimensions[chr(ord("B") + i)].width = w
    ws.freeze_panes = "C5"
    for r in range(first, last + 1):
        for col in inputs:
            cream(ws[f"{col}{r}"])
    ws.protection.sheet = True
    ws.protection.formatColumns = False
    ws.protection.sort = False
    ws.protection.autoFilter = False
    ws.auto_filter.ref = f"B4:{chr(ord('B') + len(labels) - 1)}{last}"
    return ws


def calc(ws, r, col, f, fmt=GBP):
    c = ws[f"{col}{r}"]
    c.value = f
    c.number_format = fmt
    c.font = font(10, color=st.MUTED)
    c.border = BOX


def products(wb):
    ws = sheet(wb, "Products", "One row per product. Costs are per unit.",
               ["SKU", "Product name", "Materials £ per unit", "Packaging £ per unit", "Unit cost £"],
               [14, 34, 16, 16, 14], "BCDE", P_FIRST, P_LAST)
    for r in range(P_FIRST, P_LAST + 1):
        ws[f"D{r}"].number_format = GBP
        ws[f"E{r}"].number_format = GBP
        calc(ws, r, "F", f'=IF(B{r}="","",D{r}+E{r})')
    return ws


def sales(wb):
    ws = sheet(wb, "Sales", "One row per product in each order. Copy the figures from your Etsy order.",
               ["Date", "Order no.", "SKU", "Qty", "Item price £", "Postage charged £", "From Offsite Ad?",
                "Postage you paid £", "Revenue £", "Etsy fees £", "VAT on fees £", "Cost of goods £", "Profit £"],
               [12, 14, 13, 7, 13, 13, 11, 13, 13, 13, 13, 13, 13], "BCDEFGHI", FIRST, LAST)
    v1 = DataValidation(type="list", formula1=f"=Products!$B${P_FIRST}:$B${P_LAST}", allow_blank=True)
    v2 = DataValidation(type="list", formula1="=Settings!$J$4:$J$5", allow_blank=True)
    ws.add_data_validation(v1)
    ws.add_data_validation(v2)
    v1.add(f"D{FIRST}:D{LAST}")
    v2.add(f"H{FIRST}:H{LAST}")
    for r in range(FIRST, LAST + 1):
        ws[f"B{r}"].number_format = DMY
        for col in "FGI":
            ws[f"{col}{r}"].number_format = GBP
        calc(ws, r, "J", f'=IF(B{r}="","",F{r}+G{r})')
        # The fixed processing fee is charged once per order, so only on an order's first line.
        fixed = f'IF(C{r}="",{F["fixed"]},IF(COUNTIF($C${FIRST}:C{r},C{r})=1,{F["fixed"]},0))'
        calc(ws, r, "K", (f'=IF(B{r}="","",J{r}*({F["trans"]}+{F["proc"]}+{F["reg"]})+{fixed}'
                          f'+E{r}*{F["listing"]}+IF(H{r}="Yes",J{r}*{F["offsite"]},0))'))
        calc(ws, r, "L", f'=IF(B{r}="","",IF(Settings!$C$5="Yes",0,K{r}*{F["vat"]}))')
        calc(ws, r, "M", f'=IF(B{r}="","",E{r}*IFERROR(VLOOKUP(D{r},Products!$B${P_FIRST}:$F${P_LAST},5,FALSE),0))')
        calc(ws, r, "N", f'=IF(B{r}="","",J{r}-K{r}-L{r}-M{r}-I{r})')
    return ws


def expenses(wb):
    ws = sheet(wb, "Expenses", "Other business costs: Etsy Ads, supplies in bulk, software, insurance.",
               ["Date", "Supplier", "Description", "Category", "Amount £", "Ref"],
               [12, 20, 30, 46, 13, 12], "BCDEFG", FIRST, LAST)
    v = DataValidation(type="list", formula1=f"=Settings!$G$4:$G${3 + len(st.CATEGORIES)}", allow_blank=True)
    ws.add_data_validation(v)
    v.add(f"E{FIRST}:E{LAST}")
    for r in range(FIRST, LAST + 1):
        ws[f"B{r}"].number_format = DMY
        ws[f"F{r}"].number_format = GBP
    return ws


def per_product(wb):
    ws = wb.create_sheet("Profit per Product")
    title(ws, "Profit per Product", "Which products earn their keep. Nothing to type here.")
    header(ws, 4, ["SKU", "Product", "Units sold", "Revenue £", "Fees and VAT £", "Cost of goods £", "Postage paid £",
                   "Profit £", "Profit margin"])
    S = lambda col: f"Sales!${col}${FIRST}:${col}${LAST}"  # noqa: E731
    for i in range(P_LAST - P_FIRST + 1):
        r, p = 5 + i, P_FIRST + i
        ws[f"B{r}"] = f'=IF(Products!B{p}="","",Products!B{p})'
        ws[f"C{r}"] = f'=IF(B{r}="","",Products!C{p})'
        ws[f"D{r}"] = f'=IF(B{r}="","",SUMIFS({S("E")},{S("D")},B{r}))'
        ws[f"E{r}"] = f'=IF(B{r}="","",SUMIFS({S("J")},{S("D")},B{r}))'
        ws[f"F{r}"] = f'=IF(B{r}="","",SUMIFS({S("K")},{S("D")},B{r})+SUMIFS({S("L")},{S("D")},B{r}))'
        ws[f"G{r}"] = f'=IF(B{r}="","",SUMIFS({S("M")},{S("D")},B{r}))'
        ws[f"H{r}"] = f'=IF(B{r}="","",SUMIFS({S("I")},{S("D")},B{r}))'
        ws[f"I{r}"] = f'=IF(B{r}="","",E{r}-F{r}-G{r}-H{r})'
        ws[f"J{r}"] = f'=IF(B{r}="","",IF(E{r}=0,"",I{r}/E{r}))'
        for col in "EFGHI":
            ws[f"{col}{r}"].number_format = GBP
        ws[f"J{r}"].number_format = "0.0%"
    ws.freeze_panes = "D5"
    for col, w in {"B": 13, "C": 30, "D": 11, "E": 13, "F": 15, "G": 15, "H": 14, "I": 13, "J": 13}.items():
        ws.column_dimensions[col].width = w
    ws.protection.sheet = True
    ws.protection.sort = False
    ws.protection.autoFilter = False
    ws.auto_filter.ref = f"B4:J{4 + P_LAST - P_FIRST + 1}"


def monthly(wb):
    ws = wb.create_sheet("Monthly Summary")
    title(ws, "Monthly Summary", "Your shop month by month, and the VAT threshold check. Nothing to type here.")
    ws["B3"] = "=Settings!C4"
    ws["B3"].font = font(10, True, st.MUTED)
    header(ws, 5, ["Month", "Order lines", "Revenue £", "Etsy fees £", "VAT on fees £", "Cost of goods £",
                   "Postage paid £", "Other expenses £", "Profit £"])
    S = lambda col: f"Sales!${col}${FIRST}:${col}${LAST}"  # noqa: E731
    X = lambda col: f"Expenses!${col}${FIRST}:${col}${LAST}"  # noqa: E731
    for k in range(12):
        r = 6 + k
        ws[f"B{r}"] = f"=EDATE(Settings!$C$6,{k})"
        ws[f"B{r}"].number_format = "mmm yyyy"
        rng = f'{S("B")},">="&$B{r},{S("B")},"<"&EDATE($B{r},1)'
        ws[f"C{r}"] = f"=COUNTIFS({rng})"
        for col, src in zip("DEFGH", "JKLMI"):
            ws[f"{col}{r}"] = f"=SUMIFS({S(src)},{rng})"
        ws[f"I{r}"] = f'=SUMIFS({X("F")},{X("B")},">="&$B{r},{X("B")},"<"&EDATE($B{r},1))'
        ws[f"J{r}"] = f"=D{r}-E{r}-F{r}-G{r}-H{r}-I{r}"
    ws["B18"] = "Year"
    for col in "CDEFGHIJ":
        ws[f"{col}18"] = f"=SUM({col}6:{col}17)"
    for r in range(6, 19):
        for col in "BCDEFGHIJ":
            c = ws[f"{col}{r}"]
            c.border = BOX
            if col not in "BC":
                c.number_format = GBP
            if r == 18:
                c.font = font(10, True)
                c.fill = SOFT
    header(ws, 21, ["VAT threshold check", ""])
    ws["B22"] = "Sales in the 12 months to"
    ws["C22"] = "=Settings!C8"
    ws["C22"].number_format = DMY
    ws["B23"] = "Etsy revenue in those 12 months"
    ws["C23"] = f'=SUMIFS({S("J")},{S("B")},">"&EDATE(Settings!C8,-12),{S("B")},"<="&Settings!C8)'
    ws["C23"].number_format = GBP
    ws["B24"] = "Left before the threshold"
    ws["C24"] = "=Settings!C19-C23"
    ws["C24"].number_format = GBP
    ws["B25"] = ('=IF(C23>Settings!C19,"Over the VAT threshold: you must register for VAT.",'
                 'IF(C24<15000,"Within £15,000 of the VAT threshold: keep a close eye on it.",'
                 '"Below the VAT threshold."))')
    ws["B25"].font = font(10, True, st.BRAND)
    ws["B26"] = "The threshold counts all your taxable sales, not only Etsy. Add sales from other places to be sure."
    ws["B26"].font = font(9, color=st.MUTED, italic=True)
    for r in (22, 23, 24):
        ws[f"B{r}"].border = BOX
        ws[f"C{r}"].border = BOX
    for col, w in {"B": 36, "C": 14, "D": 14, "E": 14, "F": 14, "G": 15, "H": 14, "I": 16, "J": 14}.items():
        ws.column_dimensions[col].width = w
    ws.protection.sheet = True


def start(wb):
    ws = wb.active
    ws.title = "Start Here"
    title(ws, "UK Etsy Seller Profit Tracker", "Real profit per sale and per product after every Etsy fee, plus a VAT threshold check.")
    lines = [
        "SET UP IN 3 STEPS",
        "1.  Go to Settings. Type your shop name, say whether you have given Etsy a VAT number, and check the fee rates.",
        "2.  Add your products on Products (SKU, name, cost per unit).",
        "3.  Add each sale on Sales and other costs on Expenses. Type only in the cream cells.",
        "",
        "WHAT YOU SEE",
        "•  Sales works out Etsy's fees, VAT on fees, cost of goods and profit for every line.",
        "•  Profit per Product shows which products make money. Monthly Summary shows your year, and checks the £90,000 VAT threshold.",
        "•  An order with two products: one row each, the same order number, and postage on the first row. The 20p fee is counted once.",
        "•  Grey cells hold formulas and are protected without a password (Review > Unprotect Sheet to change them).",
        "•  Works in Excel, Google Sheets (File > Import), Apple Numbers and LibreOffice. No macros.",
        "",
        "IMPORTANT",
        "Fee rates are as Etsy published them in June 2026 and can change. Check them on Etsy's fee page and update Settings.",
        "Fees are worked out from the rates, so they can differ slightly from your Etsy statement (for example, Offsite Ads are capped per order).",
        "This is a record-keeping tool, not tax advice. For your tax return totals, use the Sole Trader Quarterly Tracker or your accountant.",
    ]
    for i, text in enumerate(lines):
        c = ws.cell(row=4 + i, column=2, value=text)
        c.font = font(10, True, st.BRAND) if text.isupper() and text else font(10, color=st.WARN if text.startswith(("Fee rates", "Fees are", "This is")) else st.INK)
        c.alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[4 + i].height = 30 if len(text) > 110 else 18
    ws.column_dimensions["B"].width = 110


SAMPLE_PRODUCTS = [("CANDLE-L", "Large soy candle, fig", 4.20, 1.10), ("CANDLE-S", "Small soy candle, linen", 2.10, 0.80),
                   ("MELT-6", "Wax melts, pack of 6", 1.30, 0.50)]
def _sample_sales():
    """A year of a small candle shop: about 70 orders a month, busier before Christmas.
    Deterministic, so the example file and its checks never change between builds."""
    weights = [0.8, 0.8, 0.7, 0.7, 0.8, 0.9, 1.1, 1.6, 2.2, 0.7, 0.8, 0.9]  # Apr..Mar
    skus = [("CANDLE-L", 24.00), ("CANDLE-S", 14.00), ("MELT-6", 6.50)]
    rows, order = [], 3400
    for k, w in enumerate(weights):
        y, m = (2026, 4 + k) if k < 9 else (2027, k - 8)
        for j in range(round(60 * w)):
            order += 1
            sku, price = skus[(order * 7) % 3]
            qty = 1 + (order % 5 == 0)
            post, paid = (0.00, 4.50) if price * qty >= 45 else (3.95, 3.20)
            ad = "Yes" if order % 11 == 0 else "No"
            d = date(y, m, 1 + (j * 3) % 28)
            rows.append((d, str(order), sku, qty, price * qty, post, ad, paid))
            if order % 9 == 0:  # some orders add a pack of melts: same order, no extra postage
                rows.append((d, str(order), "MELT-6", 1, 6.50, 0.00, ad, 0.00))
    return rows


SAMPLE_SALES = _sample_sales()

SAMPLE_EXPENSES = [
    *[(date(2026 + (k > 8), (k + 3) % 12 + 1, 1), "Etsy", "Etsy Ads", "Advertising and business entertainment costs", 40.00, f"A{k + 1:02d}")
      for k in range(12)],
    (date(2026, 4, 1), "Wax Supplies Co", "Soy wax and wicks (bulk)", "Cost of goods bought for resale or goods used", 180.00, "E01"),
    (date(2026, 6, 1), "Canva", "Canva Pro", "Phone, fax, stationery and other office costs", 10.99, "E02"),
    (date(2026, 9, 3), "Simply Business", "Product liability insurance", "Rent, rates, power and insurance costs", 62.40, "E03"),
]


def build(path, example):
    wb = Workbook()
    start(wb)
    settings(wb)
    prod = products(wb)
    sal = sales(wb)
    exp = expenses(wb)
    per_product(wb)
    monthly(wb)
    if example:
        s = wb["Settings"]
        s["C4"] = "Fig & Linen Candles (example)"
        s["C7"] = date(2027, 3, 31)
        for i, row in enumerate(SAMPLE_PRODUCTS):
            for j, v in enumerate(row):
                prod.cell(row=P_FIRST + i, column=2 + j, value=v)
        for ws, rows in ((sal, SAMPLE_SALES), (exp, SAMPLE_EXPENSES)):
            for i, row in enumerate(rows):
                for j, v in enumerate(row):
                    ws.cell(row=FIRST + i, column=2 + j, value=v)
    wb.save(path)


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "dist")
    out.mkdir(parents=True, exist_ok=True)
    build(out / "UK-Etsy-Seller-Profit-Tracker.xlsx", example=False)
    build(out / "UK-Etsy-Seller-Profit-Tracker-EXAMPLE.xlsx", example=True)
    print("built", out)
