import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BrainCircuit,
  CalendarCheck,
  FileText,
  History,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KEYS, useStore, type ChatThread, type HistoryItem } from "@/lib/store";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/summarizer", label: "Meeting Summarizer", icon: FileText },
  { to: "/planner", label: "Task Planner", icon: CalendarCheck },
  { to: "/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/history", label: "History", icon: History },
  { to: "/responsible-ai", label: "Responsible AI", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="bg-hero flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground shadow-md">
        <BrainCircuit className="h-4.5 w-4.5" />
      </div>
      <span className="font-semibold tracking-tight">FlowMind AI</span>
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [threads] = useStore<ChatThread[]>(KEYS.threads, []);
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-1">
        <Logo />
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <div key={to}>
              <Link
                to={to}
                onClick={onNavigate}
                className={`flex min-h-10 items-center gap-3 rounded-full px-3 text-sm transition ${
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
              {to === "/chat" && threads.length > 0 && (
                <div className="ml-6 mt-1 flex flex-col border-l border-border pl-2">
                  {threads.slice(0, 5).map((t) => (
                    <Link
                      key={t.id}
                      to="/chat/$threadId"
                      params={{ threadId: t.id }}
                      onClick={onNavigate}
                      className={`truncate rounded-md px-2 py-1.5 text-xs ${
                        path === `/chat/${t.id}` ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <Avatar />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Simphiwe Bhembe</p>
          <p className="truncate text-xs text-muted-foreground">Pro workspace</p>
        </div>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="bg-hero flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground">
      SB
    </div>
  );
}

export function useTheme() {
  const [theme, setTheme] = useStore<"light" | "dark">(KEYS.theme, "light");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return [theme, setTheme] as const;
}

function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const navigate = useNavigate();
  const [history] = useStore<HistoryItem[]>(KEYS.history, []);
  const [, setTheme] = useTheme();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, setOpen]);
  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search tools, history, actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {NAV.map((n) => (
            <CommandItem key={n.to} onSelect={() => go(n.to)}>
              <n.icon className="mr-2 h-4 w-4" />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { setTheme((t) => (t === "dark" ? "light" : "dark")); setOpen(false); }}>
            <Moon className="mr-2 h-4 w-4" /> Toggle dark mode
          </CommandItem>
        </CommandGroup>
        {history.length > 0 && (
          <CommandGroup heading="Recent history">
            {history.slice(0, 6).map((h) => (
              <CommandItem key={h.id} onSelect={() => go("/history")}>
                <History className="mr-2 h-4 w-4" />
                {h.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function Onboarding() {
  const [done, setDone, ready] = useStore<boolean>(KEYS.onboarded, false);
  const [agree, setAgree] = useState(false);
  return (
    <Dialog open={ready && !done} onOpenChange={() => {}}>
      <DialogContent className="max-h-[90vh] gap-3 overflow-y-auto sm:max-w-lg [&>button:has(.sr-only)]:hidden">
        <div className="bg-hero flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <DialogTitle className="text-xl">Welcome to FlowMind AI</DialogTitle>
          <DialogDescription>Before you start, please review how to use AI responsibly at work.</DialogDescription>
        </div>
        <ul className="space-y-1.5 text-sm">
          {[
            "AI output can be wrong, incomplete or biased — always review before sharing or acting.",
            "Don't paste confidential, personal or regulated data you aren't allowed to share.",
            "You stay accountable: every output is editable so a human approves the final version.",
            "Your work is stored only in this browser. Clear it any time in Settings.",
          ].map((t) => (
            <li key={t} className="flex gap-2 rounded-lg bg-muted p-2">
              <span className="text-primary">•</span>
              {t}
            </li>
          ))}
        </ul>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} />I understand and agree to these guidelines
        </label>
        <Button disabled={!agree} onClick={() => setDone(true)} className="w-full">
          Get started
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const [cmd, setCmd] = useState(false);
  const [theme, setTheme] = useTheme();
  const [history] = useStore<HistoryItem[]>(KEYS.history, []);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody onNavigate={() => setMobile(false)} />
        </SheetContent>
      </Sheet>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <button
            onClick={() => setCmd(true)}
            className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition hover:bg-muted md:max-w-md"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd className="hidden rounded border border-border bg-background px-1.5 font-mono text-[10px] sm:inline">⌘K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Notifications" className="relative">
                  <Bell className="h-5 w-5" />
                  {history.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <p className="mb-2 text-sm font-medium">Notifications</p>
                {history.length ? (
                  history.slice(0, 4).map((h) => (
                    <p key={h.id} className="truncate border-t border-border py-2 text-xs text-muted-foreground">
                      Saved: {h.title}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">You're all caught up.</p>
                )}
              </PopoverContent>
            </Popover>
            <div className="ml-1">
              <Avatar />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</main>
      </div>
      <CommandPalette open={cmd} setOpen={setCmd} />
      <Onboarding />
    </div>
  );
}
