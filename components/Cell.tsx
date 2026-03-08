"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Editable spreadsheet cell.
 * Displays value until clicked; then shows an input with the raw value (e.g. formula). Commits on Enter or blur.
 */

export type CellProps = {
  /** Value to show when not editing (computed result for formulas, or plain text) */
  displayValue: string;
  /** Raw stored value to show when editing (formula or plain text) */
  rawValue: string;
  /** Whether this cell is the current selection (shows highlight border) */
  isSelected: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  /** Commit with optional move: 'down' (Enter), 'right' (Tab), 'left' (Shift+Tab) */
  onCommit: (value: string, moveAfter?: "down" | "right" | "left") => void;
};

export function Cell({
  displayValue,
  rawValue,
  isSelected,
  isEditing,
  onStartEdit,
  onCommit,
}: CellProps) {
  const [editValue, setEditValue] = useState(rawValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditValue(rawValue);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, rawValue]);

  const handleCommit = (moveAfter?: "down" | "right" | "left") => {
    onCommit(editValue.trim(), moveAfter);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommit("down");
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      handleCommit(e.shiftKey ? "left" : "right");
      return;
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => handleCommit()}
        onKeyDown={handleKeyDown}
        className="cell-input h-full w-full border-0 bg-blue-50 px-1 py-0.5 text-sm outline-none ring-1 ring-blue-400 dark:bg-blue-950/50 dark:ring-blue-500"
        data-cell-input
      />
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onStartEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStartEdit();
        }
      }}
      className={`flex min-h-[28px] min-w-[100px] items-center border px-1 py-0.5 text-sm cursor-cell dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
        isSelected
          ? "border-blue-500 bg-blue-50/50 ring-2 ring-inset ring-blue-500 dark:border-blue-400 dark:bg-blue-950/30 dark:ring-blue-400"
          : "border-zinc-200 bg-white dark:border-zinc-700"
      }`}
      data-cell
    >
      {displayValue || "\u00a0"}
    </div>
  );
}
