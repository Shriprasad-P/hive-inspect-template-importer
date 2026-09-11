import { NextResponse } from "next/server";
import { parseSpectoraHtmlText } from "@/lib/spectora-parser";
import { persistImport } from "@/lib/templates";
import type { ParsePreview } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    // Path A: multipart re-upload + confirm (simple clients)
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const templateName = String(form.get("templateName") ?? "").trim();
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }
      if (file.size === 0) {
        return NextResponse.json({ error: "Empty file" }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const preview = parseSpectoraHtmlText(buf, {
        filename: file.name,
        templateName: templateName || undefined,
      });
      const result = await persistImport(preview, file.name);
      return NextResponse.json(result, { status: 201 });
    }

    // Path B: JSON body with already-reviewed preview (polish: confirm after preview)
    const body = await req.json();
    const preview = body.preview as ParsePreview | undefined;
    const filename = String(body.filename ?? "import.xlsx");
    if (!preview?.sections?.length) {
      return NextResponse.json(
        { error: "Missing preview payload. Run import preview first." },
        { status: 400 }
      );
    }
    if (body.templateName && typeof body.templateName === "string") {
      preview.templateName = body.templateName.trim() || preview.templateName;
    }
    const result = await persistImport(preview, filename);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
