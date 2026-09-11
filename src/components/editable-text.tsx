"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onSave: (next: string) => Promise<void>;
  multiline?: boolean;
  className?: string;
  displayClassName?: string;
  label?: string;
  /** When true, render HTML in display mode (comments only). */
  html?: boolean;
};

export function EditableText({
  value,
  onSave,
  multiline,
  className,
  displayClassName,
  label,
  html,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className={cn("group flex items-start gap-2", className)}>
        <div className="min-w-0 flex-1">
          {label ? (
            <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              {label}
            </div>
          ) : null}
          {html ? (
            <div
              className={cn(
                "prose prose-sm max-w-none text-slate-800",
                displayClassName
              )}
              dangerouslySetInnerHTML={{ __html: value || "<em class='text-slate-400'>Empty</em>" }}
            />
          ) : (
            <div className={cn("text-slate-900", displayClassName)}>
              {value || <span className="text-slate-400 italic">Untitled</span>}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="opacity-60 group-hover:opacity-100"
          onClick={() => setEditing(true)}
          aria-label="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </div>
      ) : null}
      {multiline ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={html ? 6 : 3}
          autoFocus
        />
      ) : (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
        />
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
          <Check className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={saving}
          onClick={() => {
            setDraft(value);
            setEditing(false);
          }}
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
