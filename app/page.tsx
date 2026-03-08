import { NewSpreadsheetButton } from "@/components/NewSpreadsheetButton";
import { DocumentList } from "@/components/DocumentList";

/**
 * Dashboard: real-time list of spreadsheet documents and button to create a new one.
 */

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Spreadsheets
          </h1>
          <NewSpreadsheetButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <DocumentList />
      </main>
    </div>
  );
}
