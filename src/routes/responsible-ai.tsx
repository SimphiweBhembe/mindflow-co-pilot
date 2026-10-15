import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Ban, Database, Scale, ShieldCheck, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/flow/OutputPanel";

export const Route = createFileRoute("/responsible-ai")({
  head: () => ({
    meta: [
      { title: "Responsible AI — FlowMind AI" },
      { name: "description", content: "How FlowMind AI handles limitations, bias, human review, data and prohibited uses." },
      { property: "og:title", content: "Responsible AI — FlowMind AI" },
      { property: "og:description", content: "Our principles for safe, transparent AI at work." },
    ],
  }),
  component: Page,
});

const SECTIONS = [
  { icon: AlertTriangle, title: "Model limitations", points: ["Models can 'hallucinate' plausible but false details.", "They don't know your company context unless you provide it.", "Outputs reflect training data that may be outdated."] },
  { icon: Scale, title: "Bias risks", points: ["Language models can reproduce social and cultural bias.", "Be careful with outputs about people, performance or hiring.", "Review tone and assumptions before sharing externally."] },
  { icon: UserCheck, title: "Human-in-the-loop", points: ["Every output is editable before saving or exporting.", "Items marked ⚠️ need human verification (missing owners, dates).", "You remain accountable for decisions made with AI help."] },
  { icon: Database, title: "Data handling", points: ["Your history, tasks and chats are stored only in this browser.", "No data leaves your device in demo mode.", "Clear all stored data any time from Settings."] },
  { icon: Ban, title: "Prohibited uses", points: ["Making automated decisions about employment, credit or legal status.", "Generating deceptive, harassing or discriminatory content.", "Processing data you're not authorized to share (e.g. health, customer PII)."] },
  { icon: ShieldCheck, title: "Transparency", points: ["'View prompt used' shows exactly what the AI is instructed to do.", "A disclaimer appears under every AI output.", "Prompt design notes are published in Settings."] },
];

function Page() {
  return (
    <>
      <PageHeader icon={<ShieldCheck className="h-5 w-5" />} title="Responsible AI" description="How we design FlowMind to be safe, transparent and human-centred." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => (
          <section key={s.title} className="glass rounded-2xl p-5">
            <s.icon className="mb-3 h-5 w-5 text-primary" />
            <h2 className="mb-2 font-semibold">{s.title}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {s.points.map((p) => <li key={p} className="flex gap-2"><span className="text-primary">•</span>{p}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
