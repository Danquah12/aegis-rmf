import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { fismaMetrics } from "@/lib/grc/layer1";
import { PROGRAMS } from "@/lib/grc/layer1";
import { ORG_KIND_LABEL, isOrgUnitKind } from "@/lib/grc/phase0";

export const Route = createFileRoute("/reports")({
  loader: () => getPortfolio(),
  component: ReportsPage,
});

function ReportsPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;
  const m = fismaMetrics(data);

  return (
    <div>
      <PageHeader
        kicker="FISMA / IG"
        title="Reports"
        description="FISMA is the reporting and accountability layer — not the RMF itself. Agency schema first, then current reporting requirements, then system data. Do not treat a single frozen 'FISMA report' as universal. Humans still authorize. Agents never issue an ATO."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Systems" value={String(m.systems)} hint={`${m.authorized} authorized`} />
        <Stat label="Open POA&M" value={String(m.openPoams)} hint={`${m.overduePoams} overdue`} />
        <Stat label="Open findings" value={String(m.openFindings)} hint={`${m.criticalRisks} critical risks`} />
        <Stat label="Evidence current" value={`${m.evidenceCurrent}%`} hint="Collected within 7 days" />
        <Stat label="Incidents" value={String(data.incidents.length)} hint="RMF-mapped" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(["high", "moderate", "low"] as const).map((k) => (
              <div key={k} className="flex justify-between">
                <span className="capitalize">{k}</span>
                <span className="tabular-nums">{m.byImpact[k]}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By ATO status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(m.byAto).map(([k, n]) => (
              <StatusBadge key={k} status={`${k} ${n}`} />
            ))}
          </CardContent>
        </Card>
      </div>
      <h2 className="mt-8 mb-3 text-sm font-medium">Organizations and programs</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.organizations.map((o) => (
          <Card key={o.id}>
            <CardContent className="pt-5">
              <div className="text-sm font-medium">{o.name}</div>
              <div className="text-xs text-muted-foreground">
                {isOrgUnitKind(o.kind) ? ORG_KIND_LABEL[o.kind] : o.kind}
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {PROGRAMS.filter((p) => p.orgId === o.id).map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Package-level exports live on each{" "}
        <Link to="/systems" className="text-primary">
          system
        </Link>{" "}
        in SSP Studio (OSCAL JSON).
      </p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-3xl tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}
