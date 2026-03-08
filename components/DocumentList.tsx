"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { getFirestoreInstance, DOCUMENTS_COLLECTION } from "@/lib/firebase";

export type DocumentListItem = {
  id: string;
  title: string;
  updatedAt: number;
};

function formatLastModified(ms: number): string {
  const d = new Date(ms);
  const now = Date.now();
  const diffMs = now - ms;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function getMillis(updatedAt: unknown): number {
  if (updatedAt && typeof (updatedAt as Timestamp).toMillis === "function") {
    return (updatedAt as Timestamp).toMillis();
  }
  return 0;
}

export function DocumentList() {
  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestoreInstance();

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const colRef = collection(db, DOCUMENTS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: DocumentListItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          const updatedAt = getMillis(data.updatedAt);
          return {
            id: d.id,
            title: typeof data.title === "string" && data.title.trim() ? data.title.trim() : "Untitled Spreadsheet",
            updatedAt,
          };
        });
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        setDocs(list);
        setLoading(false);
      },
      (err) => {
        console.error("Dashboard snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db]);

  if (loading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading documents…</p>
    );
  }

  if (docs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        No spreadsheets yet. Create one with the button above.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {docs.map((doc) => (
        <li key={doc.id}>
          <Link
            href={`/doc/${doc.id}`}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:shadow dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {doc.title}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {doc.updatedAt ? formatLastModified(doc.updatedAt) : "—"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
