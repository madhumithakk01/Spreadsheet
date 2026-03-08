"use client";

import Link from "next/link";
import { AuthProvider } from "@/components/AuthContext";
import { HeaderAuth } from "@/components/HeaderAuth";
import { SpreadsheetGrid } from "@/components/SpreadsheetGrid";
import { EditableDocumentTitle } from "@/components/EditableDocumentTitle";

type DocPageClientProps = {
  docId: string;
};

/**
 * Client wrapper for the document page: provides auth and renders header + grid.
 */
export function DocPageClient({ docId }: DocPageClientProps) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-950">
        <header className="flex items-center justify-between gap-6 border-b border-zinc-200 bg-white px-6 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex min-w-0 flex-1 items-center gap-5">
            <Link
              href="/"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              ← Back
            </Link>
            <div className="flex min-w-0 flex-1 items-center">
              <EditableDocumentTitle docId={docId} />
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end">
            <HeaderAuth />
          </div>
        </header>
        <SpreadsheetGrid docId={docId} />
      </div>
    </AuthProvider>
  );
}
