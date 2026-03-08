"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  deleteField,
  type Timestamp,
} from "firebase/firestore";
import { getFirestoreInstance, PRESENCE_COLLECTION } from "@/lib/firebase";
import type { User } from "firebase/auth";

const DISPLAY_NAME_KEY = "spreadsheet-display-name";
const SESSION_ID_KEY = "spreadsheet-session-id";
const USER_COLOR_KEY = "spreadsheet-user-color";
const LAST_ACTIVE_THRESHOLD_MS = 15_000; // consider user offline after 15s
const HEARTBEAT_INTERVAL_MS = 5_000;

const COLOR_PALETTE = [
  { name: "blue", bg: "bg-blue-500" },
  { name: "green", bg: "bg-green-500" },
  { name: "orange", bg: "bg-amber-500" },
  { name: "purple", bg: "bg-purple-500" },
  { name: "red", bg: "bg-red-500" },
  { name: "teal", bg: "bg-teal-500" },
];

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

function getOrCreateColor(): string {
  if (typeof window === "undefined") return COLOR_PALETTE[0].bg;
  let idx = sessionStorage.getItem(USER_COLOR_KEY);
  if (idx === null) {
    idx = String(Math.floor(Math.random() * COLOR_PALETTE.length));
    sessionStorage.setItem(USER_COLOR_KEY, idx);
  }
  return COLOR_PALETTE[Number(idx) % COLOR_PALETTE.length].bg;
}

export type PresenceUser = {
  sessionId: string;
  name: string;
  color: string;
  lastActive: number;
  photoURL?: string | null;
};

export type PresenceBarProps = {
  docId: string | null;
  /** When set, use this user's display name and photo for presence (overrides localStorage prompt). */
  authUser?: User | null;
};

export function PresenceBar({ docId, authUser }: PresenceBarProps) {
  const [displayName, setDisplayNameState] = useState<string>("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const sessionIdRef = useRef<string>("");
  const colorRef = useRef<string>("");
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const db = getFirestoreInstance();

  /** Display name for presence: Google user name or localStorage name. */
  const effectiveDisplayName =
    authUser?.displayName ?? authUser?.email ?? (authUser ? "Signed in" : null) ?? displayName;

  // Load display name from localStorage (client-only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(DISPLAY_NAME_KEY);
    if (stored?.trim()) {
      setDisplayNameState(stored.trim());
    }
  }, []);

  const saveDisplayName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
    setDisplayNameState(trimmed);
    setDisplayNameInput("");
  }, []);

  // Write presence and subscribe when we have docId, db, and a display name (from auth or localStorage)
  useEffect(() => {
    if (!docId || !db || !effectiveDisplayName) return;

    const sessionId = getOrCreateSessionId();
    const color = getOrCreateColor();
    sessionIdRef.current = sessionId;
    colorRef.current = color;

    const presenceRef = doc(db, PRESENCE_COLLECTION, docId);

    const writePresence = () => {
      const userPayload: { name: string; color: string; lastActive: ReturnType<typeof serverTimestamp>; photoURL?: string } = {
        name: effectiveDisplayName,
        color,
        lastActive: serverTimestamp(),
      };
      if (authUser?.photoURL) {
        userPayload.photoURL = authUser.photoURL;
      }
      setDoc(
        presenceRef,
        { users: { [sessionId]: userPayload } },
        { merge: true }
      ).catch((err) => console.error("Presence write error:", err));
    };

    writePresence();
    heartbeatRef.current = setInterval(writePresence, HEARTBEAT_INTERVAL_MS);

    const unsubscribe = onSnapshot(
      presenceRef,
      (snapshot) => {
        const data = snapshot.data();
        const usersMap = (data?.users as Record<string, { name: string; color: string; lastActive?: Timestamp; photoURL?: string | null }>) ?? {};
        const now = Date.now();
        const list: PresenceUser[] = Object.entries(usersMap)
          .map(([sid, u]) => ({
            sessionId: sid,
            name: u?.name ?? "Anonymous",
            color: u?.color ?? COLOR_PALETTE[0].bg,
            lastActive: u?.lastActive && typeof u.lastActive.toMillis === "function" ? u.lastActive.toMillis() : 0,
            photoURL: u?.photoURL ?? null,
          }))
          .filter((u) => u.lastActive > 0 && now - u.lastActive < LAST_ACTIVE_THRESHOLD_MS)
          .sort((a, b) => {
            const byName = a.name.localeCompare(b.name);
            if (byName !== 0) return byName;
            return a.sessionId.localeCompare(b.sessionId);
          });
        setUsers((prev) => {
          if (prev.length !== list.length) return list;
          const same = list.every((u, i) => prev[i]?.sessionId === u.sessionId && prev[i]?.name === u.name);
          return same ? prev : list;
        });
      },
      (err) => console.error("Presence snapshot error:", err)
    );

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      updateDoc(presenceRef, {
        [`users.${sessionId}`]: deleteField(),
      }).catch((err) => {
        if (err?.code !== "not-found") {
          console.error("Presence remove error:", err);
        }
      });
      unsubscribe();
    };
  }, [docId, db, effectiveDisplayName, authUser?.photoURL]);

  // Remove presence when tab/page closes
  useEffect(() => {
    if (!docId || !db || !sessionIdRef.current) return;

    const handleBeforeUnload = () => {
      const presenceRef = doc(db, PRESENCE_COLLECTION, docId);
      updateDoc(presenceRef, {
        [`users.${sessionIdRef.current}`]: deleteField(),
      }).catch((err) => {
        if (err?.code !== "not-found") {}
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [docId, db]);

  // No document open
  if (!docId) {
    return (
      <div
        className="border-b border-zinc-200 bg-zinc-50/80 px-5 py-2.5 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400"
        data-presence-bar
      >
        Active users: —
      </div>
    );
  }

  // Need display name only when not signed in with Google
  if (!effectiveDisplayName) {
    return (
      <div
        className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-zinc-50/80 px-5 py-2.5 dark:border-zinc-700 dark:bg-zinc-800/80"
        data-presence-bar
      >
        <span className="text-zinc-500 dark:text-zinc-400">Your name: </span>
        <input
          type="text"
          placeholder="Enter your name"
          value={displayNameInput}
          onChange={(e) => setDisplayNameInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveDisplayName(displayNameInput);
          }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={() => saveDisplayName(displayNameInput)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-zinc-200 bg-zinc-50/80 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800/80"
      data-presence-bar
    >
      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Active users
      </span>
      {users.length === 0 ? (
        <span className="text-zinc-400 dark:text-zinc-500">—</span>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          {users.map((u) => (
            <span
              key={u.sessionId}
              className="flex items-center gap-2 rounded-full bg-white/60 py-1 pl-1 pr-2.5 text-sm text-zinc-800 shadow-sm dark:bg-zinc-700/60 dark:text-zinc-200"
            >
              {u.photoURL ? (
                <img
                  src={u.photoURL}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0 rounded-full ring-2 ring-white dark:ring-zinc-600"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${u.color}`}
                  aria-hidden
                />
              )}
              <span className="font-medium">{u.name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
