import { createFileRoute, Link } from "@tanstack/react-router";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { LifecycleStrip } from "@/components/grc/lifecycle-strip";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { Meter } from "@/components/grc/meter";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { systemSlice, usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { orgOf, programOf, stepProgress } from "@/lib/grc/layer1";
import {
  authorizationType,
  buildControlRows,
  currentGate,
  impactTrio,
  packageCompleteness,
  WORKFLOW_GATES,
} from "@/lib/grc/package";
import { formatDate } from "@/lib/utils";
import { buildOrgPrepareView } from "@/lib/grc/phase0";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/systems/")({
  loader: () => getPortfolio(),
  component: SystemsPage,
});

function SystemsPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;
  const orgView = buildOrgPrepareView(data);

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="System of record"
        title="Information systems"
        description="The information system is the hub. Every control, assessment, POA&M, risk, and ATO attaches to a boundary — not the other way around. Organization Prepare must exist first."
        actions={
          <Button asChild className="min-h-11">
            <Link to="/prepare">Register from Prepare</Link>
          </Button>
        }
      />
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-2 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">Organization Prepare {orgView.overall}%</div>
            <p className="text-xs text-muted-foreground">{orgView.summary}</p>
          </div>
          <StatusBadge status={orgView.readyForSystems ? "established" : "draft"} />
        </CardContent>
      </Card>
      <div className="space-y-3">
        {data.systems.map((system) => {
          const slice = systemSlice(data, system.id);
          const complete = packageCompleteness(data, system.id);
          const cia = impactTrio(system);
          const gate = currentGate(system);
          const rows = buildControlRows(data, system.id).filter((r) => r.selected);
          const inherited = rows.filter((r) => r.origination === "inherited").length;
          const hybrid = rows.filter((r) => r.origination === "hybrid").length;
          const systemOwned = rows.filter((r) => r.origination === "system").length;
          return (
            <Link
              key={system.id}
              to="/systems/$systemId"
              params={{ systemId: system.id }}
            >
              <Card className="transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]">
                <CardContent className="space-y-4 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {system.id} · {orgOf(system)?.acronym ?? "—"} · {programOf(system)?.name ?? "—"} · v{system.extra.packageVersion ?? "1.0"}
                      </div>
                      <h2 className="text-lg font-medium">{system.acronym}</h2>
                      <p className="text-sm text-muted-foreground">{system.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={authorizationType(system)} />
                      <StatusBadge status={system.atoStatus} />
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{system.mission}</p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={`C ${cia.confidentiality}`} />
                    <StatusBadge status={`I ${cia.integrity}`} />
                    <StatusBadge status={`A ${cia.availability}`} />
                    <CycleBadge step={system.rmfStep} link={false} />
                    <StatusBadge status={WORKFLOW_GATES.find((g) => g.id === gate)?.label ?? gate} />
                    {system.extra.overlay ? <StatusBadge status={system.extra.overlay} /> : null}
                  </div>
                  <Meter value={complete.overall} label="Package completeness" />
                  <LifecycleStrip steps={stepProgress(data, system.id)} compact />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                    <div>
                      <div className="tabular-nums text-foreground">
                        {systemOwned}/{inherited}/{hybrid}
                      </div>
                      System / inherited / hybrid
                    </div>
                    <div>
                      <div className="tabular-nums text-foreground">
                        {complete.artifactsReady}/{complete.artifactsRequired}
                      </div>
                      Artifacts
                    </div>
                    <div>
                      <div className="tabular-nums text-foreground">
                        {slice.poams.filter((p) => p.status !== "completed").length}
                      </div>
                      Open POA&M
                    </div>
                    <div>
                      <div className="tabular-nums text-foreground">
                        {system.atoExpires ? formatDate(system.atoExpires) : "—"}
                      </div>
                      ATO expires
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
