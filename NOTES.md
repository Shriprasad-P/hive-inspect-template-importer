# NOTES

## Time estimate

Approximately **12–16 hours** wall-clock across scaffold, Spectora parsing, Postgres/Supabase, Vercel deploy, product exploration (Spectora + Hive), and docs. Focused coding time closer to **~9 hours**.

## Live deploy

- **URL:** https://hive-inspect-template-importer-delta.vercel.app
- **Repo:** https://github.com/Shriprasad-P/hive-inspect-template-importer
- **Backend:** Supabase Postgres (`hive-inspect-template-importer`, Mumbai / `ap-south-1`) via Prisma
- **Seeded / imported:** Real Spectora **InterNACHI Residential** HTML Text export (13 sections / 69 items / 392 comments), plus earlier synthetic seed retained for comparison

## Spectora input file (required)

Committed at `samples/spectora-internachi-residential-html-text.xlsx`.

| Field | Value |
|--------|--------|
| Template | InterNACHI Residential (Spectora Template Center, id `335823`) |
| Export | Templates → ⋯ → Export to spreadsheet → **Export HTML Text** |
| Date | 2026-09-18 |
| Notes | Download filename used `.xls`; bytes are OOXML `.xlsx`. Sheet has HTML in Comment Text. Extra metadata columns beyond the classic 28-col sample are present and intentionally skipped in the import report. |

Synthetic `samples/spectora-internachi-sample.xlsx` remains for offline demos (`npm run sample:generate`).

## Product exploration

### Spectora (required)

Signed up for a free trial, loaded **InterNACHI Residential** from Template Center (id `335823`), exported HTML Text, and committed that file. Export UX matches Spectora’s support article (⋯ → Export to spreadsheet → Export HTML Text). Download used a `.xls` name; bytes are OOXML `.xlsx`.

### Hive Inspect (required)

Free trial account (dashboard as company **Shultz**). Hands-on:

1. **Templates → Upload → Import Template → Spectora** accepts `.xls`/`.xlsx` only. Uploaded the committed InterNACHI HTML Text file (~20s; “Downloading and uploading images…” overlay even with no photos).
2. Import result: **13 sections / 69 subsections / 392 fields** — matches our importer’s preserved counts. `&amp;` normalized to `&`.
3. Demo inspection (123 Sample Street) has a working **Web Editor** (not mobile-only): Preview opens a full client report; **Publish** dialog is clear (“visible to clients”). Did **not** publish, to preserve the 5 free reports.
4. Attached the imported Spectora template to the demo order → **Generate Report** required (import ≠ ready report). Fresh InterNACHI client preview looked nearly empty until comments were selected — unchecked fields are hidden.
5. New Inspection wizard: Confirm stays disabled until date/time; first paint showed “Availability not configured.”

### Binsr (optional)

Skipped for time. Prioritized Spectora fidelity + Hive’s own Spectora import path under the two-day budget.

## What was cut / deferred

- Persisting Spectora metadata columns (Comment Type, Category, photos, estimates, answer types, etc.). Shown as **skipped** in import preview/report so the tradeoff is visible.
- Multi-user auth / org tenancy (live app is open for reviewers; no login).
- Rich WYSIWYG comment editor (textarea + HTML display).
- Photo attachment import.
- Automated E2E suite (manual checklist below).
- Full Binsr competitive teardown.

## Chosen polish

**Import preview (preserved vs skipped)** before confirm — maps to the customer problem of trusting that years of template work survived the move. Reviewers see hierarchy counts and every skipped metadata column/row reason before anything is written.

## Known limits

- In-memory SheetJS parse; very large exports may need streaming later.
- Comment Name is folded into `body_html` when present (no separate DB column) to keep Template→Section→Item→Comment tight.
- Comment HTML is shown as authored (trusted inspector content assumption for this take-home; no full XSS sanitizer library).
- Extra Spectora columns beyond our model are not editable after import (by design for v1).

## Verification checklist

1. Live URL opens with imported **InterNACHI Residential (Spectora HTML Text)** (and/or seed).
2. Edit section / item / comment → refresh → persists.
3. Duplicate → edit copy → original unchanged.
4. Import → upload committed `samples/spectora-internachi-residential-html-text.xlsx` → preview shows preserved vs skipped → confirm.
5. Failure cases: empty file; missing Section Name / Item Name headers.
6. Import report on template detail lists skipped metadata.

## Hive product feedback (for walkthrough)

What works well:
- Spectora is first in “Current Software” on signup, with copy that setup will help import — good switcher intent.
- Spectora xlsx import lands the full InterNACHI hierarchy quickly; Web Editor + Preview are desktop-capable and polished.
- Trial messaging is clear (5 reports, no card).

Friction / opportunities:
- **Import name = filename**, truncated in the editor; rename is a separate step. Default to Spectora template title when present.
- One “Spectora” import choice with no HTML vs Plain Text label — switchers may upload the wrong export.
- After import, editor showed **unsaved changes** with no edits made (noise).
- **Attach template ≠ generated report** — needs an extra Generate Report; easy to miss (“Template – Not Generated”).
- Client preview **hides unchecked comments**, so a freshly generated InterNACHI template looks empty despite 392 imported fields. A post-import “select defaults / expand all” would help trust.
- Signup verification URL stays on `/signup?step=2`; refresh loses the pending-verify state and drops you on generic login.
- Terms checkbox / CTA can sit below the fold on step 2; disabled CTA still looks fully blue.
- New Inspection: availability must be configured before Confirm enables — first-run friction for trial users.

How this informed our take-home: we invested in **import preview (preserved vs skipped)** so switchers see survival before commit — the same trust gap Hive’s blank post-import preview exposes.

## Credits / references

- Spectora export docs: https://support.spectora.com/en/articles/2769896-how-to-export-a-template
- Spectora sample spreadsheet: https://docs.google.com/spreadsheets/d/1gdMsUItVACbL4fq1Pqiie_u3xk_5UeMjPQTvhh1sMRU
- Hive docs: https://docs.hiveinspect.com/ (switching / inspection templates)
- SheetJS · Prisma · Next.js App Router · Supabase · Vercel

## Authorship

Commits authored as **Shriprasad R Patil** `<shriprasadpatil6@gmail.com>`.
