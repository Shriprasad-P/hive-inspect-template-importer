import { NextResponse } from "next/server";
import { getImportReport } from "@/lib/templates";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const report = await getImportReport(params.id);
  if (!report) {
    return NextResponse.json({ report: null });
  }
  return NextResponse.json({
    report: {
      id: report.id,
      filename: report.filename,
      createdAt: report.createdAt.toISOString(),
      preserved: JSON.parse(report.preservedJson),
      skipped: JSON.parse(report.skippedJson),
    },
  });
}
