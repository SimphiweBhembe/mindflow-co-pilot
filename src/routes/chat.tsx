import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — FlowMind AI" },
      { name: "description", content: "Chat with a concise, business-ready workplace assistant." },
      { property: "og:title", content: "AI Chat — FlowMind AI" },
      { property: "og:description", content: "Draft emails, summarize text and plan your week with AI." },
    ],
  }),
  component: () => <Outlet />,
});
