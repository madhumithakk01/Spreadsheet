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
        <ul className="space-y-3">
          {PLACEHOLDER_DOCS.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/doc/${doc.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:shadow dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
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
