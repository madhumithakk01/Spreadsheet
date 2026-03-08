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
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-300 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300">
              {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
          <span className="hidden sm:inline">
            {user.displayName ?? user.email ?? "Signed in"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-500"
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
      className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
    >
      Sign in with Google
    </button>
  );
}
