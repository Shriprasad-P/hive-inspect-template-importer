"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, ChevronDown, ChevronRight } from "lucide-react";
import type { TemplateDetail } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { EditableText } from "./editable-text";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function TemplateEditor({
  template,
  report,
}: {
  template: TemplateDetail;
  report: {
    filename: string;
    preserved: { sectionCount: number; itemCount: number; commentCount: number };
    skipped: Array<{ row: number; reason: string; sheet?: string }>;
  } | null;
}) {
  const router = useRouter();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(template.sections.map((s) => [s.id, true]))
  );
  const [showReport, setShowReport] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(url: string, body: object) {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Save failed");
    router.refresh();
  }

  async function duplicate() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/templates/${template.id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Duplicate failed");
      router.push(`/templates/${data.template.id}`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Duplicate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <EditableText
            value={template.name}
            displayClassName="text-2xl font-bold"
            onSave={async (name) => {
              await patch(`/api/templates/${template.id}`, { name });
            }}
          />
          <p className="text-sm text-slate-500">
            {template.source ?? "unknown source"} · updated{" "}
            {formatDate(template.updatedAt)} IST
            {template.parentTemplateId
              ? " · copy (edits do not affect original)"
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {report ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReport((v) => !v)}
            >
              Import report ({report.skipped.length} skipped)
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => void duplicate()}
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </Button>
        </div>
      </div>

      {msg ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {msg}
        </div>
      ) : null}

      {showReport && report ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              From <code className="rounded bg-slate-100 px-1">{report.filename}</code>
              : preserved {report.preserved.sectionCount} sections,{" "}
              {report.preserved.itemCount} items,{" "}
              {report.preserved.commentCount} comments.
            </p>
            {report.skipped.length === 0 ? (
              <p className="text-slate-500">Nothing was skipped.</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
                {report.skipped.slice(0, 200).map((s, i) => (
                  <li key={i}>
                    {s.sheet ? `[${s.sheet}] ` : ""}
                    {s.row > 0 ? `Row ${s.row}: ` : ""}
                    {s.reason}
                  </li>
                ))}
                {report.skipped.length > 200 ? (
                  <li>…and {report.skipped.length - 200} more</li>
                ) : null}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {template.sections.map((section) => {
          const open = openSections[section.id] ?? true;
          return (
            <Card key={section.id}>
              <CardHeader className="flex flex-row items-start gap-2 space-y-0">
                <button
                  type="button"
                  className="mt-1 rounded p-1 hover:bg-slate-100"
                  onClick={() =>
                    setOpenSections((m) => ({ ...m, [section.id]: !open }))
                  }
                  aria-label={open ? "Collapse" : "Expand"}
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <EditableText
                    label="Section"
                    value={section.name}
                    displayClassName="text-lg font-semibold"
                    onSave={async (name) => {
                      await patch(`/api/sections/${section.id}`, { name });
                    }}
                  />
                  <p className="text-xs text-slate-400">
                    {section.items.length} items
                  </p>
                </div>
              </CardHeader>
              {open ? (
                <CardContent className="space-y-4 border-t border-slate-100 pt-4">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/50 p-4"
                    >
                      <EditableText
                        label="Item"
                        value={item.name}
                        displayClassName="font-medium"
                        onSave={async (name) => {
                          await patch(`/api/items/${item.id}`, { name });
                        }}
                      />
                      <div className="mt-3 space-y-3">
                        {item.comments.length === 0 ? (
                          <p className="text-xs italic text-slate-400">
                            No comments
                          </p>
                        ) : (
                          item.comments.map((c) => (
                            <div
                              key={c.id}
                              className="rounded-md border border-slate-200 bg-white p-3"
                            >
                              <EditableText
                                label="Comment (HTML allowed)"
                                value={c.bodyHtml}
                                multiline
                                html
                                onSave={async (bodyHtml) => {
                                  await patch(`/api/comments/${c.id}`, {
                                    bodyHtml,
                                  });
                                }}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
