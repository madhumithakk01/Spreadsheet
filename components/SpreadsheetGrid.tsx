"use client";

import { Cell } from "./Cell";
import { PresenceBar } from "./PresenceBar";

/**
 * Placeholder spreadsheet grid.
 * Real-time data, formulas, and editing will be implemented later.
 */

const PLACEHOLDER_ROWS = 5;
const PLACEHOLDER_COLS = 5;

export function SpreadsheetGrid() {
  return (
    <div className="flex flex-col overflow-auto">
      <PresenceBar />
      <div className="overflow-auto p-4">
        <div
          className="inline-grid gap-0 border border-zinc-200 dark:border-zinc-700"
          style={{
            gridTemplateColumns: `repeat(${PLACEHOLDER_COLS}, minmax(100px, 1fr))`,
          }}
          data-spreadsheet-grid
        >
          {Array.from({ length: PLACEHOLDER_ROWS * PLACEHOLDER_COLS }).map(
            (_, i) => (
              <Cell key={i} value="" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
