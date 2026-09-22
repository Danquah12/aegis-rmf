import { createFileRoute, Link } from "@tanstack/react-router";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { Meter } from "@/components/grc/meter";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { familyHealth, systemSlice, usePortfolio } from "@/hooks/use-portfolio";
import { FAMILY_META } from "@/lib/grc/families";

export const Route = createFileRoute("/monitoring")({
  component: MonitoringPage,
});

function MonitoringPage() {
  const { data, isLoading, error } = usePortfolio();
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div>
      <PageHeader
        kicker="CA-7"
        title="Continuous monitoring"
        description="Control status from live telemetry — not the date of the last assessment package."
      />
      <div className="space-y-6">
        {data.systems.map((system) => {
          const slice = systemSlice(data, system.id);
          const families = familyHealth(slice.implementations, system.id);
          const red = families.filter((f) => f.score < 70);
          return (
            <Card key={system.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>{system.acronym}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Last evidence {slice.evidence[0]?.collectedAt?.slice(0, 10) ?? "—"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <CycleBadge step="monitor" />
                  <StatusBadge status={system.atoStatus} />
                  <Link
                    to="/systems/$systemId"
                    params={{ systemId: system.id }}
                    className="text-xs text-primary"
                  >
                    Open
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {families.map((f) => (
                  <Meter
                    key={f.family}
                    value={f.score}
                    label={`${f.family} ${FAMILY_META[f.family].name}`}
                  />
                ))}
              </CardContent>
              {red.length ? (
                <div className="px-5 pb-5 text-xs text-muted-foreground">
                  Below threshold: {red.map((f) => f.family).join(", ")}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
