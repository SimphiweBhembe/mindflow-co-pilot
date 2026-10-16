# Mindflow Co Pilot

Build "FlowMind AI" — a modern, responsive SaaS web app called AI Workplace Productivity Assistant that helps professionals automate everyday work tasks.

The app must include a Dashboard, persistent Sidebar Navigation, and three core AI tools: Meeting Notes Summarizer, AI Task Planner, and AI Chatbot Interface, built with a polished SaaS aesthetic (Linear / Notion / Vercel style).

### 1. 🧭 Dashboard Layout & Navigation
- Persistent left sidebar (collapses to a slide-out drawer on mobile):
  - Logo + "FlowMind AI" branding
  - Nav items: Dashboard, Meeting Summarizer, Task Planner, AI Chat, History, Responsible AI, Settings
  - Active item highlighted with an indigo pill
  - User profile card at bottom
- Top header: search bar, dark mode toggle, notifications icon, user avatar
- Dashboard page includes:
  - Welcome banner with summary statistics (tasks planned, meetings summarized, chats conducted)
  - Quick-action cards linking directly to each AI tool
  - "Recent activity" feed showing last AI interactions
  - "How this app helps you" panel framing the core problem solved (time lost to admin work, meeting overload, unclear priorities)

### 2. 📱 Responsive Design
- Mobile: sidebar converts to hamburger slide-out drawer, grids collapse to single column, touch-friendly tap targets
- Tablet: 2-column balanced layouts
- Desktop: full sidebar + multi-column dashboard and split-pane tool views

### 3. 🧩 Input & Output Panels (for every AI tool)
Each AI tool features two clearly separated sections:
- Input panel (left/top): textarea or form controls + configuration options + "Load sample data" button for instant testing
- Output panel (right/bottom): AI response rendered in an editable card with Copy, Download (.md / .txt), Regenerate, and Save-to-History buttons
- Visible loading state (skeleton shimmer) while generating
- Toast notifications on actions (copy, save, export)

**Meeting Notes Summarizer**
- Input: raw transcript textarea + options (summary length, tone: Executive/Team/Client, output format) + "Load sample notes" button
- Output: Executive Summary, Key Decisions, Action Items (table with Task | Owner | Deadline | Priority), and Open Questions
- Cross-tool bridge: "Send action items to Task Planner" button to seamlessly create tasks in the planner

**AI Task Planner**
- Input: goals, deadlines, priorities, working hours + "Load sample inputs" button
- Output: prioritized schedule with time blocks, editable task cards, priority badges, completion checkboxes, and add/reorder controls

**AI Chatbot Interface**
- ChatGPT-style conversation view with message bubbles and typing effect
- Prompt template quick-chips ("Draft an email", "Summarize this", "Plan my week")
- Markdown and code block rendering with per-message copy buttons
- Chat session history accessible from the sidebar

### 4. 🧠 Prompt Engineering Transparency
- Include a collapsible "View prompt used" drawer under every AI output showing the exact structured system prompt and dynamic prompt construction:
  - Meeting Summarizer prompt: structured 4-part schema (Executive Summary, Key Decisions, Action Items table, Open Questions), neutral tone, anti-hallucination constraint.
  - Task Planner prompt: productivity coach persona, top 3 priorities, realistic time blocks respecting buffer time and working hours.
  - Chatbot prompt: workplace assistant role, concise, business-appropriate, clarifies ambiguity, no fabrication.
- Include a "Prompt engineering notes" section in Settings explaining prompt architecture, constraints, role framing, and refusal behavior.

### 5. ⚠️ Responsible AI Practices
- Persistent subtle disclaimer under every AI output: "AI-generated content may contain errors or bias. Always review before acting on it."
- Dedicated Responsible AI page detailing model limitations, bias risks, human-in-the-loop workflows, data handling, and prohibited uses
- First-run onboarding modal presenting AI usage guidelines and consent
- Editable outputs by design so users review before saving/exporting
- Caution / confidence flags highlighting sections that warrant human verification

### 6. 💡 Innovation & Polish
- ⌘K command palette for fast search and tool navigation
- "View prompt used" transparency inspect drawers
- Cross-tool workflow (Meeting Summarizer → Task Planner)
- Export formatting for Markdown, plain text, and Slack/Email format

### 7. 🎨 Design & Theme
- Color palette: Deep indigo primary (#6366F1), slate neutrals, clean contrast
- Typography: Inter / Geist with clear typographic hierarchy
- UI feel: 12–16px rounded corners, soft drop shadows, subtle glassmorphism cards
- Dark mode toggle with smooth theme transition

### 8. 🛠️ Functionality & Persistence
- State persistence: Store history, planner tasks, and theme preferences in localStorage so all work survives browser refresh.
- Simulated streaming / offline fallback: If external API keys are not provided, provide realistic typing/streaming simulation with structured mock outputs so the entire application is 100% demoable immediately.
- Comprehensive input validation and friendly empty states with quick-start CTAs.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/737bfad3-5f78-4146-b6ec-8fce4543c3f4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
