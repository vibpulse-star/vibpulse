# Digital products

Three finished spreadsheet products and two bundles, ready to list on Etsy and Payhip. All prices in GBP.

| Product | Folder | Launch | Full |
|---|---|---|---|
| Sole Trader Quarterly Tracker 2026-27 | `sole-trader-tracker/` | £8.99 | £14.99 |
| UK Landlord Rental Tracker 2026-27 | `landlord-tracker/` | £9.99 | £16.99 |
| UK Etsy Seller Profit Tracker | `etsy-seller-tracker/` | £7.99 | £12.99 |
| MTD Duo (Sole Trader + Landlord) | `bundles/` | £19.99 | |
| Etsy Seller Tax Kit (Etsy + Sole Trader) | `bundles/` | £16.99 | |

Each product folder has `dist/` (the files buyers download), `listing/` (8 images, 2000 x 2000), `LISTING.md` (title, tags, description, checklist) and `src/` (build, verify, render).

## Rebuild everything

Needs Python 3 with `openpyxl`, LibreOffice (`soffice`) and Node with Playwright.

```bash
(cd sole-trader-tracker/src && python3 build_xlsx.py ../dist && python3 verify.py ../dist && python3 render.py ../dist ../listing)
(cd landlord-tracker/src && python3 build_landlord.py ../dist && python3 verify.py ../dist && python3 render.py ../dist ../listing)
(cd etsy-seller-tracker/src && python3 build_etsy.py ../dist && python3 verify.py ../dist && python3 render.py ../dist ../listing)
(cd bundles && python3 build.py)
```

Each `verify.py` recalculates the example workbook in LibreOffice and checks its totals against an independent Python calculation.
