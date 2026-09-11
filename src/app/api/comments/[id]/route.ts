import { NextResponse } from "next/server";
import { updateCommentBody } from "@/lib/templates";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.bodyHtml !== "string") {
    return NextResponse.json({ error: "bodyHtml is required" }, { status: 400 });
  }
  try {
    const comment = await updateCommentBody(params.id, body.bodyHtml);
    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
