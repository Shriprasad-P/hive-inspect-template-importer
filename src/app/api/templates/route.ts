import { NextResponse } from "next/server";
import { listTemplates } from "@/lib/templates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await listTemplates();
    return NextResponse.json({ templates });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
