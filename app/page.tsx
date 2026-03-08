import Link from "next/link";
import { NewSpreadsheetButton } from "@/components/NewSpreadsheetButton";

/**
 * Dashboard: list of spreadsheet documents and button to create a new one.
 */

const PLACEHOLDER_DOCS = [
  { id: "1", title: "Untitled spreadsheet", lastModified: "—" },
  { id: "2", title: "Sample document", lastModified: "—" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Spreadsheets
        </h1>
        <NewSpreadsheetButton />
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8">
        <ul className="space-y-2">
          {PLACEHOLDER_DOCS.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/doc/${doc.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {doc.title}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {doc.lastModified}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
