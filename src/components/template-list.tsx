"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, FileStack, Trash2 } from "lucide-react";
import { useState } from "react";
import type { TemplateSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function TemplateList({ templates }: { templates: TemplateSummary[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function duplicate(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/templates/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Duplicate failed");
      router.push(`/templates/${data.template.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Duplicate failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  if (!templates.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No templates yet</CardTitle>
          <CardDescription>
            Import a Spectora HTML Text spreadsheet to get started, or run{" "}
            <code className="rounded bg-slate-100 px-1">npm run db:seed</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/import">
            <Button>Import spreadsheet</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <FileStack className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <Link
                  href={`/templates/${t.id}`}
                  className="hover:text-amber-700 hover:underline"
                >
                  {t.name}
                </Link>
              </CardTitle>
              <CardDescription>
                {t.sectionCount} sections · {t.itemCount} items ·{" "}
                {t.commentCount} comments
                {t.parentTemplateId ? " · duplicated" : ""}
                {t.source ? ` · ${t.source}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                Updated {formatDate(t.updatedAt)} IST
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy === t.id}
                  onClick={() => void duplicate(t.id)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === t.id}
                  onClick={() => void remove(t.id, t.name)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
