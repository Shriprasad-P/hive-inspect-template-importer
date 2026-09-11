"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import type { ParsePreview } from "@/lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

type PreviewState = {
  preview: ParsePreview;
  filename: string;
  file: File;
};

export function ImportWizard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [templateName, setTemplateName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<PreviewState | null>(null);

  async function runPreview(file: File) {
    setBusy(true);
    setError(null);
    setState(null);
    try {
      if (file.size === 0) {
        throw new Error("Empty file: the uploaded spreadsheet has no content.");
      }
      const form = new FormData();
      form.set("file", file);
      if (templateName.trim()) form.set("templateName", templateName.trim());
      const res = await fetch("/api/import/preview", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setState({
        preview: data.preview,
        filename: data.filename,
        file,
      });
      if (!templateName.trim()) {
        setTemplateName(data.preview.templateName);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!state) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview: {
            ...state.preview,
            templateName: templateName.trim() || state.preview.templateName,
          },
          filename: state.filename,
          templateName: templateName.trim() || state.preview.templateName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      router.push(`/templates/${data.templateId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Spectora spreadsheet</CardTitle>
          <CardDescription>
            Upload a Spectora{" "}
            <strong>Export to spreadsheet → Export HTML Text</strong>{" "}
            <code>.xlsx</code>. You will see a preview of what will be preserved
            vs skipped before confirming.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Template name (optional)
            </label>
            <Input
              placeholder="e.g. InterNACHI Residential"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-amber-400 hover:bg-amber-50/40"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void runPreview(f);
            }}
          >
            <Upload className="h-8 w-8 text-amber-600" />
            <div className="text-sm font-medium">
              Drop .xlsx here or click to browse
            </div>
            <div className="text-xs text-slate-500">
              Spectora HTML Text export · max practical size ~10MB
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void runPreview(f);
              }}
            />
          </div>

          {busy ? (
            <p className="text-sm text-slate-500">Working…</p>
          ) : null}
          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {state ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-5 w-5 text-amber-600" />
              Import preview — review before confirming
            </CardTitle>
            <CardDescription>
              File: <code>{state.filename}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {state.preview.warnings.length ? (
              <ul className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {state.preview.warnings.map((w, i) => (
                  <li key={i}>⚠ {w}</li>
                ))}
              </ul>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Will be preserved
                </div>
                <ul className="space-y-1 text-sm text-emerald-900">
                  <li>
                    {state.preview.preserved.sectionCount} sections (Section
                    Name)
                  </li>
                  <li>
                    {state.preview.preserved.itemCount} items (Item Name)
                  </li>
                  <li>
                    {state.preview.preserved.commentCount} comments (Comment
                    Text HTML + Comment Name)
                  </li>
                  <li className="text-xs text-emerald-700/80">
                    Order column + row order preserved within each item.
                  </li>
                </ul>
                <div className="mt-3 max-h-48 overflow-auto rounded border border-emerald-100 bg-white/70 p-2 text-xs">
                  {state.preview.sections.map((s) => (
                    <div key={s.name} className="mb-2">
                      <div className="font-medium">{s.name}</div>
                      <ul className="ml-3 list-disc text-slate-600">
                        {s.items.map((it) => (
                          <li key={it.name}>
                            {it.name}{" "}
                            <span className="text-slate-400">
                              ({it.comments.length} comments)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Will be skipped
                </div>
                <p className="mb-2 text-sm text-slate-600">
                  {state.preview.skipped.length} entries (Spectora metadata
                  columns, blank rows, unused sheets, etc.)
                </p>
                <ul className="max-h-64 space-y-1 overflow-auto rounded border border-slate-200 bg-white p-2 text-xs text-slate-600">
                  {state.preview.skipped.length === 0 ? (
                    <li>Nothing skipped.</li>
                  ) : (
                    state.preview.skipped.slice(0, 150).map((s, i) => (
                      <li key={i}>
                        {s.sheet ? `[${s.sheet}] ` : ""}
                        {s.row > 0 ? `Row ${s.row}: ` : ""}
                        {s.reason}
                      </li>
                    ))
                  )}
                  {state.preview.skipped.length > 150 ? (
                    <li>…and {state.preview.skipped.length - 150} more</li>
                  ) : null}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => void confirmImport()}>
                Confirm import
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setState(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                Choose another file
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
