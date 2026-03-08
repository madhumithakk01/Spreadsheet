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
  isEditing: boolean;
  onStartEdit: () => void;
  onCommit: (value: string) => void;
};

export function Cell({
  displayValue,
  rawValue,
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

  const handleCommit = () => {
    onCommit(editValue.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommit();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleCommit}
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
      className="flex min-h-[28px] min-w-[100px] items-center border border-zinc-200 bg-white px-1 py-0.5 text-sm cursor-cell dark:border-zinc-700 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
      data-cell
    >
      {displayValue || "\u00a0"}
    </div>
  );
}
