"use client";

import { useCallback, useState, Fragment, useEffect, useRef } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { Cell } from "./Cell";
import { PresenceBar } from "./PresenceBar";
import { getDisplayValue } from "@/lib/formulas";
import {
  getFirestoreInstance,
  DOCUMENTS_COLLECTION,
} from "@/lib/firebase";

/**
 * Spreadsheet grid: 26 columns (A–Z), 30 rows (1–30).
 * Cell values stored in local state; Firestore is the source of truth when docId is provided.
 * Subscribes to document with onSnapshot and debounces writes to Firestore.
 */

const COLS = 26;
const ROWS = 30;
const DEBOUNCE_MS = 500;

const COL_LETTERS = Array.from({ length: COLS }, (_, i) =>
  String.fromCharCode(65 + i)
);

export type CellData = Record<string, string>;

function getCellId(colIndex: number, rowIndex: number): string {
  return `${COL_LETTERS[colIndex]}${rowIndex + 1}`;
}

export type SpreadsheetGridProps = {
  /** Firestore document ID. When provided, loads and syncs with Firestore. */
  docId: string | null;
};

export function SpreadsheetGrid({ docId }: SpreadsheetGridProps) {
  const [cells, setCells] = useState<CellData>({});
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const stateRef = useRef<CellData>({});
  const pendingWritesRef = useRef<CellData>({});
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const db = getFirestoreInstance();

  // Keep ref in sync with state for use in flush and snapshot
  stateRef.current = cells;

  // Subscribe to Firestore document
  useEffect(() => {
    if (!docId || !db) return;

    const docRef = doc(db, DOCUMENTS_COLLECTION, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        const data = snapshot.data();
        const remoteCells = (data?.cells as Record<string, string> | undefined) ?? {};
        setCells((prev) => ({
          ...remoteCells,
          ...pendingWritesRef.current,
        }));
      },
      (err) => {
        console.error("Firestore snapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, [docId, db]);

  const flushToFirestore = useCallback(() => {
    if (!docId || !db) return;

    const docRef = doc(db, DOCUMENTS_COLLECTION, docId);
    const payload = { ...stateRef.current };
    setDoc(
      docRef,
      {
        cells: payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).then(
      () => {
        pendingWritesRef.current = {};
      },
      (err) => {
        console.error("Firestore write error:", err);
      }
    );
    flushTimeoutRef.current = null;
  }, [docId, db]);

  const scheduleFlush = useCallback(() => {
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }
    flushTimeoutRef.current = setTimeout(flushToFirestore, DEBOUNCE_MS);
  }, [flushToFirestore]);

  const getRawValue = useCallback(
    (cellId: string) => cells[cellId] ?? "",
    [cells]
  );

  const getDisplayValueForCell = useCallback(
    (cellId: string) => getDisplayValue(getRawValue(cellId), cells),
    [cells, getRawValue]
  );

  const handleStartEdit = useCallback((cellId: string) => {
    setEditingCell(cellId);
  }, []);

  const handleCommit = useCallback(
    (cellId: string, value: string) => {
      setCells((prev) => {
        const next = { ...prev };
        if (value === "") {
          delete next[cellId];
          delete pendingWritesRef.current[cellId];
        } else {
          next[cellId] = value;
          pendingWritesRef.current[cellId] = value;
        }
        return next;
      });
      setEditingCell(null);

      if (docId && db) {
        scheduleFlush();
      }
    },
    [docId, db, scheduleFlush]
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PresenceBar docId={docId} />
      <div className="flex-1 overflow-auto p-4">
        <div
          className="inline-grid border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
          style={{
            gridTemplateColumns: `60px repeat(${COLS}, minmax(100px, 100px))`,
            gridTemplateRows: `repeat(${ROWS + 1}, 28px)`,
          }}
          data-spreadsheet-grid
        >
          {/* Top-left corner */}
          <div className="sticky left-0 top-0 z-10 border-b border-r border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700" />

          {/* Column headers A–Z */}
          {COL_LETTERS.map((letter) => (
            <div
              key={letter}
              className="sticky top-0 z-10 flex min-w-[100px] items-center justify-center border-b border-r border-zinc-300 bg-zinc-200 text-xs font-semibold text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
            >
              {letter}
            </div>
          ))}

          {/* Row label + data cells */}
          {Array.from({ length: ROWS }, (_, rowIndex) => (
            <Fragment key={rowIndex}>
              {/* Row number */}
              <div
                className="sticky left-0 z-10 flex min-w-[60px] items-center justify-center border-b border-r border-zinc-300 bg-zinc-200 text-xs font-medium text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
              >
                {rowIndex + 1}
              </div>
              {/* Data cells for this row */}
              {Array.from({ length: COLS }, (_, colIndex) => {
                const cellId = getCellId(colIndex, rowIndex);
                return (
                  <Cell
                    key={cellId}
                    displayValue={getDisplayValueForCell(cellId)}
                    rawValue={getRawValue(cellId)}
                    isEditing={editingCell === cellId}
                    onStartEdit={() => handleStartEdit(cellId)}
                    onCommit={(value) => handleCommit(cellId, value)}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
