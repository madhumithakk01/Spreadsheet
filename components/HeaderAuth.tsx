"use client";

import { useAuth } from "./AuthContext";

/**
 * Auth UI for the spreadsheet header: Sign in with Google or signed-in user with Sign out.
 */
export function HeaderAuth() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <span className="text-sm text-zinc-400 dark:text-zinc-500">
        Loading…
      </span>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full ring-2 ring-zinc-200 dark:ring-zinc-600"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300">
              {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
          <span className="hidden font-medium sm:inline">
            {user.displayName ?? user.email ?? "Signed in"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signInWithGoogle()}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
    >
      Sign in with Google
    </button>
  );
}
