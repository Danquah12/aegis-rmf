import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio, runConmon, toggleConnector, collectFromConnector, runAssessmentPipeline } from "@/lib/grc/queries";
import { bindingHealth, DEFAULT_FEEDS, feedsFor } from "@/lib/grc/collection";
import { CONNECTORS } from "@/lib/grc/layer1";
import { AssessmentToolsPanel } from "@/components/grc/assessment-tools-panel";
import { StandaloneBoard } from "@/components/grc/standalone-board";
import { EVIDENCE_MAPPINGS } from "@/lib/grc/mappings";

export const Route = createFileRoute("/integrations")({
  loader: () => getPortfolio(),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const qc = useQueryClient();
  const runMut = useMutation({
    mutationFn: (systemId: string) => runConmon({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`ConMon ${res.feeds} feeds · ${res.evidenceCount} artifacts. ATO unchanged.`);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      }
    },
  });
  const pipeMut = useMutation({
    mutationFn: (systemId: string) => runAssessmentPipeline({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.summary);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  const collectMut = useMutation({
    mutationFn: (input: { systemId: string; connector: string }) =>
      collectFromConnector({ data: { systemId: input.systemId, connector: input.connector, controlId: "CA-2" } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.summary);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  const togMut = useMutation({
    mutationFn: (input: { systemId: string; connectorId: string; enabled: boolean }) => toggleConnector({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  const due = data.connectorBindings.filter((b) => bindingHealth(b) === "due" || bindingHealth(b) === "stale").length;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="Standalone collection plane"
        title="Integrations"
        description="AegisRMF is the system of record. Attach scanners and assessment tools here. Feeds write the evidence lake and remap to 800-53A. Collectors never authorize, never accept residual risk, and never close a POA&M."
        actions={
          <Button variant="outline" asChild>
            <Link to="/assessments">Assessment pipeline</Link>
          </Button>
        }
      />
      <div className="mb-6 space-y-4">
        <StandaloneBoard />
        <AssessmentToolsPanel data={data} systemId="SYS-HELIOS" />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-muted-foreground">Bound feeds</div>
            <div className="font-display text-3xl tabular-nums">{data.connectorBindings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-muted-foreground">Due or stale</div>
            <div className="font-display text-3xl tabular-nums">{due}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-muted-foreground">Jobs this session</div>
            <div className="font-display text-3xl tabular-nums">{data.collectionJobs.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {data.systems.map((system) => {
          const bindings = data.connectorBindings.filter((b) => b.systemId === system.id);
          const jobs = data.collectionJobs.filter((j) => j.systemId === system.id).slice(0, 3);
          return (
            <Card key={system.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>{system.acronym}</CardTitle>
                  <p className="text-xs text-muted-foreground">{feedsFor(system.id).map((c) => c.name).join(" · ")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/systems/$systemId" params={{ systemId: system.id }} search={{ view: "conmon" }}>
                      Open ConMon
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => pipeMut.mutate(system.id)} disabled={pipeMut.isPending}>
                    Run pipeline
                  </Button>
                  <Button size="sm" onClick={() => runMut.mutate(system.id)} disabled={runMut.isPending}>
                    Run ConMon
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {feedsFor(system.id).map((c) => {
                  const b = bindings.find((x) => x.connectorId === c.id);
                  const health = b ? bindingHealth(b) : "due";
                  return (
                    <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-secondary/60 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{b?.lastSummary || "Never collected."}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={health} />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => collectMut.mutate({ systemId: system.id, connector: c.id })}
                          disabled={collectMut.isPending || b?.status === "disabled"}
                        >
                          Collect
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togMut.mutate({ systemId: system.id, connectorId: c.id, enabled: b?.status !== "enabled" })}
                          disabled={togMut.isPending}
                        >
                          {b?.status === "disabled" ? "Enable" : "Disable"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {jobs.length ? (
                  <div className="pt-2 text-xs text-muted-foreground">
                    Last job: {jobs[0]?.summary}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium">Mapping catalog</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        A Config rule, Entra policy, Tenable plugin, or Splunk search has to resolve to an 800-53A objective. This is the product.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EVIDENCE_MAPPINGS.map((m) => (
          <Card key={m.source}>
            <CardContent className="space-y-2 pt-5">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium">{m.source}</div>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{m.confidence}%</span>
              </div>
              <div className="text-xs text-muted-foreground">{m.authority}</div>
              <div className="flex flex-wrap gap-2 font-mono text-[11px] text-primary">
                {m.controls.map((id) => (
                  <Link key={id} to="/controls/$controlId" params={{ controlId: id }}>
                    {id}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Primary automation set for AETHER-C2: {(DEFAULT_FEEDS["SYS-AETHER"] ?? []).map((id) => CONNECTORS.find((c) => c.id === id)?.name).join(", ")}.
        Cadence is shown on each feed. Run ConMon is user-initiated; scheduled due state is tracked per binding.
      </p>
    </div>
  );
}
