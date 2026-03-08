/**
 * Placeholder presence bar for active users.
 * Real-time presence indicators will be implemented later.
 */

export function PresenceBar() {
  return (
    <div
      className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
      data-presence-bar
    >
      Active users: —
    </div>
  );
}
