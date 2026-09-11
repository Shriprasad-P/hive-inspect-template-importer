import { NextResponse } from "next/server";
import { parseSpectoraHtmlText } from "@/lib/spectora-parser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const templateName = String(form.get("templateName") ?? "").trim();

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file. Upload a Spectora HTML Text .xlsx export." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Empty file: the uploaded spreadsheet has no content." },
        { status: 400 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const preview = parseSpectoraHtmlText(buf, {
      filename: file.name,
      templateName: templateName || undefined,
    });

    return NextResponse.json({ preview, filename: file.name });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
