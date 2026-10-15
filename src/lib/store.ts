import { useCallback, useEffect, useState } from "react";

const listeners = new Map<string, Set<() => void>>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  listeners.get(key)?.forEach((l) => l());
}

export function readStore<T>(key: string, fallback: T) {
  return read(key, fallback);
}

/** Hydration-safe localStorage state shared across components. */
export function useStore<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setValue(read(key, fallback));
    sync();
    setReady(true);
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(sync);
    return () => {
      listeners.get(key)!.delete(sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, fallback);
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeStore(key, v);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set, ready] as const;
}

export type ToolKind = "summary" | "plan" | "chat";
export interface HistoryItem {
  id: string;
  kind: ToolKind;
  title: string;
  content: string;
  createdAt: number;
}
export type Priority = "High" | "Medium" | "Low";
export interface PlannerTask {
  id: string;
  title: string;
  priority: Priority;
  start?: string;
  end?: string;
  owner?: string;
  deadline?: string;
  done: boolean;
}
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
export interface ChatThread {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}
export interface Stats {
  tasks: number;
  meetings: number;
  chats: number;
}

export const KEYS = {
  history: "fm.history",
  tasks: "fm.tasks",
  threads: "fm.threads",
  stats: "fm.stats",
  theme: "fm.theme",
  onboarded: "fm.onboarded",
  bridge: "fm.bridge",
} as const;

export const uid = () => Math.random().toString(36).slice(2, 10);

export function addHistory(item: Omit<HistoryItem, "id" | "createdAt">) {
  const list = read<HistoryItem[]>(KEYS.history, []);
  writeStore(KEYS.history, [{ ...item, id: uid(), createdAt: Date.now() }, ...list].slice(0, 100));
}

export function bumpStat(k: keyof Stats, n = 1) {
  const s = read<Stats>(KEYS.stats, { tasks: 0, meetings: 0, chats: 0 });
  writeStore(KEYS.stats, { ...s, [k]: s[k] + n });
}
