import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { updatePoamStatus } from "@/lib/grc/queries";
import { rmfStepForPoam } from "@/lib/grc/cycle";
import { formatDate } from "@/lib/utils";
import type { PoamStatus } from "@/lib/grc/types";

export const Route = createFileRoute("/poam")({
  component: PoamPage,
});

function PoamPage() {
  const { data, isLoading, error } = usePortfolio();
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (input: { id: string; status: PoamStatus }) =>
      updatePoamStatus({ data: input }),
    onSuccess: () => {
      toast.success("POA&M status updated");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div>
      <PageHeader
        kicker="CA-5"
        title="Plan of action and milestones"
        description="Weaknesses, residual risk, and remediation. The assessment pipeline may open items; ISSOs own status. Agents never close a POA&M or accept residual risk."
        actions={
          <Button variant="outline" asChild>
            <Link to="/assessments">Assessment pipeline</Link>
          </Button>
        }
      />
      <div className="space-y-3">
        {data.poams.map((p) => {
          const sys = data.systems.find((s) => s.id === p.systemId);
          const overdue = new Date(p.dueDate).getTime() < Date.now() && p.status !== "completed";
          return (
            <Card key={p.id}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {p.id} · {sys?.acronym} · {p.controlId}
                    </div>
                    <p className="mt-1 max-w-3xl text-sm">{p.weakness}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CycleBadge step={rmfStepForPoam(p.controlId, p.status)} />
                    <StatusBadge status={p.riskLevel} />
                    <StatusBadge status={p.status} />
                    {overdue ? <StatusBadge status="overdue" /> : null}
                  </div>
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <div>Owner {p.owner}</div>
                  <div className="tabular-nums">Due {formatDate(p.dueDate)}</div>
                  <div className="tabular-nums">Open {p.daysOpen} days</div>
                </div>
                {p.compensating ? (
                  <div className="text-xs">
                    Compensating control: {p.compensating}
                  </div>
                ) : null}
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {p.milestones.map((m) => (
                    <li key={m.label} className="flex gap-2">
                      <span className="font-mono tabular-nums">{formatDate(m.date)}</span>
                      <span>{m.done ? "Done" : "Open"} — {m.label}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link to="/systems/$systemId" params={{ systemId: p.systemId }}>
                      Open system
                    </Link>
                  </Button>
                  {p.status !== "completed" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => mut.mutate({ id: p.id, status: "completed" })}
                    >
                      Mark complete
                    </Button>
                  ) : null}
                  {p.status === "open" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => mut.mutate({ id: p.id, status: "risk_accepted" })}
                    >
                      Recommend risk acceptance
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
