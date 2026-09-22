import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio, recordIncidentPoam } from "@/lib/grc/queries";
import { PREDICTIVE_PATTERNS, RED_BLUE, atoImpactLabel } from "@/lib/grc/layer3";
import type { AtoImpact } from "@/lib/grc/layer3";

export const Route = createFileRoute("/incidents")({
  loader: () => getPortfolio(),
  component: IncidentsPage,
});

function IncidentsPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (incidentId: string) => recordIncidentPoam({ data: { incidentId } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Finding ${res.findingId} · ${res.poamId} opened. ATO unchanged.`);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="Incident → RMF"
        title="Incidents"
        description="Incident to affected assets, controls, residual risk, and optional POA&M. Confirmed deficiencies become findings — agents do not close them."
      />
      <div className="space-y-3">
        {data.incidents.map((i) => (
          <Card key={i.id}>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>{i.title}</CardTitle>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">{i.id} · {i.assetId}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={i.severity} />
                <StatusBadge status={i.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{i.summary}</p>
              <div className="flex flex-wrap gap-2">
                {i.controlIds.map((id) => (
                  <Link key={id} to="/controls/$controlId" params={{ controlId: id }} className="font-mono text-[11px] text-primary">
                    {id}
                  </Link>
                ))}
                <StatusBadge status={atoImpactLabel(i.atoImpact as AtoImpact)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => mut.mutate(i.id)}
                  disabled={mut.isPending || i.status === "poam_opened"}
                >
                  {i.status === "poam_opened" ? "POA&M already opened" : "Open POA&M from incident"}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/systems/$systemId" params={{ systemId: i.systemId }} search={{ view: "poam" }}>
                    Package POA&M
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mt-8 mb-3 text-sm font-medium">Predictive patterns</h2>
      <p className="mb-3 text-xs text-muted-foreground">Supporting evidence, not an unexplained score.</p>
      <div className="space-y-3">
        {PREDICTIVE_PATTERNS.map((p) => (
          <Card key={p.id}>
            <CardContent className="space-y-1 pt-5">
              <div className="text-sm font-medium">{p.title}</div>
              <p className="text-sm text-muted-foreground">{p.evidence}</p>
              <div className="text-xs text-muted-foreground">{p.trend}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mt-8 mb-3 text-sm font-medium">Red / blue simulation</h2>
      <p className="mb-3 text-xs text-muted-foreground">Authorized environments only. Simulation does not change ATO.</p>
      {RED_BLUE.map((s) => (
        <Card key={s.id}>
          <CardContent className="space-y-2 pt-5 text-sm">
            <div className="font-medium">{s.title}</div>
            <p><span className="text-muted-foreground">Red · </span>{s.red}</p>
            <p><span className="text-muted-foreground">Blue · </span>{s.blue}</p>
            <p><span className="text-muted-foreground">RMF · </span>{s.rmf}</p>
            <p className="text-xs text-muted-foreground">{s.atoNote}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
