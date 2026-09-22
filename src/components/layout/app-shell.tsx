import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Blocks,
  BookOpen,
  Bot,
  Bug,
  Cable,
  ClipboardCheck,
  FileBarChart,
  FolderOpen,
  GitBranch,
  GraduationCap,
  Hexagon,
  Landmark,
  LayoutGrid,
  ListChecks,
  Menu,
  MessageSquare,
  Network,
  Play,
  RefreshCw,
  Repeat,
  ScanSearch,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Siren,
  Swords,
  Table2,
  Workflow,
  Layers,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { AegisMark } from "@/components/brand/aegis-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Record",
    items: [
      { to: "/prepare", label: "Prepare", icon: Landmark },
      { to: "/matrix", label: "Matrix", icon: Layers },
      { to: "/", label: "Command", icon: LayoutGrid },
      { to: "/systems", label: "Systems", icon: Shield },
      { to: "/cycle", label: "RMF", icon: RefreshCw },
      { to: "/engine", label: "Engine", icon: Play },
    ],
  },
  {
    label: "Authorize",
    items: [
      { to: "/implementation", label: "Implementation", icon: Table2 },
      { to: "/assessments", label: "Assessments", icon: ListChecks },
      { to: "/inheritance", label: "Inheritance", icon: GitBranch },
      { to: "/ato", label: "ATO", icon: ShieldCheck },
      { to: "/workflow", label: "Workflow", icon: Workflow },
    ],
  },
  {
    label: "Operate",
    items: [
      { to: "/evidence", label: "Evidence", icon: FolderOpen },
      { to: "/integrations", label: "Integrations", icon: Cable },
      { to: "/vulnerabilities", label: "Vulnerabilities", icon: ScanSearch },
      { to: "/poam", label: "POA&M", icon: ClipboardCheck },
      { to: "/risk", label: "Risk", icon: Activity },
      { to: "/findings", label: "Findings", icon: Bug },
      { to: "/incidents", label: "Incidents", icon: Siren },
    ],
  },
  {
    label: "Continuous",
    items: [
      { to: "/twin", label: "Twin", icon: Hexagon },
      { to: "/attack", label: "Attack", icon: Swords },
      { to: "/simulate", label: "Simulate", icon: Network },
      { to: "/cato", label: "cATO", icon: Repeat },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/controls", label: "Catalog", icon: BookOpen },
      { to: "/agents", label: "Agents", icon: Bot },
      { to: "/ask", label: "Ask Aegis", icon: MessageSquare },
      { to: "/reports", label: "Reports", icon: FileBarChart },
      { to: "/marketplace", label: "Marketplace", icon: Blocks },
    ],
  },
  {
    label: "Learn",
    items: [
      { to: "/academy", label: "Academy", icon: GraduationCap },
      { to: "/policy", label: "Policy", icon: ScrollText },
      { to: "/zero-trust", label: "Zero Trust", icon: ShieldAlert },
      { to: "/supply", label: "Supply", icon: GitBranch },
    ],
  },
  {
    label: "Operations",
    items: [{ to: "/admin", label: "Admin", icon: Settings }],
  },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-4 px-2 pb-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="px-3 pb-1 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {group.label}
          </div>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-4 py-4">
      <AegisMark className="size-7" />
      <div className="leading-tight">
        <div className="font-display text-lg tracking-tight">AegisRMF</div>
        <div className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          System of record
        </div>
      </div>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto pb-6">
          <NavLinks />
        </div>
        <div className="border-t border-sidebar-border px-4 py-3 text-[11px] text-muted-foreground">
          Continuous RMF · OSCAL-backed
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-3 py-2 backdrop-blur md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <AegisMark className="size-6" />
        <span className="font-display text-base">AegisRMF</span>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="bg-sidebar p-0">
          <Brand />
          <NavLinks onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="md:pl-56">
        <main className="mx-auto min-h-dvh w-full min-w-0 max-w-7xl overflow-x-clip px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
