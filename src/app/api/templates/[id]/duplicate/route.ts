import { NextResponse } from "next/server";
import { duplicateTemplate } from "@/lib/templates";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const template = await duplicateTemplate(params.id);
    return NextResponse.json({ template }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Duplicate failed";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
