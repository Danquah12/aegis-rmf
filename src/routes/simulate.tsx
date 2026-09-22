import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { WHATIF_SCENARIOS, atoImpactLabel } from "@/lib/grc/layer3";

export const Route = createFileRoute("/simulate")({
  loader: () => getPortfolio(),
  component: SimulatePage,
});

function SimulatePage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="What-if"
        title="Security simulator"
        description="Disable MFA, move a database, expose an API, replace EDR — on paper. Runs are recorded. The live system and the ATO are not."
      />
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {WHATIF_SCENARIOS.map((s) => {
          const sys = data.systems.find((x) => x.id === s.systemId);
          return (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{s.prompt}</p>
                <StatusBadge status={atoImpactLabel(s.atoImpact)} />
                <Button size="sm" asChild>
                  <Link to="/systems/$systemId" params={{ systemId: s.systemId }} search={{ view: "simulate" }}>
                    Run on {sys?.acronym ?? s.systemId}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <h2 className="mb-3 text-sm font-medium">Recorded runs</h2>
      {data.whatIfRuns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No simulations yet. Open a package and run a scenario.</p>
      ) : (
        <div className="space-y-2">
          {data.whatIfRuns.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-1 pt-5">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-sm font-medium">{r.scenario}</span>
                  <StatusBadge status={r.atoImpact} />
                </div>
                <p className="line-clamp-3 text-xs text-muted-foreground">{r.result}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
