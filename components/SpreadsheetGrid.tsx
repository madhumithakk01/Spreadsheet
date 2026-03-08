"use client";

import { useCallback, useState, Fragment } from "react";
import { Cell } from "./Cell";
import { PresenceBar } from "./PresenceBar";
import { getDisplayValue } from "@/lib/formulas";

/**
 * Spreadsheet grid: 26 columns (A–Z), 30 rows (1–30).
 * Cell values stored in local state. Formulas (starting with =) are evaluated for display.
 * Click to edit; Enter or blur to save. Formula results update when referenced cells change.
 */

const COLS = 26;
const ROWS = 30;

const COL_LETTERS = Array.from({ length: COLS }, (_, i) =>
  String.fromCharCode(65 + i)
);

export type CellData = Record<string, string>;

function getCellId(colIndex: number, rowIndex: number): string {
  return `${COL_LETTERS[colIndex]}${rowIndex + 1}`;
}

export function SpreadsheetGrid() {
  const [cells, setCells] = useState<CellData>({});
  const [editingCell, setEditingCell] = useState<string | null>(null);

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

  const handleCommit = useCallback((cellId: string, value: string) => {
    setCells((prev) => {
      const next = { ...prev };
      if (value === "") {
        delete next[cellId];
      } else {
        next[cellId] = value;
      }
      return next;
    });
    setEditingCell(null);
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PresenceBar />
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
