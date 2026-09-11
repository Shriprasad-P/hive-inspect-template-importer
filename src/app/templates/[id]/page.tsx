import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplateEditor } from "@/components/template-editor";
import { getImportReport, getTemplate } from "@/lib/templates";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function TemplatePage({ params }: Props) {
  const template = await getTemplate(params.id);
  if (!template) notFound();

  const reportRow = await getImportReport(params.id);
  const report = reportRow
    ? {
        filename: reportRow.filename,
        preserved: JSON.parse(reportRow.preservedJson) as {
          sectionCount: number;
          itemCount: number;
          commentCount: number;
        },
        skipped: JSON.parse(reportRow.skippedJson) as Array<{
          row: number;
          reason: string;
          sheet?: string;
        }>,
      }
    : null;

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="text-sm text-slate-500 hover:text-amber-700 hover:underline"
      >
        ← All templates
      </Link>
      <TemplateEditor template={template} report={report} />
    </div>
  );
}
