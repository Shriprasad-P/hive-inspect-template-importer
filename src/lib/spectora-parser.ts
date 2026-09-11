/**
 * Spectora "Export HTML Text" / template spreadsheet parser.
 *
 * Official Spectora import sample headers (28 columns, single Sheet1):
 *  1. Section Name
 *  2. Item Name
 *  3. Comment Name
 *  4. Comment Text          ← HTML fragments when Export HTML Text
 *  5. Comment Type          (info, limit, defect)
 *  6. Category              (-1: Low, 0: Med, 1: High)
 *  7. Multiple Choice Options
 *  8. Unit Type Options
 *  9. Recommendation
 * 10. Order                 (within item)
 * 11. Answer Type
 * 12-17. Default Value / Value 2 / Unit Type / Location / Estimate Min / Max
 * 18-21. Locked / Simple Format / Disable Photos / Uses
 * 22-27. Default Photo 1..3 + captions
 * 28. Last Modified
 *
 * Hierarchy is row-based Section → Item → Comment.
 * We preserve Order (col 10) then original row order.
 * Only Section Name, Item Name, Comment Name (→ item context), and
 * Comment Text (HTML allowed) are persisted into our model.
 * All other columns are surfaced as skipped content in the import report.
 *
 * Model mapping:
 *   Template → Section (Section Name) → Item (Item Name)
 *            → Comment (body_html = Comment Text; Comment Name folded into
 *               HTML preamble when present so the name is not lost)
 */

import * as XLSX from "xlsx";
import type {
  ParsePreview,
  ParsedSection,
  SkippedRow,
} from "./types";

const SECTION_ALIASES = [
  "section name",
  "section",
  "section_name",
  "category name", // not Spectora Category col
];
const ITEM_ALIASES = [
  "item name",
  "item",
  "item_name",
  "line item",
  "inspection item",
];
const COMMENT_NAME_ALIASES = [
  "comment name",
  "comment_name",
  "comment title",
];
const COMMENT_TEXT_ALIASES = [
  "comment text",
  "comment_text",
  "html text",
  "html_text",
  "comment",
  "comments",
  "body",
  "body_html",
  "narrative",
];
const ORDER_ALIASES = ["order", "sort", "sort order", "position"];

/** Columns we intentionally do not persist (official sample extras). */
const SKIP_COLUMN_HINTS = [
  "comment type",
  "category",
  "multiple choice",
  "unit type options",
  "recommendation",
  "answer type",
  "default value",
  "value 2",
  "unit type",
  "location",
  "estimate",
  "locked",
  "simple format",
  "disable photos",
  "uses",
  "default photo",
  "caption",
  "last modified",
];

function norm(s: unknown): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findCol(headers: string[], aliases: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = norm(headers[i]);
    if (aliases.includes(h)) return i;
  }
  for (let i = 0; i < headers.length; i++) {
    const h = norm(headers[i]);
    if (aliases.some((a) => h === a || h.startsWith(a))) return i;
  }
  return -1;
}

function pickSheet(workbook: XLSX.WorkBook): {
  name: string;
  sheet: XLSX.WorkSheet;
} {
  const preferred = workbook.SheetNames.find((n) => {
    const l = n.toLowerCase();
    return (
      l === "sheet1" ||
      l.includes("html") ||
      l.includes("template") ||
      l.includes("export") ||
      l.includes("internachi")
    );
  });
  const name = preferred ?? workbook.SheetNames[0];
  return { name, sheet: workbook.Sheets[name] };
}

function cellStr(row: unknown[], idx: number): string {
  if (idx < 0 || idx >= row.length) return "";
  const v = row[idx];
  if (v == null) return "";
  return String(v).trim();
}

function looksLikeHtml(s: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

function buildCommentBody(commentName: string, commentText: string): string {
  const text = commentText || "";
  if (!commentName) return text;
  // Fold Comment Name into HTML so it is not lost (our model has body_html only).
  if (looksLikeHtml(text)) {
    return `<p><strong>${escapeHtml(commentName)}</strong></p>${text}`;
  }
  if (!text) return `<p><strong>${escapeHtml(commentName)}</strong></p>`;
  return `<p><strong>${escapeHtml(commentName)}</strong></p><p>${escapeHtml(text)}</p>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type RawRow = {
  excelRow: number;
  sectionName: string;
  itemName: string;
  commentName: string;
  commentText: string;
  order: number | null;
  sourceOrder: number;
};

/**
 * Parse an ArrayBuffer / Buffer of a Spectora template / HTML Text .xlsx.
 * Throws user-facing Error messages for empty files / missing sheets/columns.
 */
export function parseSpectoraHtmlText(
  data: ArrayBuffer | Buffer,
  opts?: { filename?: string; templateName?: string }
): ParsePreview {
  const filename = opts?.filename ?? "upload.xlsx";
  const skipped: SkippedRow[] = [];
  const warnings: string[] = [];

  if (!data || (data as ArrayBuffer).byteLength === 0) {
    throw new Error("Empty file: the uploaded spreadsheet has no content.");
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array", cellDates: true });
  } catch {
    throw new Error(
      "Could not read spreadsheet. Ensure the file is a valid .xlsx Spectora HTML Text / template export."
    );
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("Missing sheets: the workbook contains no worksheets.");
  }

  if (workbook.SheetNames.length > 1) {
    warnings.push(
      `Workbook has ${workbook.SheetNames.length} sheets; using the best-matching sheet. Other sheets are ignored.`
    );
  }

  const { name: sheetName, sheet } = pickSheet(workbook);
  for (const sn of workbook.SheetNames) {
    if (sn !== sheetName) {
      skipped.push({
        sheet: sn,
        row: 0,
        reason: `Sheet "${sn}" was not selected for import (using "${sheetName}").`,
      });
    }
  }

  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (!rows.length) {
    throw new Error(`Sheet "${sheetName}" is empty.`);
  }

  let headerIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const r = (rows[i] ?? []).map((c) => String(c ?? "").trim());
    if (r.every((c) => !c)) continue;
    const sec = findCol(r, SECTION_ALIASES);
    const itm = findCol(r, ITEM_ALIASES);
    if (sec >= 0 && itm >= 0) {
      headerIdx = i;
      headers = r;
      break;
    }
  }

  if (headerIdx < 0) {
    throw new Error(
      `Missing columns: could not find "Section Name" and "Item Name" headers on sheet "${sheetName}". ` +
        `Expected Spectora template columns (Section Name, Item Name, Comment Name, Comment Text, …).`
    );
  }

  const sectionCol = findCol(headers, SECTION_ALIASES);
  const itemCol = findCol(headers, ITEM_ALIASES);
  const commentNameCol = findCol(headers, COMMENT_NAME_ALIASES);
  const commentTextCol = findCol(headers, COMMENT_TEXT_ALIASES);
  const orderCol = findCol(headers, ORDER_ALIASES);

  if (commentTextCol < 0 && commentNameCol < 0) {
    warnings.push(
      "No Comment Name / Comment Text columns found. Items will import without comments."
    );
  }

  // Record non-persisted columns once (import report)
  const used = new Set(
    [sectionCol, itemCol, commentNameCol, commentTextCol, orderCol].filter(
      (i) => i >= 0
    )
  );
  headers.forEach((h, idx) => {
    if (!h || used.has(idx)) return;
    const hn = norm(h);
    const isKnownSkip = SKIP_COLUMN_HINTS.some(
      (hint) => hn.includes(hint) || hint.includes(hn)
    );
    skipped.push({
      sheet: sheetName,
      row: headerIdx + 1,
      reason: isKnownSkip
        ? `Column "${h}" is not persisted (Spectora metadata — only Section/Item/Comment Text are kept).`
        : `Column "${h}" is not imported.`,
      raw: { column: h, index: idx },
    });
  });

  const rawRows: RawRow[] = [];
  let lastSection = "";
  let lastItem = "";
  let sourceOrder = 0;

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = (rows[r] ?? []) as unknown[];
    const excelRow = r + 1;

    const isBlank = row.every((c) => String(c ?? "").trim() === "");
    if (isBlank) {
      skipped.push({
        sheet: sheetName,
        row: excelRow,
        reason: "Blank row skipped.",
      });
      continue;
    }

    let sectionName = cellStr(row, sectionCol);
    let itemName = cellStr(row, itemCol);
    const commentName =
      commentNameCol >= 0 ? cellStr(row, commentNameCol) : "";
    const commentText =
      commentTextCol >= 0 ? cellStr(row, commentTextCol) : "";

    // Carry-forward: Spectora often leaves section/item blank on continuation rows
    if (!sectionName && lastSection) sectionName = lastSection;
    if (!itemName && lastItem) itemName = lastItem;

    let order: number | null = null;
    if (orderCol >= 0) {
      const ov = cellStr(row, orderCol);
      if (ov !== "") {
        const n = Number(ov);
        order = Number.isFinite(n) ? n : null;
      }
    }

    if (!sectionName && !itemName && !commentName && !commentText) {
      skipped.push({
        sheet: sheetName,
        row: excelRow,
        reason: "Row has no section, item, or comment content.",
      });
      continue;
    }

    if (!sectionName) {
      skipped.push({
        sheet: sheetName,
        row: excelRow,
        reason:
          "Missing section name (and no prior section to carry forward).",
        raw: { item: itemName, commentName },
      });
      continue;
    }

    if (!itemName) {
      // Section-only / incomplete — record section existence later if needed
      if (!commentName && !commentText) {
        skipped.push({
          sheet: sheetName,
          row: excelRow,
          reason: "Section present but no item name or comment.",
          raw: { section: sectionName },
        });
        lastSection = sectionName;
        continue;
      }
      skipped.push({
        sheet: sheetName,
        row: excelRow,
        reason: "Comment row missing Item Name.",
        raw: { section: sectionName, commentName },
      });
      lastSection = sectionName;
      continue;
    }

    rawRows.push({
      excelRow,
      sectionName,
      itemName,
      commentName,
      commentText,
      order,
      sourceOrder: sourceOrder++,
    });

    lastSection = sectionName;
    lastItem = itemName;
  }

  // Sort: keep section appearance order, within item sort by Order then row order
  type AccSection = ParsedSection & {
    _itemMap: Map<string, number>;
    _firstSeen: number;
  };
  const sectionOrder: AccSection[] = [];
  const sectionMap = new Map<string, AccSection>();

  // Group by section appearance
  for (const rr of rawRows) {
    let sec = sectionMap.get(rr.sectionName);
    if (!sec) {
      sec = {
        name: rr.sectionName,
        sourceKey: `sec:${rr.sectionName}`,
        items: [],
        _itemMap: new Map(),
        _firstSeen: rr.sourceOrder,
      };
      sectionMap.set(rr.sectionName, sec);
      sectionOrder.push(sec);
    }
    if (!sec._itemMap.has(rr.itemName)) {
      sec._itemMap.set(rr.itemName, sec.items.length);
      sec.items.push({
        name: rr.itemName,
        sourceKey: `item:${rr.sectionName}|${rr.itemName}`,
        comments: [],
      });
    }
  }

  // Attach comments sorted by Order then sourceOrder within each item
  const byItem = new Map<string, RawRow[]>();
  for (const rr of rawRows) {
    const key = `${rr.sectionName}\0${rr.itemName}`;
    if (!byItem.has(key)) byItem.set(key, []);
    byItem.get(key)!.push(rr);
  }
  for (const [, list] of Array.from(byItem.entries())) {
    list.sort((a, b) => {
      const ao = a.order ?? Number.POSITIVE_INFINITY;
      const bo = b.order ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.sourceOrder - b.sourceOrder;
    });
    const sec = sectionMap.get(list[0].sectionName)!;
    const itemIdx = sec._itemMap.get(list[0].itemName)!;
    for (const rr of list) {
      if (!rr.commentName && !rr.commentText) {
        // Item row with no comment — still valid item, nothing to add
        continue;
      }
      const bodyHtml = buildCommentBody(rr.commentName, rr.commentText);
      sec.items[itemIdx].comments.push({
        bodyHtml,
        sourceKey: `cmt:${rr.sectionName}|${rr.itemName}|${rr.excelRow}`,
      });
    }
  }

  const sections: ParsedSection[] = sectionOrder.map(
    ({ _itemMap, _firstSeen, ...rest }) => {
      void _itemMap;
      void _firstSeen;
      return rest;
    }
  );

  const preserved = {
    sectionCount: sections.length,
    itemCount: sections.reduce((n, s) => n + s.items.length, 0),
    commentCount: sections.reduce(
      (n, s) => n + s.items.reduce((m, it) => m + it.comments.length, 0),
      0
    ),
  };

  if (preserved.sectionCount === 0) {
    throw new Error(
      "No importable sections/items found after parsing. Check that the file matches the Spectora template export format."
    );
  }

  const baseName = filename.replace(/\.(xlsx|xls|csv)$/i, "");
  const templateName =
    opts?.templateName?.trim() ||
    baseName ||
    "Imported Spectora Template";

  return {
    templateName,
    sections,
    preserved,
    skipped,
    warnings,
  };
}
