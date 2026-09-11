import { NextResponse } from "next/server";
import { updateItemName } from "@/lib/templates";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const body = await req.json().catch(() => ({}));
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  try {
    const item = await updateItemName(params.id, body.name.trim());
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
