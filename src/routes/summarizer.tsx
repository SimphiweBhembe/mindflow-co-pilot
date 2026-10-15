import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, Send, Sparkles as Wand, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, OutputPanel, PageHeader } from "@/components/flow/OutputPanel";
import { buildSummaryPrompt, mockSummary, SAMPLE_TRANSCRIPT, sleep, streamText, type SummaryOpts } from "@/lib/ai";
import { addHistory, bumpStat, KEYS, uid, writeStore, type PlannerTask } from "@/lib/store";

export const Route = createFileRoute("/summarizer")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — FlowMind AI" },
      { name: "description", content: "Turn raw meeting transcripts into summaries, decisions and action items." },
      { property: "og:title", content: "Meeting Notes Summarizer — FlowMind AI" },
      { property: "og:description", content: "Executive summary, key decisions, action items and open questions in seconds." },
    ],
  }),
  component: Summarizer,
});

function Summarizer() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [opts, setOpts] = useState<SummaryOpts>({ length: "Medium", tone: "Team", format: "Markdown" });
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [actions, setActions] = useState<ReturnType<typeof mockSummary>["actions"]>([]);
  const [error, setError] = useState("");
  const sig = useRef({ cancelled: false });

  const run = async () => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    if (words < 20) return setError("Please paste a transcript of at least 20 words.");
    setError("");
    sig.current.cancelled = true;
    sig.current = { cancelled: false };
    setPrompt(buildSummaryPrompt(text, opts));
    setOut("");
    setLoading(true);
    await sleep(900);
    setLoading(false);
    setStreaming(true);
    const r = mockSummary(text, opts);
    setActions(r.actions);
    await streamText(r.md, setOut, sig.current);
    setStreaming(false);
    bumpStat("meetings");
  };

  const sendToPlanner = () => {
    const tasks: PlannerTask[] = actions.map((a) => ({
      id: uid(),
      title: a.task,
      owner: a.owner.replace(" ⚠️", ""),
      deadline: a.deadline.replace(" ⚠️", ""),
      priority: a.priority,
      done: false,
    }));
    writeStore(KEYS.bridge, tasks);
    toast.success(`${tasks.length} action items sent to Task Planner`);
    navigate({ to: "/planner" });
  };

  return (
    <>
      <PageHeader icon={<FileText className="h-5 w-5" />} title="Meeting Notes Summarizer" description="Paste a transcript and get a structured, reviewable summary." />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass space-y-4 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="t">Raw transcript</Label>
            <Button size="sm" variant="outline" onClick={() => { setText(SAMPLE_TRANSCRIPT); setError(""); }}>
              Load sample notes
            </Button>
          </div>
          <Textarea id="t" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your meeting transcript or notes here…" className="min-h-[280px]" />
          <p className="text-xs text-muted-foreground">{text.trim() ? text.trim().split(/\s+/).length : 0} words</p>
          {error && <p className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />{error}</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["Summary length", "length", ["Short", "Medium", "Detailed"]],
                ["Tone", "tone", ["Executive", "Team", "Client"]],
                ["Output format", "format", ["Markdown", "Plain text", "Slack"]],
              ] as const
            ).map(([label, key, values]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Select value={opts[key]} onValueChange={(v) => setOpts((o) => ({ ...o, [key]: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {values.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <Button className="h-11 w-full" onClick={run} disabled={loading || streaming}>
            <Wand className="h-4 w-4" /> {loading || streaming ? "Summarizing…" : "Summarize meeting"}
          </Button>
        </section>
        <OutputPanel
          title="Summary"
          content={out}
          onChange={setOut}
          loading={loading}
          streaming={streaming}
          prompt={prompt}
          onRegenerate={run}
          filename="meeting-summary"
          onSave={() => { addHistory({ kind: "summary", title: out.split("\n")[1]?.slice(0, 60) || "Meeting summary", content: out }); toast.success("Saved to History"); }}
          extra={
            actions.length > 0 && (
              <Button variant="secondary" className="w-full" onClick={sendToPlanner}>
                <Send className="h-4 w-4" /> Send {actions.length} action items to Task Planner
              </Button>
            )
          }
          empty={
            <EmptyState icon={<FileText className="h-5 w-5" />} title="No summary yet" body="Paste a transcript or load the sample to see a structured summary."
              action={<Button size="sm" onClick={() => setText(SAMPLE_TRANSCRIPT)}>Load sample notes</Button>} />
          }
        />
      </div>
    </>
  );
}
