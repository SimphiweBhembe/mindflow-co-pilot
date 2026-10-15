import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KEYS, readStore, uid, writeStore, type ChatThread } from "@/lib/store";

export const Route = createFileRoute("/chat/")({
  component: ChatIndex,
});

export function newThread(): string {
  const threads = readStore<ChatThread[]>(KEYS.threads, []);
  const empty = threads.find((t) => t.messages.length === 0);
  if (empty) return empty.id;
  const t: ChatThread = { id: uid(), title: "New chat", updatedAt: Date.now(), messages: [] };
  writeStore(KEYS.threads, [t, ...threads]);
  return t.id;
}

function ChatIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/chat/$threadId", params: { threadId: newThread() }, replace: true });
  }, [navigate]);
  return null;
}
