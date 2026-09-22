import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Meter } from "@/components/grc/meter";
import { StatusBadge } from "@/components/grc/status-badge";
import {
  AGENT_HIERARCHY,
  MATRIX_PHASES,
  QUALITY_GATES,
  RMF_PRINCIPLE,
  coverMatrix,
  matrixSummary,
  systemUnderstanding,
  type MatrixCoverage,
  type MatrixPhase,
} from "@/lib/grc/matrix";
import type { PortfolioSnapshot } from "@/lib/grc/types";
import { cn } from "@/lib/utils";

export function MatrixBoard({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const [phase, setPhase] = useState<MatrixPhase | "all">("all");
  const [requiredOnly, setRequiredOnly] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const covered = useMemo(() => coverMatrix(data, systemId), [data, systemId]);
  const filtered = covered.filter((c) => {
    if (phase !== "all" && c.row.phase !== phase) return false;
    if (requiredOnly && !c.row.required) return false;
    return true;
  });
  const summary = matrixSummary(phase === "all" ? covered : covered.filter((c) => c.row.phase === phase));
  const selected = filtered.find((c) => c.row.id === selectedId) ?? filtered[0];
  const system = data.systems.find((s) => s.id === systemId);

  return (
    <div className="min-w-0 space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="text-sm">{RMF_PRINCIPLE}</p>
          <p className="text-xs text-muted-foreground">
            SP 800-53A is the assessment methodology — examine, interview, test — tailored for automation and continuous
            monitoring. The engine recommends. The SCA determines. The AO authorizes. Agents never issue an ATO.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Coverage · {system?.acronym ?? systemId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Meter value={summary.pct} label="Required artifacts present (draft or official)" />
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-5">
            <Stat n={summary.required} l="Required" />
            <Stat n={summary.covered} l="Present" />
            <Stat n={summary.official} l="Official" />
            <Stat n={summary.blocked} l="Awaiting human" />
            <Stat n={summary.missing} l="Missing" />
          </div>
        </CardContent>
      </Card>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        <PhaseChip active={phase === "all"} onClick={() => setPhase("all")} label="All phases" />
        {MATRIX_PHASES.map((p) => (
          <PhaseChip
            key={p.id}
            active={phase === p.id}
            onClick={() => setPhase(p.id)}
            label={p.id === "fisma" ? "FISMA" : `P${p.id}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={requiredOnly ? "default" : "outline"}
          className="min-h-11"
          onClick={() => setRequiredOnly((v) => !v)}
        >
          {requiredOnly ? "Required only" : "Include optional"}
        </Button>
        <Button variant="outline" asChild className="min-h-11">
          <Link to="/engine">Open engine</Link>
        </Button>
        <Button variant="outline" asChild className="min-h-11">
          <Link to="/reports">FISMA dashboard</Link>
        </Button>
      </div>
      {phase !== "all" ? (
        <p className="text-xs text-muted-foreground">{MATRIX_PHASES.find((p) => p.id === phase)?.nist}</p>
      ) : null}

      <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_22rem]">
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="divide-y divide-border p-0">
            {filtered.map((c) => (
              <button
                key={c.row.id}
                type="button"
                onClick={() => setSelectedId(c.row.id)}
                className={cn(
                  "flex min-h-11 w-full flex-col gap-1 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between",
                  selected?.row.id === c.row.id ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{c.row.task}</span>
                    <span className="text-sm font-medium">{c.row.artifact}</span>
                    {c.row.required ? null : <Badge variant="outline">optional</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.row.activity}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={c.status} />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
        {selected ? <RowDetail c={selected} /> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assessment quality gates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              The assessor agent cannot emit a final recommendation until every gate passes. Missing, stale, or
              conflicting evidence stops the engine. It does not guess “probably compliant.”
            </p>
            {QUALITY_GATES.map((g) => (
              <div key={g.id} className="border-b border-border py-2 last:border-0">
                <div className="text-sm font-medium">
                  {g.id.toUpperCase()} · {g.name}
                </div>
                <p className="text-xs text-muted-foreground">{g.fail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agent hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Twenty collectors do not independently decide. They report to the Assessment Orchestrator. The Control
              Assessor Agent recommends. A human records the official result.
            </p>
            {AGENT_HIERARCHY.map((a) => (
              <div key={a.id} className="flex min-h-11 items-center justify-between gap-2">
                <span className="text-sm">{a.name}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{a.reportsTo ?? "root"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RowDetail({ c }: { c: MatrixCoverage }) {
  const r = c.row;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{r.artifact}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={c.status} />
          <Badge variant="outline">{r.nist}</Badge>
          <Badge variant="outline">{r.task}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{c.note}</p>
        <Fact label="Activity" value={r.activity} />
        <Fact label="AI agent" value={r.agent} />
        <Fact label="Evidence sources" value={r.sources.join(" · ")} />
        <Fact label="800-53A procedure" value={r.procedure} />
        <Fact label="Automated test" value={r.autoTest} />
        <Fact label="Human approval" value={humanLabel(r.human)} />
        <Fact label="OSCAL object" value={r.oscal} />
        <Fact label="FISMA output" value={r.fisma} />
        <Fact label="Database" value={r.tables.join(" · ")} />
        <Fact label="Workflow" value={r.workflow} />
        <Fact label="Data fields" value={r.fields.join(" · ")} />
        {(r.human === "ao" || r.human === "sca") && c.status !== "official" ? (
          <p className="text-xs text-other">
            Official determination. The engine will collect and recommend; it will not write this result.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function humanLabel(h: MatrixCoverage["row"]["human"]) {
  switch (h) {
    case "ao":
      return "Authorizing Official (official)";
    case "sca":
      return "Control assessor (official SAR)";
    case "saiso":
      return "SAISO / CIO publish";
    case "isso":
      return "ISSO review";
    case "owner":
      return "System owner confirms";
    default:
      return "None — AI may draft";
  }
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div>
      <div className="font-display text-xl tabular-nums text-foreground">{n}</div>
      {l}
    </div>
  );
}

function PhaseChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 min-w-16 shrink-0 items-center justify-center rounded-lg border px-3 text-xs font-medium",
        active ? "border-primary bg-secondary text-foreground" : "border-border bg-card text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

export function UnderstandingCard({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const u = systemUnderstanding(data, systemId);
  if (!u) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>System understanding package</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Draft intelligence from discovery. Not an official determination. Not a categorization. Not an ATO.
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <Fact label="System" value={`${u.acronym}`} />
          <Fact label="Components" value={String(u.components)} />
          <Fact label="Applications" value={String(u.applications)} />
          <Fact label="Servers" value={String(u.servers)} />
          <Fact label="Containers" value={String(u.containers)} />
          <Fact label="Databases" value={String(u.databases)} />
          <Fact label="Cloud" value={u.cloud} />
          <Fact label="External interfaces" value={String(u.interfaces)} />
          <Fact label="Data types" value={u.dataTypes.join(" · ") || "—"} />
          <Fact label="Potential boundary" value={u.boundary} />
          <Fact label="Potential inherited controls" value={String(u.inherited)} />
        </div>
        <StatusBadge status="unofficial" />
      </CardContent>
    </Card>
  );
}
