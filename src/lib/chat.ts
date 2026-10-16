import { KEYS, readStore, uid, writeStore, type ChatThread } from "@/lib/store";

/** Returns an existing empty thread id, or creates a new one. */
export function newThread(): string {
  const threads = readStore<ChatThread[]>(KEYS.threads, []);
  const empty = threads.find((t) => t.messages.length === 0);
  if (empty) return empty.id;
  const t: ChatThread = { id: uid(), title: "New chat", updatedAt: Date.now(), messages: [] };
  writeStore(KEYS.threads, [t, ...threads]);
  return t.id;
}
