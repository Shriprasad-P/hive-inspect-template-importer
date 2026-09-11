# NOTES

## Time estimate

**Placeholder:** ~6–8 hours focused implementation (scaffold, Spectora 28-col parser, preview UX, Prisma SQLite, seed/sample, docs, polish). Actual wall-clock may vary.

## What was cut / deferred

- Full persistence of Spectora metadata columns (Comment Type, Category, photos, estimates, answer types, etc.). They are intentionally **skipped** and shown in the import preview/report so reviewers see the tradeoff.
- Multi-user auth / org tenancy.
- Rich WYSIWYG comment editor (plain HTML textarea + sanitized display via `dangerouslySetInnerHTML`).
- Photo attachment import.
- Live Supabase Realtime; optional Supabase JS client is wired only when env vars + package are present.
- Automated E2E test suite (manual verification checklist below instead).

## Known limits

- SQLite on Vercel is not durable across serverless instances — use Postgres/Supabase for production deploy.
- Very large Spectora exports (thousands of rows) are parsed in-memory with SheetJS; may need streaming/chunking for huge files.
- Comment Name is folded into `body_html` rather than a separate DB column to keep the required Template→Section→Item→Comment model tight.
- HTML in comments is displayed as authored; no full XSS sanitizer library (trusted inspector-authored content assumption for this take-home).

## Verification checklist

1. `npm install && npm run db:migrate && npm run sample:generate && npm run db:seed && npm run build`
2. `npm run dev` → home shows seeded **InterNACHI Residential (sample)**
3. Open template → edit section name, item name, comment HTML → refresh → edits persist
4. Duplicate → edit copy → original unchanged
5. Import → upload `samples/spectora-internachi-sample.xlsx` → **preview** shows preserved vs skipped → confirm → new template
6. Failure cases:
   - Empty file → clear error
   - File missing Section Name / Item Name headers → clear error
7. Import report on template detail lists skipped metadata columns / blank rows

## Credits / references

- Spectora export docs: https://support.spectora.com/en/articles/2769896-how-to-export-a-template
- Spectora official import sample spreadsheet (28-column headers): https://docs.google.com/spreadsheets/d/1gdMsUItVACbL4fq1Pqiie_u3xk_5UeMjPQTvhh1sMRU
- SheetJS (xlsx): https://sheetjs.com/
- Prisma + Next.js App Router
- InterNACHI residential inspection structure used only as realistic *synthetic* section/item naming for the sample file (not an official InterNACHI export)

## Authorship

Commits authored as **Shriprasad R Patil** `<shriprasadpatil6@gmail.com>`.
