import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowDown, ArrowUp, CalendarCheck, Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Disclaimer, EmptyState, OutputPanel, PageHeader } from "@/components/flow/OutputPanel";
import { buildPlannerPrompt, mockPlan, SAMPLE_GOALS, sleep, streamText } from "@/lib/ai";
import { addHistory, bumpStat, KEYS, readStore, uid, useStore, writeStore, type PlannerTask, type Priority } from "@/lib/store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — FlowMind AI" },
      { name: "description", content: "Turn goals into a prioritized, time-blocked schedule that respects your working hours." },
      { property: "og:title", content: "AI Task Planner — FlowMind AI" },
      { property: "og:description", content: "Top 3 priorities, realistic time blocks and editable task cards." },
    ],
  }),
  component: Planner,
});

const BADGE: Record<Priority, string> = {
  High: "bg-destructive/15 text-destructive",
  Medium: "bg-warning/20 text-foreground",
  Low: "bg-success/15 text-success",
};

function Planner() {
  const [goals, setGoals] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [deadline, setDeadline] = useState("");
  const [focus, setFocus] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [tasks, setTasks] = useStore<PlannerTask[]>(KEYS.tasks, []);
  const [newTask, setNewTask] = useState("");
  const sig = useRef({ cancelled: false });

  useEffect(() => {
    const bridged = readStore<PlannerTask[]>(KEYS.bridge, []);
    if (bridged.length) {
      setTasks((t) => [...t, ...bridged]);
      writeStore(KEYS.bridge, []);
      bumpStat("tasks", bridged.length);
      toast.info(`Imported ${bridged.length} tasks from Meeting Summarizer`);
    }
  }, [setTasks]);

  const run = async () => {
    if (goals.trim().split("\n").filter(Boolean).length < 1) return setError("Add at least one goal (one per line).");
    if (start >= end) return setError("End of working hours must be after the start.");
    setError("");
    sig.current.cancelled = true;
    sig.current = { cancelled: false };
    setPrompt(buildPlannerPrompt(goals, start, end, deadline, focus || "balanced"));
    setOut("");
    setLoading(true);
    await sleep(800);
    setLoading(false);
    setStreaming(true);
    const r = mockPlan(goals, start, end, focus);
    setTasks(r.tasks);
    bumpStat("tasks", r.tasks.length);
    await streamText(r.md, setOut, sig.current);
    setStreaming(false);
  };

  const update = (id: string, patch: Partial<PlannerTask>) => setTasks((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) =>
    setTasks((t) => {
      const n = [...t];
      const j = i + d;
      if (j < 0 || j >= n.length) return t;
      const a = n[i]!; n[i] = n[j]!; n[j] = a;
      return n;
    });
  const done = tasks.filter((t) => t.done).length;

  return (
    <>
      <PageHeader icon={<CalendarCheck className="h-5 w-5" />} title="AI Task Planner" description="Describe your goals and get a realistic, prioritized day." />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass space-y-4 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="g">Goals (one per line)</Label>
            <Button size="sm" variant="outline" onClick={() => { setGoals(SAMPLE_GOALS); setDeadline("Board meeting Friday"); setFocus("deck"); setError(""); }}>
              Load sample inputs
            </Button>
          </div>
          <Textarea id="g" value={goals} onChange={(e) => setGoals(e.target.value)} className="min-h-[180px]" placeholder={"Finish quarterly report\nPrepare client call\n…"} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label className="text-xs">Start of day</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">End of day</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Deadlines</Label><Input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="e.g. Report due Friday" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Priority focus keyword</Label><Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. client" /></div>
          </div>
          {error && <p className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />{error}</p>}
          <Button className="h-11 w-full" onClick={run} disabled={loading || streaming}>
            <Wand2 className="h-4 w-4" /> {loading || streaming ? "Planning…" : "Generate plan"}
          </Button>
        </section>
        <OutputPanel
          title="Plan overview"
          content={out}
          onChange={setOut}
          loading={loading}
          streaming={streaming}
          prompt={prompt}
          onRegenerate={run}
          filename="day-plan"
          onSave={() => { addHistory({ kind: "plan", title: `Day plan — ${tasks.length} tasks`, content: out }); toast.success("Saved to History"); }}
          empty={<EmptyState icon={<CalendarCheck className="h-5 w-5" />} title="No plan yet" body="Add your goals or load sample inputs to generate a schedule." />}
        />
      </div>

      <section className="glass mt-4 rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Tasks <span className="text-sm font-normal text-muted-foreground">{done}/{tasks.length} done</span></h2>
          <form className="flex w-full gap-2 sm:w-auto" onSubmit={(e) => { e.preventDefault(); if (!newTask.trim()) return; setTasks((t) => [...t, { id: uid(), title: newTask.trim(), priority: "Medium", done: false }]); setNewTask(""); toast.success("Task added"); }}>
            <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task…" className="sm:w-64" />
            <Button type="submit" size="icon" aria-label="Add task"><Plus className="h-4 w-4" /></Button>
          </form>
        </div>
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Your task list is empty. Generate a plan or add a task above.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {tasks.map((t, i) => (
              <li key={t.id} className={`flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 ${t.done ? "opacity-60" : ""}`}>
                <Checkbox checked={t.done} onCheckedChange={(v) => update(t.id, { done: !!v })} className="h-5 w-5" />
                <div className="min-w-0 flex-1">
                  <input value={t.title} onChange={(e) => update(t.id, { title: e.target.value })} className={`w-full bg-transparent text-sm font-medium outline-none ${t.done ? "line-through" : ""}`} />
                  <p className="text-xs text-muted-foreground">
                    {t.start ? `${t.start}–${t.end}` : "Unscheduled"}
                    {t.owner && ` · ${t.owner}`}
                    {t.deadline && ` · due ${t.deadline}`}
                  </p>
                </div>
                <Select value={t.priority} onValueChange={(v) => update(t.id, { priority: v as Priority })}>
                  <SelectTrigger className={`h-7 w-auto gap-1 rounded-full border-0 px-2.5 text-xs font-medium ${BADGE[t.priority]}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{(["High", "Medium", "Low"] as const).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setTasks((x) => x.filter((y) => y.id !== t.id))} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4"><Disclaimer /></div>
      </section>
    </>
  );
}
