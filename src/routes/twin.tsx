import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { TwinLegend, TwinMap } from "@/components/grc/twin-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { twinFor } from "@/lib/grc/layer3";

export const Route = createFileRoute("/twin")({
  loader: () => getPortfolio(),
  component: TwinPage,
});

function TwinPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="Digital twin"
        title="System twins"
        description="Live graph of applications, servers, containers, networks, databases, cloud, data, users, controls, and vulnerabilities — bound to the authorization boundary."
      />
      <div className="space-y-6">
        {data.systems.map((s) => {
          const twin = twinFor(s.id);
          return (
            <Card key={s.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>{s.acronym}</CardTitle>
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                </div>
                <Link
                  to="/systems/$systemId"
                  params={{ systemId: s.id }}
                  search={{ view: "twin" }}
                  className="text-xs text-primary"
                >
                  Open system twin
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                <TwinMap nodes={twin.nodes} edges={twin.edges} systemId={s.id} />
                <TwinLegend />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
