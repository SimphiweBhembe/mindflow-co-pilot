/**
 * Offline AI engine: builds the exact prompts that would be sent to a model and
 * produces structured mock outputs so the app is fully demoable without keys.
 */
import type { PlannerTask, Priority } from "./store";
import { uid } from "./store";

export const SUMMARY_SYSTEM = `ROLE: You are a neutral, precise meeting analyst.
TASK: Convert the raw transcript into EXACTLY four sections, in this order:
  1. ## Executive Summary  – {length} paragraph(s), {tone} tone
  2. ## Key Decisions      – bullet list; only decisions explicitly agreed
  3. ## Action Items       – Markdown table: | Task | Owner | Deadline | Priority |
  4. ## Open Questions     – unresolved items needing follow-up
CONSTRAINTS:
  - Use ONLY information present in the transcript. Never invent names, dates or numbers.
  - If an owner or deadline is missing, write "Unassigned" / "TBD" and flag it with ⚠️.
  - Keep a neutral, factual tone; no speculation or opinion.
  - Output format: {format}.`;

export const PLANNER_SYSTEM = `ROLE: You are an experienced productivity coach.
TASK: Build a realistic, prioritized schedule from the user's goals.
RULES:
  - Identify the TOP 3 priorities first and schedule them in peak-focus hours.
  - Respect working hours {start}–{end}; never schedule outside them.
  - Insert 10–15 min buffer between blocks and a lunch break.
  - Tasks longer than 90 min must be split into focus blocks.
  - Label each task High / Medium / Low priority with a one-line rationale.
  - If goals exceed available time, say so and suggest what to defer.`;

export const CHAT_SYSTEM = `ROLE: You are FlowMind, a workplace productivity assistant.
STYLE: Concise, professional and business-appropriate. Prefer bullets and short paragraphs.
BEHAVIOR:
  - If a request is ambiguous, ask one clarifying question before answering.
  - Never fabricate facts, figures, citations or people. Say "I don't know" when unsure.
  - Refuse requests that are harmful, discriminatory, deceptive or that expose private data.
  - Remind users to verify legal, financial, HR or medical content with a qualified human.`;

export interface SummaryOpts {
  length: "Short" | "Medium" | "Detailed";
  tone: "Executive" | "Team" | "Client";
  format: "Markdown" | "Plain text" | "Slack";
}

export function buildSummaryPrompt(transcript: string, o: SummaryOpts) {
  const sys = SUMMARY_SYSTEM.replace("{length}", o.length === "Short" ? "1" : o.length === "Medium" ? "2" : "3")
    .replace("{tone}", o.tone.toLowerCase())
    .replace("{format}", o.format);
  return `SYSTEM:\n${sys}\n\nUSER:\nTranscript (${transcript.split(/\s+/).length} words):\n"""\n${transcript.slice(0, 600)}${transcript.length > 600 ? "\n…[truncated for display]" : ""}\n"""`;
}

export function buildPlannerPrompt(goals: string, start: string, end: string, deadline: string, focus: string) {
  const sys = PLANNER_SYSTEM.replace("{start}", start).replace("{end}", end);
  return `SYSTEM:\n${sys}\n\nUSER:\nGoals:\n${goals}\n\nDeadline context: ${deadline || "none"}\nPriority focus: ${focus}\nWorking hours: ${start}–${end}`;
}

export function buildChatPrompt(history: { role: string; content: string }[]) {
  return `SYSTEM:\n${CHAT_SYSTEM}\n\n${history.map((m) => `${m.role.toUpperCase()}:\n${m.content}`).join("\n\n")}`;
}

export const SAMPLE_TRANSCRIPT = `Sarah (PM): Thanks everyone. Goal today is to finalize the Q3 launch plan for the analytics dashboard.
Mike (Eng): Backend APIs are 80% done. We need two more weeks for the export feature.
Sarah: Okay, so we move the launch from July 15 to July 29. Everyone agree? 
Priya (Design): Agreed. I'll deliver final onboarding screens by Friday.
Mike: I'll finish the export API by July 19 and get QA started.
Tom (Marketing): I need the new date confirmed to brief the press. I'll draft the announcement by next Wednesday.
Sarah: Confirmed, July 29. Also we decided to drop the PDF export for v1, CSV only.
Priya: What about the pricing page? Do we update it before launch?
Sarah: Good question, I don't know yet — need to check with finance.
Tom: And are we doing a webinar? Let's decide that next week.
Sarah: Someone should also update the customer success docs.`;

export const SAMPLE_GOALS = `Finish Q3 board deck
Review 3 pull requests from the team
Prepare for 1:1 with my manager
Reply to client proposal from Acme Corp
Write product spec for notifications feature
Gym / walk break`;

function extractActions(t: string) {
  const items: { task: string; owner: string; deadline: string; priority: Priority }[] = [];
  const lines = t.split("\n");
  for (const l of lines) {
    const m = l.match(/^(\w+)[^:]*:\s*(.*)$/);
    if (!m) continue;
    const who = m[1] ?? ""; const said = m[2] ?? "";
    const will = said.match(/I'?ll ([^.]+?)(?: by ([^.,]+))?[.,]/i) || said.match(/I will ([^.]+?)(?: by ([^.,]+))?[.,]/i);
    if (will) {
      items.push({
        task: cap((will[1] ?? "").replace(/ and get .*/, "")),
        owner: who,
        deadline: will[2]?.trim() ?? "TBD ⚠️",
        priority: /launch|api|export/i.test(will[1] ?? "") ? "High" : "Medium",
      });
    }
    const someone = said.match(/someone should (?:also )?([^.]+)/i);
    if (someone) items.push({ task: cap(someone[1] ?? ""), owner: "Unassigned ⚠️", deadline: "TBD ⚠️", priority: "Low" });
  }
  if (!items.length) items.push({ task: "Review transcript and assign follow-ups", owner: "Unassigned ⚠️", deadline: "TBD ⚠️", priority: "Medium" });
  return items;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).trim();

export function mockSummary(t: string, o: SummaryOpts) {
  const actions = extractActions(t);
  const people = Array.from(new Set(t.match(/^(\w+)(?= ?\(|:)/gm) ?? [])).slice(0, 6);
  const decisions = t
    .split(/\n/)
    .filter((l) => /(decid|agree|confirm|move|drop)/i.test(l))
    .map((l) => "- " + cap(l.replace(/^[^:]+:\s*/, "")));
  const questions = t
    .split(/\n/)
    .filter((l) => /\?/.test(l))
    .map((l) => "- " + cap(l.replace(/^[^:]+:\s*/, "")));
  const toneLine =
    o.tone === "Executive"
      ? "Bottom line:"
      : o.tone === "Client"
        ? "Thank you for joining. In summary,"
        : "Quick recap for the team:";
  let summary = `${toneLine} the group (${people.join(", ") || "participants"}) aligned on next steps and ${actions.length} action item(s) were captured.`;
  if (o.length !== "Short")
    summary += ` Key outcomes include ${decisions.length} decision(s) and ${questions.length} open question(s) that need follow-up before the next sync.`;
  if (o.length === "Detailed")
    summary += `\n\nThe discussion covered timelines, scope and ownership. Items marked ⚠️ lack a clear owner or deadline in the transcript and should be confirmed by a human.`;
  const md = `## Executive Summary
${summary}

## Key Decisions
${decisions.join("\n") || "- No explicit decisions recorded ⚠️"}

## Action Items
| Task | Owner | Deadline | Priority |
|---|---|---|---|
${actions.map((a) => `| ${a.task} | ${a.owner} | ${a.deadline} | ${a.priority} |`).join("\n")}

## Open Questions
${questions.join("\n") || "- None identified"}

> ⚠️ **Verify:** owners and deadlines marked ⚠️ were not stated explicitly.`;
  return { md, actions };
}

const toMin = (s: string) => {
  const [h = 0, m] = s.split(":").map(Number);
  return h * 60 + (m || 0);
};
const fmt = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

export function mockPlan(goals: string, start: string, end: string, focus: string): { tasks: PlannerTask[]; md: string } {
  const list = goals.split("\n").map((s) => s.replace(/^[-*\d.\s]+/, "").trim()).filter(Boolean);
  const scored = list.map((g, i) => {
    let score = list.length - i;
    if (/deck|client|proposal|deadline|board|launch|spec/i.test(g)) score += 10;
    if (/gym|walk|break|lunch/i.test(g)) score -= 20;
    if (focus && g.toLowerCase().includes(focus.toLowerCase())) score += 15;
    return { g, score };
  });
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  let t = toMin(start);
  const endM = toMin(end);
  const tasks: PlannerTask[] = [];
  sorted.forEach(({ g }, i) => {
    const dur = /deck|spec|write/i.test(g) ? 90 : /review|prepare/i.test(g) ? 45 : 30;
    if (t >= 12 * 60 && t < 13 * 60 && !tasks.some((x) => x.title === "Lunch break")) {
      tasks.push({ id: uid(), title: "Lunch break", priority: "Low", start: fmt(t), end: fmt(t + 45), done: false });
      t += 45;
    }
    if (t + dur > endM) return;
    tasks.push({
      id: uid(),
      title: g,
      priority: i < 3 && !/gym|walk|break/i.test(g) ? "High" : i < 5 ? "Medium" : "Low",
      start: fmt(t),
      end: fmt(t + dur),
      done: false,
    });
    t += dur + 15;
  });
  const deferred = sorted.length - tasks.filter((x) => x.title !== "Lunch break").length;
  const top = tasks.filter((x) => x.priority === "High").slice(0, 3);
  const md = `## Top 3 priorities
${top.map((x, i) => `${i + 1}. **${x.title}**`).join("\n")}

## Schedule (${start}–${end})
${tasks.map((x) => `- \`${x.start}–${x.end}\` ${x.title} — *${x.priority}*`).join("\n")}

${deferred > 0 ? `> ⚠️ ${deferred} goal(s) didn't fit in your working hours. Consider deferring them to tomorrow.` : "> ✅ All goals fit with 15-minute buffers between blocks."}`;
  return { tasks, md };
}

export function mockChat(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("email"))
    return `Here's a draft you can adapt:

**Subject:** Follow-up on our discussion

Hi [Name],

Thanks for your time today. As discussed, here are the next steps:

- **[Action 1]** — owner: [Name], due [Date]
- **[Action 2]** — owner: [Name], due [Date]

Please let me know if I missed anything.

Best regards,
[Your name]

> Want me to make it more formal, shorter, or tailored to a specific recipient?`;
  if (q.includes("plan my week") || q.includes("week"))
    return `Here's a balanced weekly template:

| Day | Focus | Deep-work block |
|---|---|---|
| Mon | Planning & priorities | 09:00–11:00 |
| Tue | Core project work | 09:00–12:00 |
| Wed | Meetings & collaboration | 14:00–16:00 |
| Thu | Core project work | 09:00–12:00 |
| Fri | Review, admin & learning | 10:00–11:30 |

**Tips**
1. Batch meetings on Wednesday afternoon.
2. Protect mornings for your top-3 priorities.
3. End Friday with a 15-min weekly review.

Tell me your actual goals and I'll make it specific — or use the **Task Planner** for a timed schedule.`;
  if (q.includes("summar"))
    return `Happy to summarize. Please paste the text you'd like condensed, and tell me:

1. **Audience** — executive, team, or client?
2. **Length** — one-liner, bullets, or a paragraph?

For meeting transcripts, the **Meeting Summarizer** tool will also extract action items into a table.`;
  if (q.includes("code") || q.includes("formula") || q.includes("excel"))
    return `Here's an example spreadsheet formula to count overdue tasks:

\`\`\`excel
=COUNTIFS(C:C, "<"&TODAY(), D:D, "<>Done")
\`\`\`

And the equivalent in JavaScript:

\`\`\`js
const overdue = tasks.filter(t => new Date(t.due) < new Date() && t.status !== "Done").length;
\`\`\`

Let me know your column layout and I'll adjust it.`;
  return `Good question. To give you a useful answer I'd like to clarify one thing: **what outcome are you aiming for** (e.g. a draft, a decision, a plan)?

Meanwhile, a few general pointers:
- Break the request into a clear goal, constraints and deadline.
- Identify who needs to be involved.
- Decide what "done" looks like.

> I'm running in offline demo mode, so responses are illustrative.`;
}

/** Simulated token streaming. */
export async function streamText(text: string, onChunk: (s: string) => void, signal?: { cancelled: boolean }) {
  const tokens = text.split(/(\s+)/);
  let out = "";
  for (let i = 0; i < tokens.length; i++) {
    if (signal?.cancelled) return out;
    out += tokens[i];
    if (i % 3 === 0) {
      onChunk(out);
      await new Promise((r) => setTimeout(r, 18));
    }
  }
  onChunk(out);
  return out;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function toPlain(md: string) {
  return md.replace(/^#+\s*/gm, "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]*)`/g, "$1").replace(/^> /gm, "");
}
export function toSlack(md: string) {
  return md.replace(/^#+\s*(.*)$/gm, "*$1*").replace(/\*\*(.*?)\*\*/g, "*$1*").replace(/^- /gm, "• ");
}
