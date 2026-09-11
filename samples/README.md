# Samples

## `spectora-internachi-sample.xlsx`

Synthetic Spectora-compatible spreadsheet using the **official 28-column** template import headers (Sheet1). Comment Text cells include HTML fragments similar to Spectora **Export HTML Text**. Content mimics a shortened InterNACHI-style residential inspection outline (Roof, Exterior, Structure, Electrical, Plumbing, HVAC, Interior, Insulation & Ventilation).

Regenerate:

```bash
npm run sample:generate
```

## How to get a real InterNACHI Residential export from Spectora

1. Sign up for a [Spectora](https://www.spectora.com/) free trial (inspector account).
2. Open **Templates** and locate or add the **InterNACHI Residential** (or similar) template available to trial accounts / template library.
3. Open the template → **Export to spreadsheet** → choose **Export HTML Text** (not the plain-text variant if you want HTML in Comment Text).
4. Download the `.xlsx` and import it via this app’s **Import** page.
5. Official help article: [How to export a template](https://support.spectora.com/en/articles/2769896-how-to-export-a-template)
6. Column reference: Spectora’s public import sample spreadsheet — [Google Sheet](https://docs.google.com/spreadsheets/d/1gdMsUItVACbL4fq1Pqiie_u3xk_5UeMjPQTvhh1sMRU)

> Do not commit copyrighted InterNACHI/Spectora proprietary template content. Use your own trial export locally; this repo only ships a synthetic sample.
