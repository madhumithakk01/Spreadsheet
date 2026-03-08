/**
 * Placeholder cell component for the spreadsheet grid.
 * Editable cell behavior and formula display will be implemented later.
 */

export type CellProps = {
  value?: string;
  isEditing?: boolean;
};

export function Cell({ value = "", isEditing = false }: CellProps) {
  return (
    <div
      className="border border-zinc-200 bg-white p-1 min-w-[100px] min-h-[28px] text-sm dark:border-zinc-700 dark:bg-zinc-900"
      data-cell
      data-editing={isEditing}
    >
      {value || "\u00a0"}
    </div>
  );
}
