import Link from "next/link";
import { TemplateList } from "@/components/template-list";
import { listTemplates } from "@/lib/templates";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const templates = await listTemplates();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="mt-1 text-sm text-slate-500">
            Import Spectora HTML Text exports, edit names and comments, and
            duplicate without affecting the original.
          </p>
        </div>
        <Link href="/import">
          <Button>Import spreadsheet</Button>
        </Link>
      </div>
      <TemplateList templates={templates} />
    </div>
  );
}
