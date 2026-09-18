# NOTES

## Time estimate

Approximately **10–14 hours** wall-clock across scaffold, Spectora parsing, Postgres/Supabase, Vercel deploy, product exploration (Spectora + Hive), and docs. Focused coding time closer to **~8 hours**.

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

Signed up for a free trial, loaded **InterNACHI Residential** from Template Center, exported HTML Text, and used that file as the importer input. Export UX matches Spectora’s support article (three-dot menu → Export to spreadsheet → Export HTML Text).

### Hive Inspect (required)

Trial exploration notes (dashboard onboarding, sample inspection / publish, and Spectora template import path) are captured under **Hive product feedback** below as the trial walkthrough is completed. Hive docs describe importing Spectora templates as HTML and also offer Template Hub certified templates — that dual path informed the “preview preserved vs skipped” polish in this app.

### Binsr (optional)

Not fully explored in this pass. Choice: prioritize Spectora fidelity + Hive’s own import docs over a third product, given the two-day hackathon budget. Happy to compare in the walkthrough if reviewers want that angle.

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

## Hive product feedback (draft for walkthrough)

From Hive docs + switching guide (to be validated hands-on in trial):

- Spectora switch path expects **HTML** template export — same constraint this assignment uses; previewing drop/skip is high-leverage for switchers.
- Template Hub + certified forms (TREC, NPMA-33, etc.) are strong; clarifying “what survived import” in-product would reduce support load for Spectora movers.
- Docs are phone-first and clear; a single “switching checklist” that pairs contact import + template import + first published report would match the assignment’s required exploration path.

## Credits / references

- Spectora export docs: https://support.spectora.com/en/articles/2769896-how-to-export-a-template
- Spectora sample spreadsheet: https://docs.google.com/spreadsheets/d/1gdMsUItVACbL4fq1Pqiie_u3xk_5UeMjPQTvhh1sMRU
- Hive docs: https://docs.hiveinspect.com/ (switching / inspection templates)
- SheetJS · Prisma · Next.js App Router · Supabase · Vercel

## Authorship

Commits authored as **Shriprasad R Patil** `<shriprasadpatil6@gmail.com>`.
