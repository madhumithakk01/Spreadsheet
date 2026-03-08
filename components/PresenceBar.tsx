"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  deleteField,
  type Timestamp,
} from "firebase/firestore";
import { getFirestoreInstance, PRESENCE_COLLECTION } from "@/lib/firebase";

const DISPLAY_NAME_KEY = "spreadsheet-display-name";
const SESSION_ID_KEY = "spreadsheet-session-id";
const USER_COLOR_KEY = "spreadsheet-user-color";
const LAST_ACTIVE_THRESHOLD_MS = 45_000; // consider user offline after 45s
const HEARTBEAT_INTERVAL_MS = 10_000;

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
};

export type PresenceBarProps = {
  docId: string | null;
};

export function PresenceBar({ docId }: PresenceBarProps) {
  const [displayName, setDisplayNameState] = useState<string>("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const sessionIdRef = useRef<string>("");
  const colorRef = useRef<string>("");
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const db = getFirestoreInstance();

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

  // Write presence and subscribe when we have docId, db, and displayName
  useEffect(() => {
    if (!docId || !db || !displayName) return;

    const sessionId = getOrCreateSessionId();
    const color = getOrCreateColor();
    sessionIdRef.current = sessionId;
    colorRef.current = color;

    const presenceRef = doc(db, PRESENCE_COLLECTION, docId);

    const writePresence = () => {
      updateDoc(presenceRef, {
        [`users.${sessionId}`]: {
          name: displayName,
          color,
          lastActive: serverTimestamp(),
        },
      }).catch((err) => console.error("Presence write error:", err));
    };

    writePresence();
    heartbeatRef.current = setInterval(writePresence, HEARTBEAT_INTERVAL_MS);

    const unsubscribe = onSnapshot(
      presenceRef,
      (snapshot) => {
        const data = snapshot.data();
        const usersMap = (data?.users as Record<string, { name: string; color: string; lastActive?: Timestamp }>) ?? {};
        const now = Date.now();
        const list: PresenceUser[] = Object.entries(usersMap)
          .map(([sid, u]) => ({
            sessionId: sid,
            name: u?.name ?? "Anonymous",
            color: u?.color ?? COLOR_PALETTE[0].bg,
            lastActive: u?.lastActive && typeof u.lastActive.toMillis === "function" ? u.lastActive.toMillis() : 0,
          }))
          .filter((u) => now - u.lastActive < LAST_ACTIVE_THRESHOLD_MS)
          .sort((a, b) => a.name.localeCompare(b.name));
        setUsers(list);
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
      }).catch((err) => console.error("Presence remove error:", err));
      unsubscribe();
    };
  }, [docId, db, displayName]);

  // Remove presence when tab/page closes
  useEffect(() => {
    if (!docId || !db || !sessionIdRef.current) return;

    const handleBeforeUnload = () => {
      const presenceRef = doc(db, PRESENCE_COLLECTION, docId);
      updateDoc(presenceRef, {
        [`users.${sessionIdRef.current}`]: deleteField(),
      }).catch(() => {});
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [docId, db]);

  // No document open
  if (!docId) {
    return (
      <div
        className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        data-presence-bar
      >
        Active users: —
      </div>
    );
  }

  // Need display name
  if (!displayName) {
    return (
      <div
        className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
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
          className="ml-2 rounded border border-zinc-300 bg-white px-2 py-0.5 text-zinc-900 outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={() => saveDisplayName(displayNameInput)}
          className="ml-2 rounded bg-blue-600 px-2 py-0.5 text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      data-presence-bar
    >
      <span className="text-zinc-500 dark:text-zinc-400">Active users:</span>
      {users.length === 0 ? (
        <span className="text-zinc-400 dark:text-zinc-500">—</span>
      ) : (
        users.map((u) => (
          <span
            key={u.sessionId}
            className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200"
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${u.color}`}
              aria-hidden
            />
            {u.name}
          </span>
        ))
      )}
    </div>
  );
}
