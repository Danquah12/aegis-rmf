import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AssessmentIngest } from "@/components/grc/assessment-ingest";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PIPELINE_STEPS, pipelineState, sampleSarJson } from "@/lib/grc/assessment-ingest";
import { ingestAssessment, runAssessmentPipeline } from "@/lib/grc/queries";
import type { PortfolioSnapshot } from "@/lib/grc/types";
import { cn } from "@/lib/utils";

export function AssessmentPipeline({
  data,
  systemId,
  compact = false,
}: {
  data: PortfolioSnapshot;
  systemId: string;
  compact?: boolean;
}) {
  const system = data.systems.find((s) => s.id === systemId);
  const state = pipelineState(data, systemId);
  const [payload, setPayload] = useState("");
  const [last, setLast] = useState<string | null>(null);
  const qc = useQueryClient();

  const pipeMut = useMutation({
    mutationFn: () =>
      runAssessmentPipeline({
        data: { systemId, payload: payload.trim() ? payload : undefined },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        setLast(res.summary);
        toast.success(res.summary);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });

  const ingestMut = useMutation({
    mutationFn: () => ingestAssessment({ data: { systemId, payload } }),
    onSuccess: (res) => {
      if (res.ok) {
        setLast(res.summary);
        toast.success(res.summary);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });

  if (!system) return null;

  const done = {
    collect: state.collected,
    link: state.linked,
    assess: state.assessed,
    findings: state.findingsReady,
    authorize: false,
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Assessment pipeline</CardTitle>
            {!compact ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Collect evidence, ingest the assessment workbench, record 800-53A results, open findings.
                Does not issue an ATO, accept residual risk, or close a POA&M.
              </p>
            ) : null}
          </div>
          <StatusBadge status={system.atoStatus} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-5">
            {PIPELINE_STEPS.map((step, i) => {
              const isDone = done[step.id];
              const isActive = state.active === step.id;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "rounded-md px-3 py-3",
                    isActive ? "bg-accent" : "bg-secondary/60",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                    {isDone ? <span className="text-[11px] text-satisfied">Done</span> : null}
                    {isActive && !isDone ? <span className="text-[11px] text-partial">Next</span> : null}
                    {step.id === "authorize" ? <span className="text-[11px] text-muted-foreground">Human</span> : null}
                  </div>
                  <div className="mt-1 text-sm font-medium">{step.label}</div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{step.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Evidence" value={String(state.evidenceCount)} />
            <Stat label="Objectives assessed" value={`${state.assessedCount}/${state.objectiveCount}`} />
            <Stat label="Other than satisfied" value={String(state.otherCount)} />
            <Stat label="Open POA&M" value={String(state.poamsOpen)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => pipeMut.mutate()} disabled={pipeMut.isPending}>
              {pipeMut.isPending ? "Running pipeline…" : "Run assessment pipeline"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setPayload(sampleSarJson(systemId))}>
              Load sample SAR
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/systems/$systemId" params={{ systemId }} search={{ view: "assess" }}>
                800-53A workbench
              </Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/systems/$systemId" params={{ systemId }} search={{ view: "conmon" }}>
                ConMon
              </Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/findings">Findings</Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/poam">POA&M</Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/systems/$systemId" params={{ systemId }} search={{ view: "ato" }}>
                ATO (human)
              </Link>
            </Button>
          </div>

          {last ? (
            <div className="rounded-md bg-secondary/60 px-3 py-2 text-sm">
              {last}
              <div className="mt-1 text-[11px] text-muted-foreground">
                ATO remains {system.atoStatus}. SAP/SAR staged as generated. SCA still records; AO still authorizes.
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Run pipeline collects enabled feeds then writes the SAR. Paste a payload first to use your workbench instead of the sample.
              ATO is {system.atoStatus} and will not change.
            </p>
          )}
        </CardContent>
      </Card>

      <AssessmentIngest
        data={data}
        systemId={systemId}
        payload={payload}
        onPayload={setPayload}
        pending={ingestMut.isPending}
        onIngest={() => ingestMut.mutate()}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/50 px-3 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl tabular-nums">{value}</div>
    </div>
  );
}
