import { ImportWizard } from "@/components/import-wizard";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import</h1>
        <p className="mt-1 text-sm text-slate-500">
          Preview preserved vs skipped content, then confirm.
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}
