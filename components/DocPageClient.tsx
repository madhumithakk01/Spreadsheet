"use client";

import Link from "next/link";
import { AuthProvider } from "@/components/AuthContext";
import { HeaderAuth } from "@/components/HeaderAuth";
import { SpreadsheetGrid } from "@/components/SpreadsheetGrid";

type DocPageClientProps = {
  docId: string;
};

/**
 * Client wrapper for the document page: provides auth and renders header + grid.
 */
export function DocPageClient({ docId }: DocPageClientProps) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ← Back
            </Link>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Document {docId}
            </h1>
          </div>
          <div className="flex items-center justify-end">
            <HeaderAuth />
          </div>
        </header>
        <SpreadsheetGrid docId={docId} />
      </div>
    </AuthProvider>
  );
}
