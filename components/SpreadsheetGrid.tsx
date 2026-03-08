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
import { useAuth } from "./AuthContext";

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

/** Parse "A1" -> { col: 0, row: 0 }; row is 0-based. */
function parseCellId(cellId: string): { col: number; row: number } | null {
  const match = cellId.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  const colStr = match[1].toUpperCase();
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  col -= 1;
  const row = parseInt(match[2], 10) - 1;
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
  return { col, row };
}

export type SpreadsheetGridProps = {
  /** Firestore document ID. When provided, loads and syncs with Firestore. */
  docId: string | null;
};

export function SpreadsheetGrid({ docId }: SpreadsheetGridProps) {
  const { user: authUser } = useAuth();
  const [cells, setCells] = useState<CellData>({});
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string>("A1");

  const stateRef = useRef<CellData>({});
  const pendingWritesRef = useRef<CellData>({});
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const db = getFirestoreInstance();

  // Focus grid on mount so keyboard navigation works without an extra click
  useEffect(() => {
    gridContainerRef.current?.focus({ preventScroll: true });
  }, []);

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
    setSelectedCellId(cellId);
    setEditingCell(cellId);
  }, []);

  type MoveDirection = "up" | "down" | "left" | "right";

  const moveSelection = useCallback((direction: MoveDirection) => {
    const coords = parseCellId(selectedCellId);
    if (!coords) return;
    let { col, row } = coords;
    switch (direction) {
      case "up":
        row = Math.max(0, row - 1);
        break;
      case "down":
        row = Math.min(ROWS - 1, row + 1);
        break;
      case "left":
        col = Math.max(0, col - 1);
        break;
      case "right":
        col = Math.min(COLS - 1, col + 1);
        break;
    }
    setSelectedCellId(getCellId(col, row));
  }, [selectedCellId]);

  const getCellIdAfterMove = useCallback(
    (cellId: string, direction: "down" | "right" | "left"): string => {
      const coords = parseCellId(cellId);
      if (!coords) return cellId;
      let { col, row } = coords;
      switch (direction) {
        case "down":
          row = Math.min(ROWS - 1, row + 1);
          break;
        case "right":
          col = Math.min(COLS - 1, col + 1);
          break;
        case "left":
          col = Math.max(0, col - 1);
          break;
      }
      return getCellId(col, row);
    },
    []
  );

  const handleCommit = useCallback(
    (cellId: string, value: string, moveAfter?: "down" | "right" | "left") => {
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

      if (moveAfter) {
        const nextCellId = getCellIdAfterMove(cellId, moveAfter);
        setSelectedCellId(nextCellId);
        gridContainerRef.current?.focus();
      }

      if (docId && db) {
        scheduleFlush();
      }
    },
    [docId, db, scheduleFlush, getCellIdAfterMove]
  );

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (editingCell) return;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          moveSelection("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          moveSelection("down");
          break;
        case "ArrowLeft":
          e.preventDefault();
          moveSelection("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          moveSelection("right");
          break;
        case "Tab":
          e.preventDefault();
          moveSelection(e.shiftKey ? "left" : "right");
          break;
        case "Enter":
          e.preventDefault();
          handleStartEdit(selectedCellId);
          break;
        default:
          break;
      }
    },
    [editingCell, moveSelection, selectedCellId, handleStartEdit]
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PresenceBar docId={docId} authUser={authUser} />
      <div className="flex-1 overflow-auto p-6">
        <div
          ref={gridContainerRef}
          tabIndex={0}
          role="grid"
          aria-label="Spreadsheet"
          onKeyDown={handleGridKeyDown}
          className="inline-grid rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm outline-none dark:border-zinc-700 dark:bg-zinc-800"
          style={{
            gridTemplateColumns: `56px repeat(${COLS}, minmax(100px, 100px))`,
            gridTemplateRows: `repeat(${ROWS + 1}, 30px)`,
          }}
          data-spreadsheet-grid
        >
          {/* Top-left corner */}
          <div className="sticky left-0 top-0 z-10 border-b border-r border-zinc-300 bg-zinc-200/90 text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700/90 dark:text-zinc-400" />

          {/* Column headers A–Z */}
          {COL_LETTERS.map((letter) => (
            <div
              key={letter}
              className="sticky top-0 z-10 flex min-w-[100px] items-center justify-center border-b border-r border-zinc-300 bg-zinc-200/90 text-xs font-semibold text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700/90 dark:text-zinc-300"
            >
              {letter}
            </div>
          ))}

          {/* Row label + data cells */}
          {Array.from({ length: ROWS }, (_, rowIndex) => (
            <Fragment key={rowIndex}>
              {/* Row number */}
              <div
                className="sticky left-0 z-10 flex min-w-[56px] items-center justify-center border-b border-r border-zinc-300 bg-zinc-200/90 text-xs font-medium text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700/90 dark:text-zinc-400"
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
                    isSelected={selectedCellId === cellId}
                    isEditing={editingCell === cellId}
                    onStartEdit={() => handleStartEdit(cellId)}
                    onCommit={(value, moveAfter) => handleCommit(cellId, value, moveAfter)}
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
