import { useState, type ReactNode } from "react";
import { ChevronDown, Copy, Download, Eye, Pencil, RefreshCw, Save, ShieldAlert, Terminal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "./Markdown";
import { toPlain, toSlack } from "@/lib/ai";

export function Disclaimer() {
  return (
    <p className="flex items-start gap-2 text-xs text-muted-foreground">
      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      AI-generated content may contain errors or bias. Always review before acting on it.
    </p>
  );
}

export function PromptDrawer({ prompt }: { prompt: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
        <Terminal className="h-3.5 w-3.5" /> View prompt used
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/60 p-3 font-mono text-[11px] leading-relaxed">
          {prompt}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function OutputSkeleton() {
  return (
    <div className="space-y-3" aria-label="Generating">
      {[60, 95, 85, 40, 90, 70, 80].map((w, i) => (
        <div key={i} className="shimmer h-3.5 rounded" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

export function download(name: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
  toast.success(`Exported ${name}`);
}

export function OutputPanel({
  title,
  content,
  onChange,
  loading,
  streaming,
  prompt,
  onRegenerate,
  onSave,
  filename,
  extra,
  empty,
}: {
  title: string;
  content: string;
  onChange: (v: string) => void;
  loading: boolean;
  streaming: boolean;
  prompt: string;
  onRegenerate: () => void;
  onSave: () => void;
  filename: string;
  extra?: ReactNode;
  empty: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const has = !!content;
  return (
    <section className="glass flex min-h-[420px] flex-col rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        {has && !streaming && (
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing((e) => !e)}>
              {editing ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              <span className="hidden sm:inline">{editing ? "Preview" : "Edit"}</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(content);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => download(`${filename}.md`, content)}>Markdown (.md)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => download(`${filename}.txt`, toPlain(content))}>Plain text (.txt)</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(toSlack(content));
                    toast.success("Copied in Slack format");
                  }}
                >
                  Copy for Slack
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(toPlain(content));
                    toast.success("Copied in email format");
                  }}
                >
                  Copy for Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="ghost" onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
            <Button size="sm" onClick={onSave}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        )}
      </div>
      <div className="flex-1">
        {loading ? (
          <OutputSkeleton />
        ) : !has ? (
          empty
        ) : editing ? (
          <Textarea value={content} onChange={(e) => onChange(e.target.value)} className="min-h-[360px] font-mono text-xs" />
        ) : (
          <Markdown>{content}</Markdown>
        )}
      </div>
      {has && !loading && (
        <div className="mt-5 space-y-3 border-t border-border pt-4">
          {extra}
          <PromptDrawer prompt={prompt} />
          <Disclaimer />
        </div>
      )}
    </section>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 text-center">
      <div className="rounded-2xl bg-accent p-3 text-accent-foreground">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="rounded-xl bg-accent p-2.5 text-accent-foreground">{icon}</div>
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
