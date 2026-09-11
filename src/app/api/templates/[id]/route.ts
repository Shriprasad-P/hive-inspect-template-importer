import { NextResponse } from "next/server";
import {
  deleteTemplate,
  getTemplate,
  updateTemplateName,
} from "@/lib/templates";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const t = await getTemplate(params.id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ template: t });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const body = await req.json().catch(() => ({}));
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  try {
    await updateTemplateName(params.id, body.name.trim());
    const template = await getTemplate(params.id);
    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await deleteTemplate(params.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
