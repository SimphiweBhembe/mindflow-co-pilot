import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Clock, FileText, Layers, MessageSquare, Target, Sparkle } from "lucide-react";
import { KEYS, useStore, type HistoryItem, type Stats } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — FlowMind AI" },
      { name: "description", content: "Your AI workplace productivity dashboard: meetings, tasks and chats in one place." },
      { property: "og:title", content: "FlowMind AI Dashboard" },
      { property: "og:description", content: "Automate meeting notes, plan your day and chat with an AI assistant." },
    ],
  }),
  component: Dashboard,
});

const TOOLS = [
  { to: "/summarizer", title: "Meeting Summarizer", body: "Turn transcripts into decisions and action items.", icon: FileText },
  { to: "/planner", title: "Task Planner", body: "Get a prioritized, time-blocked schedule.", icon: CalendarCheck },
  { to: "/chat", title: "AI Chat", body: "Draft emails, summarize, brainstorm.", icon: MessageSquare },
] as const;

const ICON = { summary: FileText, plan: CalendarCheck, chat: MessageSquare };

function Dashboard() {
  const [stats] = useStore<Stats>(KEYS.stats, { tasks: 0, meetings: 0, chats: 0 });
  const [history] = useStore<HistoryItem[]>(KEYS.history, []);
  const hours = Math.round((stats.meetings * 20 + stats.tasks * 5 + stats.chats * 4) / 6) / 10;
  return (
    <div className="space-y-6">
      <section className="bg-hero relative overflow-hidden rounded-2xl p-6 text-primary-foreground shadow-lg md:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-foreground/10 blur-2xl" />
        <p className="text-sm opacity-80">Welcome back, Simphiwe</p>
        <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Let's clear the busywork.</h1>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Tasks planned", stats.tasks],
            ["Meetings summarized", stats.meetings],
            ["Chats conducted", stats.chats],
            ["Hours saved (est.)", hours],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-primary-foreground/10 p-4 backdrop-blur">
              <p className="text-2xl font-semibold">{v}</p>
              <p className="text-xs opacity-80">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map(({ to, title, body, icon: Icon }) => (
          <Link key={to} to={to} className="glass group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-primary/40">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-accent p-2.5 text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
            </div>
            <p className="font-medium">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="glass rounded-2xl p-5 lg:col-span-3">
          <h2 className="mb-4 font-semibold">Recent activity</h2>
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Sparkle className="h-6 w-6 text-primary" />
              <p className="text-sm text-muted-foreground">No activity yet. Try summarizing a sample meeting.</p>
              <Link to="/summarizer" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Start with a meeting
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {history.slice(0, 6).map((h) => {
                const I = ICON[h.kind];
                return (
                  <li key={h.id} className="flex items-center gap-3 py-3">
                    <I className="h-4 w-4 text-primary" />
                    <span className="flex-1 truncate text-sm">{h.title}</span>
                    <span className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleDateString()}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">How this app helps you</h2>
          <ul className="space-y-4">
            {[
              [Clock, "Time lost to admin work", "Professionals spend hours a week on notes, emails and follow-ups. FlowMind drafts them in seconds."],
              [Layers, "Meeting overload", "Turn long transcripts into decisions and owned action items you can act on."],
              [Target, "Unclear priorities", "Get a realistic schedule focused on your top 3 priorities, with buffers built in."],
            ].map(([I, t, b]) => {
              const Icon = I as typeof Clock;
              return (
                <li key={t as string} className="flex gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t as string}</p>
                    <p className="text-sm text-muted-foreground">{b as string}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
