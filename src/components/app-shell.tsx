import Link from "next/link";
import { ClipboardList, Upload } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white">
              <ClipboardList className="h-4 w-4" />
            </span>
            <span>
              Hive Inspect{" "}
              <span className="font-normal text-slate-500">
                Template Importer
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Templates
            </Link>
            <Link
              href="/import"
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              <Upload className="h-4 w-4" />
              Import
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Hive Inspect FDE take-home · Spectora HTML Text importer
      </footer>
    </div>
  );
}
