import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Copy, FileText, History as HistoryIcon, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/flow/Markdown";
import { Disclaimer, download, PageHeader } from "@/components/flow/OutputPanel";
import { KEYS, useStore, type HistoryItem, type ToolKind } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — FlowMind AI" },
      { name: "description", content: "Browse saved meeting summaries, plans and chats." },
      { property: "og:title", content: "History — FlowMind AI" },
      { property: "og:description", content: "All your saved AI outputs in one place." },
    ],
  }),
  component: HistoryPage,
});

const META: Record<ToolKind, { label: string; icon: typeof FileText }> = {
  summary: { label: "Summary", icon: FileText },
  plan: { label: "Plan", icon: CalendarCheck },
  chat: { label: "Chat", icon: MessageSquare },
};

function HistoryPage() {
  const [items, setItems] = useStore<HistoryItem[]>(KEYS.history, []);
  const [filter, setFilter] = useState<ToolKind | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const list = items.filter((i) => (filter === "all" || i.kind === filter) && (i.title + i.content).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader icon={<HistoryIcon className="h-5 w-5" />} title="History" description="Everything you've saved, stored privately in this browser." />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search history…" className="sm:max-w-xs" />
        <div className="flex flex-wrap gap-1">
          {(["all", "summary", "plan", "chat"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "ghost"} className="rounded-full capitalize" onClick={() => setFilter(f)}>
              {f}
            </Button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center">
          <p className="mb-4 text-muted-foreground">{items.length ? "No matches." : "Nothing saved yet."}</p>
          <Button asChild><Link to="/summarizer">Summarize a meeting</Link></Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((i) => {
            const M = META[i.kind];
            return (
              <li key={i.id} className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <M.icon className="h-4 w-4 text-primary" />
                  <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(open === i.id ? null : i.id)}>
                    <p className="truncate text-sm font-medium">{i.title}</p>
                    <p className="text-xs text-muted-foreground">{M.label} · {new Date(i.createdAt).toLocaleString()}</p>
                  </button>
                  <Button size="icon" variant="ghost" aria-label="Copy" onClick={() => { navigator.clipboard.writeText(i.content); toast.success("Copied"); }}><Copy className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => download(`${i.kind}-${i.id}.md`, i.content)}>.md</Button>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { setItems((x) => x.filter((y) => y.id !== i.id)); toast.success("Deleted"); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
                {open === i.id && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <Markdown>{i.content}</Markdown>
                    <Disclaimer />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
