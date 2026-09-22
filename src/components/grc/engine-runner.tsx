import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/grc/status-badge";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { ENGINE_STEPS, engineCursorOf, isAoGate } from "@/lib/grc/engine";
import { RMF_STEPS } from "@/lib/grc/cycle";
import { recordAtoDecision, runEngineStep, type EngineStepResult } from "@/lib/grc/queries";
import type { PortfolioSnapshot, RmfStep } from "@/lib/grc/types";
import { SupportDocsPanel } from "@/components/grc/support-docs";
import { OrchestratorBoard } from "@/components/grc/orchestrator-board";
import { ActingAsPicker } from "@/components/grc/acting-as";
import { StandaloneBoard } from "@/components/grc/standalone-board";
import { useActingRole } from "@/hooks/use-acting-role";
import { canPerform } from "@/lib/grc/phase0";
import { cn } from "@/lib/utils";

type StepState = "pending" | "running" | "done" | "gate";

function stepStateOf(
  id: RmfStep,
  cursor: RmfStep,
  running: RmfStep | null,
  journal: EngineStepResult[],
  gateOpen: boolean,
  humanLeft: boolean,
): StepState {
  if (running === id) return "running";
  if (id === "authorize" && gateOpen && humanLeft) return "gate";
  if (journal.some((j) => j.step === id)) return "done";
  const ci = RMF_STEPS.indexOf(cursor);
  const si = RMF_STEPS.indexOf(id);
  if (si < ci) return "done";
  if (cursor === "monitor" && si === ci) return "done";
  return "pending";
}

export function EngineRunner({
  data,
  systemId,
  onSystem,
}: {
  data: PortfolioSnapshot;
  systemId: string;
  onSystem: (id: string) => void;
}) {
  const system = data.systems.find((s) => s.id === systemId);
  const qc = useQueryClient();
  const aoRef = useRef<HTMLDivElement>(null);
  const [journal, setJournal] = useState<EngineStepResult[]>([]);
  const [runningStep, setRunningStep] = useState<RmfStep | null>(null);
  const [cycleBusy, setCycleBusy] = useState(false);
  const [conditions, setConditions] = useState(
    "Close open High/Critical POA&M. Monthly ConMon to AO. Engine may not accept residual risk.",
  );
  const { roleId, role } = useActingRole();
  const canAuthorize =
    canPerform(roleId, "ato.issue") || canPerform(roleId, "ato.condition");
  const cursor = system ? engineCursorOf(system) : "prepare";

  useEffect(() => {
    setJournal([]);
    setRunningStep(null);
  }, [systemId]);

  const stepMut = useMutation({
    mutationFn: (step: RmfStep) => runEngineStep({ data: { systemId, step } }),
    onSuccess: (res) => {
      if (res.ok) {
        setJournal((j) => [...j, res]);
        toast.success(res.summary);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  const aoMut = useMutation({
    mutationFn: (decision: "authorized" | "authorized_with_conditions" | "not_authorized") =>
      recordAtoDecision({ data: { systemId, decision, conditions, actingRole: roleId } }),
    onSuccess: (res) => {
      if (res && "ok" in res && res.ok === false) {
        toast.error(res.error);
        return;
      }
      toast.success("AO decision recorded");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  if (!system) return null;

  const gateOpen = isAoGate(system) || journal.some((j) => j.step === "authorize");
  const last = journal.at(-1);
  const authorizeResult = [...journal].reverse().find((j) => j.step === "authorize");
  const busy = cycleBusy || stepMut.isPending || aoMut.isPending;
  const cycleDone = journal.some((j) => j.step === "authorize") || gateOpen;
  const humanLeft =
    system.atoStatus === "in_assessment" ||
    system.atoStatus === "not_authorized" ||
    system.atoStatus === "expired";

  async function runCycle() {
    setCycleBusy(true);
    setJournal([]);
    try {
      for (const def of ENGINE_STEPS) {
        setRunningStep(def.id);
        const res = await runEngineStep({
          data: { systemId, step: def.id, skipHeavyCollect: def.id === "monitor" },
        });
        if (!res.ok) {
          toast.error(res.error);
          break;
        }
        setJournal((j) => [...j, res]);
        await qc.invalidateQueries({ queryKey: ["portfolio"] });
        if (def.id === "authorize") {
          aoRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
      toast.success("Engine finished. ATO unchanged — AO decision required.");
    } finally {
      setRunningStep(null);
      setCycleBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>1 · Select the information system</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The engine runs against one authorization boundary. Helios is the assessment demo; Aether, Argus, and
            Vanguard already hold ATOs.
          </p>
          <div className="space-y-1">
            <Label htmlFor="engine-system">Information system</Label>
            <Select value={systemId} onValueChange={onSystem} disabled={busy}>
              <SelectTrigger id="engine-system" className="min-h-11">
                <SelectValue placeholder="Select a system" />
              </SelectTrigger>
              <SelectContent>
                {data.systems.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.acronym} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.systems.map((s) => {
              const selected = s.id === systemId;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onSystem(s.id)}
                  className={cn(
                    "min-h-11 rounded-lg border px-4 py-3 text-left transition-colors duration-150",
                    selected
                      ? "border-primary bg-secondary text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] tracking-wide uppercase">{s.acronym}</span>
                    <StatusBadge status={s.atoStatus} />
                    <CycleBadge step={s.rmfStep} link={false} />
                  </div>
                  <div className="mt-1 font-display text-lg leading-tight text-foreground">{s.name}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <StandaloneBoard compact />

      <OrchestratorBoard
        data={data}
        systemId={systemId}
        runningStep={runningStep}
        busy={busy}
        cycleDone={cycleDone}
        onRun={() => void runCycle()}
      />

      <SupportDocsPanel
        key={systemId}
        data={data}
        systemId={systemId}
        defaultStep={cursor === "monitor" ? "select" : cursor}
        numbered
      />

      {runningStep ? (
        <p className="text-sm text-info">
          Running {ENGINE_STEPS.find((s) => s.id === runningStep)?.name} —{" "}
          {ENGINE_STEPS.find((s) => s.id === runningStep)?.automation}
        </p>
      ) : null}

      <div>
        <div className="mb-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Six automated steps · one AO gate
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {ENGINE_STEPS.map((s) => {
            const state = stepStateOf(s.id, cursor, runningStep, journal, gateOpen, humanLeft);
            return (
              <div
                key={s.id}
                className={cn(
                  "flex min-h-16 min-w-36 shrink-0 flex-col justify-center rounded-lg border px-3 py-2",
                  state === "running" && "border-info bg-info/15 text-foreground",
                  state === "done" && "border-satisfied/50 bg-card text-foreground",
                  state === "gate" && "border-partial bg-partial/15 text-foreground",
                  state === "pending" && "border-border bg-card text-muted-foreground",
                )}
              >
                <span className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wide">
                  <span>
                    {s.index} {s.short}
                  </span>
                  {s.id === "authorize" ? (
                    <span className="text-partial">Human</span>
                  ) : (
                    <span className="text-muted-foreground">Auto</span>
                  )}
                </span>
                <span className="font-display text-lg leading-tight">{s.name}</span>
                <span className="mt-0.5 text-[11px] text-muted-foreground">
                  {state === "running"
                    ? "Running"
                    : state === "done"
                      ? "Complete"
                      : state === "gate"
                        ? "Waiting on AO"
                        : "Queued"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div ref={aoRef}>
        <Card className={cn(gateOpen && humanLeft ? "border-partial/50" : "")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              4 · AO gate — the only official result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Residual risk is staged. Agents never issue an ATO, never accept residual risk, and never close a POA&M.
              {!humanLeft
                ? " AO decision recorded. Continuous monitoring is now the live step."
                : gateOpen
                  ? " Package is waiting on the authorizing official."
                  : " Run the engine first — six automated steps, then this gate."}
            </p>
            <ActingAsPicker compact id="engine-acting" />
            {!canAuthorize ? (
              <p className="text-sm text-muted-foreground">
                {role.name} cannot issue an ATO. Switch acting-as to Authorizing Official or AO designated representative.
              </p>
            ) : null}
            {authorizeResult ? <p className="text-sm">{authorizeResult.summary}</p> : null}
            <Textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={3}
              disabled={busy || !gateOpen}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => aoMut.mutate("authorized_with_conditions")}
                disabled={busy || !gateOpen || !canAuthorize}
                className="min-h-11"
              >
                Authorize with conditions
              </Button>
              <Button
                variant="outline"
                onClick={() => aoMut.mutate("authorized")}
                disabled={busy || !gateOpen || !canAuthorize}
                className="min-h-11"
              >
                Authorize
              </Button>
              <Button
                variant="ghost"
                onClick={() => aoMut.mutate("not_authorized")}
                disabled={busy || !gateOpen || !canAuthorize}
                className="min-h-11"
              >
                Return for remediation
              </Button>
              <Button variant="outline" asChild className="min-h-11">
                <Link to="/systems/$systemId" params={{ systemId }} search={{ view: "ato" }}>
                  Open ATO view
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {journal.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Engine journal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {journal.map((j, i) => (
              <div key={`${j.step}-${i}`} className="rounded-md bg-secondary/60 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  <span className="capitalize">{j.step}</span>
                  {j.humanRequired ? <Badge variant="partial">AO gate</Badge> : <Badge variant="outline">Automated</Badge>}
                  {j.atoUnchanged ? <Badge variant="info">ATO unchanged</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">{j.summary}</p>
                {typeof j.docsCovered === "number" && typeof j.docsTotal === "number" ? (
                  <p className="text-xs text-muted-foreground">
                    Tailored comparison {j.docsCovered}/{j.docsTotal}
                    {typeof j.docsGaps === "number" ? ` · ${j.docsGaps} gaps` : ""}
                  </p>
                ) : null}
                {j.recommendation ? (
                  <p className="text-xs text-muted-foreground">
                    Orchestrator rec · {j.recommendationVerdict?.replaceAll("_", " ")} · {j.recommendation}
                  </p>
                ) : null}
              </div>
            ))}
            {last ? (
              <p className="pt-1 text-xs text-muted-foreground">
                Last: ATO {last.atoUnchanged ? "unchanged" : "changed"} ({last.atoStatus}) · RMF {last.rmfStep}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <details className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Advanced — run a single RMF step</summary>
        <div className="space-y-2 border-t border-border p-3">
          {ENGINE_STEPS.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-2 rounded-md bg-secondary/40 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {s.index} {s.name}
                </div>
                <p className="text-xs text-muted-foreground">{s.automation}</p>
                <p className="text-xs text-muted-foreground">Human: {s.human}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => stepMut.mutate(s.id)}
                className="min-h-11 shrink-0"
              >
                {stepMut.isPending && stepMut.variables === s.id ? "Running…" : "Run this step"}
              </Button>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
