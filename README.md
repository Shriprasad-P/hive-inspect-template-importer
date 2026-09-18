# Hive Inspect · Spectora Template Importer

FDE take-home: import Spectora **Export to spreadsheet → Export HTML Text** files into an editable Template → Section → Item → Comment hierarchy, with duplicate support and a real backend.

## Live demo

https://hive-inspect-template-importer-delta.vercel.app

## Features

- **Import** Spectora HTML Text / template `.xlsx` (official 28-column layout)
- **Import preview** (polish): see what will be **preserved vs skipped** before confirming
- **Edit** template name, section names, item names, and comment HTML; save to DB
- **Duplicate** a template; edits on the copy do not affect the original
- **Import report** surfaces skipped rows/columns (metadata, blank rows, unused sheets)
- **Failure handling** for empty files and missing sheets/columns
- **Persistence**: Prisma + **Postgres (Supabase)** in production; local demo can still use a Postgres `DATABASE_URL` (see `.env.example`).

## Stack

- Next.js 14 (App Router) · TypeScript · Tailwind · shadcn-style UI
- Prisma · Postgres (Supabase on Vercel)
- SheetJS (`xlsx`) for spreadsheet parsing

## Quick start (local demo)

```bash
npm install
cp .env.example .env   # set DATABASE_URL to Postgres (Supabase pooler)
npm run db:push
# optional synthetic seed:
# npm run sample:generate && npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) after setting `DATABASE_URL`. Prefer importing `samples/spectora-internachi-residential-html-text.xlsx` (real Spectora HTML Text export).

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push` | `prisma db push` (quick schema sync) |
| `npm run db:seed` | Seed sample imported template |
| `npm run sample:generate` | Write `samples/spectora-internachi-sample.xlsx` |

## Environment variables

See [`.env.example`](./.env.example).

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Default: `file:../data/dev.db` (relative to `prisma/`) |
| `DIRECT_URL` | Postgres only | Direct (non-pooler) URL for migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | No | When set with anon key, app prefers Supabase JS client where supported |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |

### Switching to Supabase / Postgres

1. Create a Supabase project and copy the connection strings.
2. In `prisma/schema.prisma`, set `provider = "postgresql"`.
3. Set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in `.env`.
4. Run `npx prisma migrate deploy` (or `db push`) and `npm run db:seed`.

The app builds and runs for demo **without** any Supabase credentials using SQLite.

## Spectora column mapping

Official sample headers (28 columns). We **persist**:

| Spectora column | Our model |
|-----------------|-----------|
| Section Name | `sections.name` |
| Item Name | `items.name` |
| Comment Name | Folded into comment `body_html` as a `<strong>` title |
| Comment Text | `comments.body_html` (HTML allowed) |
| Order | Sort key within an item (then row order) |

All other columns (Comment Type, Category, photos, estimates, etc.) are **skipped** and listed in the import report / preview.

Docs: [How to export a template (Spectora)](https://support.spectora.com/en/articles/2769896-how-to-export-a-template)

## Sample file

- [`samples/spectora-internachi-sample.xlsx`](./samples/spectora-internachi-sample.xlsx) — synthetic InterNACHI-like residential content with HTML in Comment Text
- [`samples/README.md`](./samples/README.md) — how to obtain a real InterNACHI Residential export from Spectora free trial

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. For demo SQLite: note that Vercel’s serverless filesystem is ephemeral — use **Supabase Postgres** for a durable deploy (`DATABASE_URL` + `provider = "postgresql"`).
4. Set env vars in the Vercel project, run migrations against Supabase, then deploy.

`npm run build` must pass locally before deploy.

## Data model

```
templates → sections → items → comments
import_reports (optional, linked to template)
```

`templates.parent_template_id` links duplicates to their source.

## License

Take-home / portfolio use.
