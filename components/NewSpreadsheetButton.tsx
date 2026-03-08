"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirestoreInstance, DOCUMENTS_COLLECTION } from "@/lib/firebase";

function generateDocId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function NewSpreadsheetButton() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const db = getFirestoreInstance();
    if (!db) {
      setError("Firebase is not configured");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const docId = generateDocId();
      const docRef = doc(db, DOCUMENTS_COLLECTION, docId);
      await setDoc(docRef, {
        cells: {},
        updatedAt: serverTimestamp(),
      });
      router.push(`/doc/${docId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create spreadsheet");
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {creating ? "Creating…" : "New Spreadsheet"}
      </button>
      {error && (
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
}
