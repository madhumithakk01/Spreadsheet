import Link from "next/link";
import { SpreadsheetGrid } from "@/components/SpreadsheetGrid";

type SpreadsheetEditorPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Spreadsheet editor: placeholder page that renders the grid.
 * Real-time sync and document loading will be implemented later.
 */
export default async function SpreadsheetEditorPage({
  params,
}: SpreadsheetEditorPageProps) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Document {id}
        </h1>
      </header>
      <SpreadsheetGrid docId={id} />
    </div>
  );
}
