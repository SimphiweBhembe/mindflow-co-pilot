import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { newThread } from "@/lib/chat";

export const Route = createFileRoute("/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/chat/$threadId", params: { threadId: newThread() }, replace: true });
  }, [navigate]);
  return null;
}
