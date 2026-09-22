import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { RiskHeatmap } from "@/components/grc/risk-heatmap";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio, acceptRisk } from "@/lib/grc/queries";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/risk")({
  loader: () => getPortfolio(),
  component: RiskPage,
});

function RiskPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (id: string) => acceptRisk({ data: { id, expires: "2027-01-23", notes: "AO residual-risk acceptance." } }),
    onSuccess: () => {
      toast.success("Risk acceptance logged");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div>
      <PageHeader
        kicker="Risk register"
        title="Risk"
        description="Threat × vulnerability × asset, scored for residual risk. Agents identify. Owners mitigate. The AO accepts."
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Heat map</CardTitle>
        </CardHeader>
        <CardContent>
          <RiskHeatmap risks={data.risks} />
        </CardContent>
      </Card>
      <div className="space-y-3">
        {data.risks.map((r) => {
          const sys = data.systems.find((s) => s.id === r.systemId);
          return (
            <Card key={r.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {r.id} · {sys?.acronym} · {r.controlId}
                    </div>
                    <div className="text-sm font-medium">{r.title}</div>
                    <p className="text-sm text-muted-foreground">
                      {r.threat} / {r.vulnerability}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={r.riskLevel} />
                    <StatusBadge status={r.status} />
                  </div>
                </div>
                <p className="text-sm">{r.mitigation}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/systems/$systemId" params={{ systemId: r.systemId }} search={{ view: "risk" }}>
                      Open system
                    </Link>
                  </Button>
                  {r.status !== "accepted" && r.status !== "closed" ? (
                    <Button size="sm" onClick={() => mut.mutate(r.id)} disabled={mut.isPending}>
                      AO accept
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Expires {r.acceptanceExpires ? formatDate(r.acceptanceExpires) : "—"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
