import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { LifecycleStrip } from "@/components/grc/lifecycle-strip";
import { Meter } from "@/components/grc/meter";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { stepProgress } from "@/lib/grc/layer1";
import { packageCompleteness, authorizationType } from "@/lib/grc/package";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/ato")({
  loader: () => getPortfolio(),
  component: AtoPage,
});

function AtoPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div>
      <PageHeader
        kicker="Authorizing official"
        title="ATO"
        description="Decision center for every package. Agents assemble SSP, SAP, SAR, POA&M, and evidence. The AO decides."
      />
      <div className="space-y-4">
        {data.systems.map((system) => {
          const complete = packageCompleteness(data, system.id);
          const steps = stepProgress(data, system.id);
          const history = data.authorizationHistory.filter((h) => h.systemId === system.id);
          return (
            <Card key={system.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>{system.acronym}</CardTitle>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={authorizationType(system)} />
                    <StatusBadge status={system.atoStatus} />
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="font-mono text-sm tabular-nums text-foreground">{complete.overall}%</div>
                  package
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <LifecycleStrip steps={steps} compact />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Meter value={complete.implementation} label="Implementation" />
                  <Meter value={complete.assessment} label="Assessment" />
                  <Meter value={complete.evidence} label="Evidence" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Last decision: {history[0]?.decision.replaceAll("_", " ") ?? "none"} · expires{" "}
                  {system.atoExpires ? formatDate(system.atoExpires) : "—"}
                </div>
                <Button size="sm" asChild>
                  <Link to="/systems/$systemId" params={{ systemId: system.id }} search={{ view: "ato" }}>
                    Open decision center
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
