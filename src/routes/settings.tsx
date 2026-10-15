import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/flow/OutputPanel";
import { useTheme } from "@/components/flow/AppShell";
import { CHAT_SYSTEM, PLANNER_SYSTEM, SUMMARY_SYSTEM } from "@/lib/ai";
import { KEYS, writeStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FlowMind AI" },
      { name: "description", content: "Theme, data controls and prompt engineering notes for FlowMind AI." },
      { property: "og:title", content: "Settings — FlowMind AI" },
      { property: "og:description", content: "Preferences, data and how FlowMind's prompts are designed." },
    ],
  }),
  component: Page,
});

const NOTES: [string, string][] = [
  ["Prompt architecture", "Each tool uses a fixed SYSTEM prompt (role + task + rules) combined with a dynamically built USER message containing your input and selected options. This separation keeps behaviour consistent while adapting to your content."],
  ["Role framing", "Each prompt assigns a persona — neutral meeting analyst, productivity coach, workplace assistant — which anchors tone, vocabulary and priorities."],
  ["Output constraints", "Summaries follow a strict 4-part schema; plans must respect working hours, buffers and a top-3 priority rule. Structured outputs make results predictable and easy to review."],
  ["Anti-hallucination", "Prompts forbid inventing names, dates or figures. Missing information must be labelled 'Unassigned' / 'TBD' and flagged with ⚠️ for human review."],
  ["Refusal behaviour", "The assistant declines harmful, discriminatory, deceptive or privacy-violating requests, asks a clarifying question when a request is ambiguous, and says 'I don't know' rather than guessing."],
];

function Page() {
  const [theme, setTheme] = useTheme();
  return (
    <>
      <PageHeader icon={<SettingsIcon className="h-5 w-5" />} title="Settings" description="Preferences, data and prompt transparency." />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass space-y-5 rounded-2xl p-5">
          <h2 className="font-semibold">Preferences</h2>
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Dark mode</p><p className="text-xs text-muted-foreground">Saved in this browser</p></div>
            <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">AI engine</p><p className="text-xs text-muted-foreground">Offline demo mode — simulated streaming responses</p></div>
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">Demo</span>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => { writeStore(KEYS.onboarded, false); toast.success("Guidelines will show again"); }}>Show AI guidelines again</Button>
            <Button variant="destructive" onClick={() => { Object.values(KEYS).forEach((k) => k !== KEYS.theme && localStorage.removeItem(k)); toast.success("All local data cleared"); setTimeout(() => location.reload(), 500); }}>Clear all data</Button>
          </div>
        </section>
        <section className="glass rounded-2xl p-5">
          <h2 className="mb-2 font-semibold">Prompt engineering notes</h2>
          <Accordion type="single" collapsible>
            {NOTES.map(([t, b]) => (
              <AccordionItem key={t} value={t}>
                <AccordionTrigger className="text-sm">{t}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{b}</AccordionContent>
              </AccordionItem>
            ))}
            {([["Summarizer system prompt", SUMMARY_SYSTEM], ["Planner system prompt", PLANNER_SYSTEM], ["Chat system prompt", CHAT_SYSTEM]] as [string, string][]).map(([t, p]) => (
              <AccordionItem key={t} value={t}>
                <AccordionTrigger className="text-sm">{t}</AccordionTrigger>
                <AccordionContent><pre className="whitespace-pre-wrap rounded-xl bg-muted p-3 font-mono text-[11px]">{p}</pre></AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </>
  );
}
