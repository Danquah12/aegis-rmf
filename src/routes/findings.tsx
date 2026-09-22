import { createFileRoute, Link } from "@tanstack/react-router";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { rmfStepForControl } from "@/lib/grc/cycle";

export const Route = createFileRoute("/findings")({
  loader: () => getPortfolio(),
  component: FindingsPage,
});

function FindingsPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div>
      <PageHeader
        kicker="Findings and vulnerabilities"
        title="Findings"
        description="Assessment findings and scanner vulnerabilities bound to systems, assets, and 800-53 controls. The assessment pipeline opens findings for other-than-satisfied; it never closes a POA&M or issues an ATO."
        actions={
          <Button variant="outline" asChild>
            <Link to="/assessments">Assessment pipeline</Link>
          </Button>
        }
      />
      <h2 className="mb-3 text-sm font-medium">Assessment findings</h2>
      <div className="mb-8 space-y-3">
        {data.findings.map((f) => {
          const sys = data.systems.find((s) => s.id === f.systemId);
          return (
            <Card key={f.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs">
                    {f.id} · {sys?.acronym} · {f.controlId}
                  </span>
                  <div className="flex gap-2">
                    <CycleBadge step={rmfStepForControl(f.controlId)} />
                    <StatusBadge status={f.severity} />
                    <StatusBadge status={f.status} />
                  </div>
                </div>
                <div className="text-sm font-medium">{f.title}</div>
                <p className="text-sm text-muted-foreground">{f.description}</p>
                <p className="text-xs text-muted-foreground">{f.impact}</p>
                <Link
                  to="/systems/$systemId"
                  params={{ systemId: f.systemId }}
                  search={{ view: "poam" }}
                  className="text-xs text-primary"
                >
                  Open system
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <h2 className="mb-3 text-sm font-medium">Vulnerabilities</h2>
      <div className="space-y-3">
        {data.vulnerabilities.map((v) => {
          const sys = data.systems.find((s) => s.id === v.systemId);
          const asset = data.assets.find((a) => a.id === v.assetId);
          return (
            <Card key={v.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs">
                    {v.cve} · {sys?.acronym} · {asset?.name}
                  </span>
                  <div className="flex gap-2">
                    <StatusBadge status={v.severity} />
                    {v.kev ? <StatusBadge status="KEV" /> : null}
                    <StatusBadge status={v.status} />
                  </div>
                </div>
                <div className="text-sm">{v.title}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  CVSS {v.cvss} · {v.controlIds.join(" ")}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
