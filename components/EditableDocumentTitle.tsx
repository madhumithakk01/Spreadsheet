"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { getFirestoreInstance, DOCUMENTS_COLLECTION } from "@/lib/firebase";

const DEFAULT_TITLE = "Untitled Spreadsheet";

type EditableDocumentTitleProps = {
  docId: string;
};

export function EditableDocumentTitle({ docId }: EditableDocumentTitleProps) {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(DEFAULT_TITLE);
  const inputRef = useRef<HTMLInputElement>(null);
  const db = getFirestoreInstance();

  useEffect(() => {
    if (!db || !docId) return;

    const docRef = doc(db, DOCUMENTS_COLLECTION, docId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      const t = data?.title;
      const next = typeof t === "string" && t.trim() ? t.trim() : DEFAULT_TITLE;
      setTitle(next);
      if (!isEditing) setEditValue(next);
    });

    return () => unsubscribe();
  }, [db, docId, isEditing]);

  useEffect(() => {
    if (isEditing) {
      setEditValue(title);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, title]);

  const saveTitle = useCallback(() => {
    const trimmed = editValue.trim() || DEFAULT_TITLE;
    setIsEditing(false);
    setTitle(trimmed);
    setEditValue(trimmed);

    if (!db || !docId) return;
    const docRef = doc(db, DOCUMENTS_COLLECTION, docId);
    updateDoc(docRef, {
      title: trimmed,
      updatedAt: serverTimestamp(),
    }).catch((err) => console.error("Title update error:", err));
  }, [db, docId, editValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle();
    }
    if (e.key === "Escape") {
      setEditValue(title);
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={handleKeyDown}
        className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-lg font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        data-document-title-input
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="min-w-0 flex-1 truncate text-left text-lg font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
      title="Click to rename"
    >
      {title}
    </button>
  );
}
