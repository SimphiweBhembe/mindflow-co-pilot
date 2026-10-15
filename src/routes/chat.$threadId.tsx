import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUp, BrainCircuit, Copy, MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/flow/Markdown";
import { Disclaimer, PromptDrawer } from "@/components/flow/OutputPanel";
import { buildChatPrompt, mockChat, sleep, streamText } from "@/lib/ai";
import { addHistory, bumpStat, KEYS, uid, useStore, type ChatThread } from "@/lib/store";
import { newThread } from "./chat.index";

export const Route = createFileRoute("/chat/$threadId")({
  component: ChatPage,
});

const CHIPS = ["Draft an email", "Summarize this", "Plan my week", "Write a spreadsheet formula"];

function ChatPage() {
  const { threadId } = Route.useParams();
  return <ChatWindow key={threadId} threadId={threadId} />;
}

function ChatWindow({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const [threads, setThreads, ready] = useStore<ChatThread[]>(KEYS.threads, []);
  const thread = threads.find((t) => t.id === threadId);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"idle" | "typing" | "streaming">("idle");
  const [draft, setDraft] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => taRef.current?.focus(), [busy]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [thread?.messages.length, draft]);

  const patch = (fn: (t: ChatThread) => ChatThread) => setThreads((all) => all.map((t) => (t.id === threadId ? fn(t) : t)));

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy !== "idle") return;
    setInput("");
    patch((t) => ({
      ...t,
      title: t.messages.length ? t.title : content.slice(0, 40),
      updatedAt: Date.now(),
      messages: [...t.messages, { id: uid(), role: "user", content }],
    }));
    setBusy("typing");
    await sleep(700);
    setBusy("streaming");
    const full = await streamText(mockChat(content), setDraft);
    patch((t) => ({ ...t, updatedAt: Date.now(), messages: [...t.messages, { id: uid(), role: "assistant", content: full }] }));
    setDraft("");
    setBusy("idle");
    bumpStat("chats");
  };

  if (ready && !thread)
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-muted-foreground">This conversation doesn't exist anymore.</p>
        <Button onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: newThread() } })}>Start a new chat</Button>
      </div>
    );

  const messages = thread?.messages ?? [];
  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="glass hidden h-[calc(100vh-8rem)] flex-col rounded-2xl p-3 lg:flex">
        <Button className="mb-3" onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: newThread() } })}>
          <Plus className="h-4 w-4" /> New chat
        </Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {threads.map((t) => (
            <div key={t.id} className={`group flex items-center rounded-lg ${t.id === threadId ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}>
              <Link to="/chat/$threadId" params={{ threadId: t.id }} className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-sm">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t.title}</span>
              </Link>
              <button
                aria-label="Delete chat"
                className="p-2 opacity-0 group-hover:opacity-100"
                onClick={() => {
                  setThreads((all) => all.filter((x) => x.id !== t.id));
                  if (t.id === threadId) navigate({ to: "/chat" });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="glass flex h-[calc(100vh-8rem)] flex-col rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            <span className="truncate font-medium">{thread?.title ?? "New chat"}</span>
          </div>
          <div className="flex gap-1">
            {messages.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => { addHistory({ kind: "chat", title: thread!.title, content: messages.map((m) => `**${m.role}:** ${m.content}`).join("\n\n") }); toast.success("Chat saved to History"); }}>
                Save
              </Button>
            )}
            <Button size="sm" variant="ghost" className="lg:hidden" onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: newThread() } })}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 && busy === "idle" && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="bg-hero flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold">How can I help you work smarter?</p>
                <p className="text-sm text-muted-foreground">Pick a template or ask anything work-related.</p>
              </div>
            </div>
          )}
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div>
              </div>
            ) : (
              <div key={m.id} className="group flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"><BrainCircuit className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <Markdown>{m.content}</Markdown>
                  <button className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(m.content); toast.success("Message copied"); }}>
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              </div>
            ),
          )}
          {busy !== "idle" && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"><BrainCircuit className="h-4 w-4" /></div>
              {busy === "typing" ? (
                <div className="flex items-center gap-1 pt-2">
                  {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              ) : (
                <div className="min-w-0 flex-1"><Markdown>{draft + " ▍"}</Markdown></div>
              )}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="space-y-3 border-t border-border p-4">
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button key={c} onClick={() => send(c)} disabled={busy !== "idle"} className="min-h-9 rounded-full border border-border px-3 text-xs text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50">
                {c}
              </button>
            ))}
          </div>
          <form className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Message FlowMind…"
              rows={1}
              className="max-h-40 min-h-10 resize-none border-0 shadow-none focus-visible:ring-0"
            />
            <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-xl" disabled={!input.trim() || busy !== "idle"} aria-label="Send">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </form>
          <PromptDrawer prompt={buildChatPrompt(messages)} />
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
