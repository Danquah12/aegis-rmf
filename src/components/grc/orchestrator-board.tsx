import { Link } from "@tanstack/react-router";
import {
  ClipboardCheck,
  FileText,
  GitMerge,
  Layers,
  Lightbulb,
  Network,
  Play,
  Radio,
  Server,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Meter } from "@/components/grc/meter";
import { StatusBadge } from "@/components/grc/status-badge";
import {
  buildOrchestratorView,
  highlightPlanes,
  ORCH_STAGES,
  type PlaneSource,
} from "@/lib/grc/orchestrator";
import type { PortfolioSnapshot, RmfStep } from "@/lib/grc/types";
import { cn } from "@/lib/utils";

function PlaneColumn({
  title,
  icon: Icon,
  total,
  sources,
  active,
}: {
  title: string;
  icon: typeof FileText;
  total: number;
  sources: PlaneSource[];
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-3",
        active ? "border-primary bg-secondary" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </div>
        <span className="font-mono text-sm tabular-nums">{total}</span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {sources.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
            <span className={s.count ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
            <span className="font-mono tabular-nums text-muted-foreground">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OrchestratorBoard({
  data,
  systemId,
  runningStep,
  busy,
  cycleDone,
  onRun,
}: {
  data: PortfolioSnapshot;
  systemId: string;
  runningStep: RmfStep | null;
  busy: boolean;
  cycleDone: boolean;
  onRun: () => void;
}) {
  const view = buildOrchestratorView(data, systemId);
  if (!view) return null;
  const lit = highlightPlanes(runningStep);
  const pipelineOn = lit.includes("pipeline") || runningStep === "assess";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">2 · RMF orchestrator</div>
            <CardTitle className="mt-1">Deep automation spine</CardTitle>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Document, system, and live telemetry evidence normalize onto the tailored control set, then the 800-53A
              engine recommends. Scanners attach here — ACAS, STIG, Nmap, ETEC, network, application. SCA records. AO is
              the official result. eMASS is not required.
            </p>
          </div>
          <Button onClick={onRun} disabled={busy} className="min-h-11 shrink-0">
            <Play className="size-4" />
            {busy ? `Running ${runningStep ?? "engine"}…` : cycleDone ? "Re-run engine" : "Run through orchestrator"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Meter
          value={view.coveragePercent}
          label={`Tailored controls with normalized evidence (${view.normalizedControls}/${view.tailored})`}
        />

        <div className="grid gap-2 sm:grid-cols-3">
          <PlaneColumn
            title="Document evidence"
            icon={FileText}
            total={view.documentTotal}
            sources={view.document}
            active={lit.includes("document")}
          />
          <PlaneColumn
            title="System evidence"
            icon={Server}
            total={view.systemTotal}
            sources={view.system}
            active={lit.includes("system")}
          />
          <PlaneColumn
            title="Live telemetry"
            icon={Radio}
            total={view.telemetryTotal}
            sources={view.telemetry}
            active={lit.includes("telemetry")}
          />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {ORCH_STAGES.map((s, i) => {
            const Icon =
              s.id === "normalize"
                ? GitMerge
                : s.id === "graph"
                  ? Network
                  : s.id === "assess53a"
                    ? ClipboardCheck
                    : s.id === "analysis"
                      ? Layers
                      : s.id === "recommend"
                        ? Lightbulb
                        : s.id === "human"
                          ? UserRound
                          : ShieldCheck;
            const official = s.id === "official";
            const human = s.id === "human";
            return (
              <div
                key={s.id}
                className={cn(
                  "flex min-h-16 min-w-36 shrink-0 flex-col justify-center rounded-lg border px-3 py-2",
                  pipelineOn && !official ? "border-info bg-info/15 text-foreground" : "border-border bg-card",
                  official ? "border-partial/50" : null,
                )}
              >
                <span className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Icon className="size-3.5" />
                    {i + 1}
                  </span>
                  {official ? <span className="text-partial">AO</span> : human ? <span className="text-partial">SCA</span> : <span>Auto</span>}
                </span>
                <span className="font-display text-base leading-tight">{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Examine" value={view.examine} />
          <Stat label="Interview" value={view.interview} />
          <Stat label="Test" value={view.test} />
          <Stat label="Other than satisfied" value={view.otherCount} />
        </div>

        <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{view.recommendation.headline}</span>
            <Badge variant="outline">Unofficial</Badge>
            <Badge variant={view.recommendation.verdict === "ready_for_sca" ? "satisfied" : "partial"}>
              {view.recommendation.verdict.replaceAll("_", " ")}
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {view.recommendation.confidence}% confidence
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{view.recommendation.summary}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <Link to="/graph" className="text-primary">
              Control knowledge graph
            </Link>
            <Link to="/assessments" className="text-primary">
              800-53A workbench
            </Link>
            <Link to="/ato" className="text-primary">
              Official result
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <StatusBadge status={view.officialStatus} />
          <span>
            Inherited {view.inherited} · hybrid/planned {view.hybrid} · system-specific {view.systemSpecific} · open
            POA&M {view.openPoams} ({view.highPoams} high/critical)
          </span>
          {view.humanPending ? <span>AO decision still required.</span> : <span>AO has recorded an official result.</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-secondary/50 px-3 py-2">
      <div className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="font-mono text-lg tabular-nums">{value}</div>
    </div>
  );
}
