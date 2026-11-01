# Sole Trader Quarterly Tracker

A digital product for Etsy and Payhip: a UK sole trader income, expense and mileage tracker with Making Tax Digital quarterly totals and SA103-style year-end totals.

- `dist/`: the three files buyers download (blank tracker, example tracker, PDF guide).
- `listing/`: the 8 listing images (2000 x 2000 JPG), in upload order.
- `LISTING.md`: title, tags, description, price and the pre-publish checklist.
- `src/`: the scripts that build everything.

## Rebuild

Needs Python 3 with `openpyxl`, LibreOffice (`soffice`) and Node with Playwright.

```bash
cd src
python3 build_xlsx.py ../dist     # build the blank and example workbooks
python3 verify.py ../dist         # recalculate in LibreOffice, check 191 totals
python3 render.py ../dist ../listing   # images and the PDF guide, from the recalculated example
```

For a new tax year, change `TAX_YEAR` in `build_xlsx.py`, the sample dates, and the year in the file names, then rebuild.
