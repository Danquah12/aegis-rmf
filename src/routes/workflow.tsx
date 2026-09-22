import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { PageHeader } from "@/components/grc/page-header";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio, runPackage, advanceWorkflow } from "@/lib/grc/queries";
import { currentGate, packageCompleteness, WORKFLOW_GATES } from "@/lib/grc/package";

export const Route = createFileRoute("/workflow")({
  loader: () => getPortfolio(),
  component: WorkflowPage,
});

function WorkflowPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const qc = useQueryClient();

  const runMut = useMutation({
    mutationFn: (systemId: string) => runPackage({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Package run staged (${res.completeness}% complete)`);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });

  const signMut = useMutation({
    mutationFn: (input: { systemId: string; gate: "isso_submit" | "ao_decision" }) =>
      advanceWorkflow({
        data: {
          systemId: input.systemId,
          gate: input.gate,
          notes: input.gate === "ao_decision" ? "AO residual-risk acceptance." : "ISSO package submit.",
        },
      }),
    onSuccess: () => {
      toast.success("Signature recorded");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  const pending = data.agentRuns.filter((r) => r.status === "pending_approval");

  return (
    <div>
      <PageHeader
        kicker="ISSO → SCA → ISSM → AO"
        title="Workflow"
        description="eMASS package workflow with human signatures. Agents assemble the package; they do not authorize."
        actions={
          <Button asChild>
            <Link to="/engine">Run engine</Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {WORKFLOW_GATES.filter((g) => g.id !== "conmon").map((g) => {
          const n = data.systems.filter((s) => currentGate(s) === g.id).length;
          return (
            <Card key={g.id}>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground">{g.actor}</div>
                <div className="text-sm font-medium">{g.label}</div>
                <div className="mt-2 font-display text-2xl tabular-nums">{n}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-3">
        {data.systems.map((system) => {
          const gate = currentGate(system);
          const complete = packageCompleteness(data, system.id);
          const events = data.workflowEvents.filter((e) => e.systemId === system.id);
          return (
            <Card key={system.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>{system.acronym}</CardTitle>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={system.atoStatus} />
                    <CycleBadge step={system.rmfStep} />
                    <StatusBadge status={WORKFLOW_GATES.find((g) => g.id === gate)?.label ?? gate} />
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="font-mono text-sm tabular-nums text-foreground">{complete.overall}%</div>
                  package
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Last event: {events.at(-1)?.action ?? "None"} · {events.at(-1)?.actor ?? "—"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => runMut.mutate(system.id)} disabled={runMut.isPending}>
                    Run package
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/assessments">Run assessment pipeline</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => signMut.mutate({ systemId: system.id, gate: "isso_submit" })}
                  >
                    ISSO submit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => signMut.mutate({ systemId: system.id, gate: "ao_decision" })}
                  >
                    AO authorize
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/systems/$systemId" params={{ systemId: system.id }} search={{ view: "ato" }}>
                      Open package
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium">Pending agent approvals</h2>
      <div className="space-y-3">
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No authorization-impacting agent runs waiting.</p>
        ) : (
          pending.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium capitalize">{r.agent}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 text-muted-foreground">{r.objective}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
