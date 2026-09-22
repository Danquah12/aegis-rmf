import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePortfolio } from "@/hooks/use-portfolio";
import { runNamedAgent } from "@/lib/grc/ai";
import { approveAgentRun } from "@/lib/grc/queries";
import { AGENTS, TOOL_REGISTRY } from "@/lib/grc/mappings";
import { rmfStepForAgent } from "@/lib/grc/cycle";
import { formatDate } from "@/lib/utils";
import { RichText } from "@/components/grc/rich-text";

export const Route = createFileRoute("/agents")({
  component: AgentsPage,
});

function AgentsPage() {
  const { data, isLoading, error } = usePortfolio();
  const qc = useQueryClient();
  const [agent, setAgent] = useState("assessment");
  const [systemId, setSystemId] = useState("SYS-AETHER");
  const [output, setOutput] = useState<string | null>(null);

  const runMut = useMutation({
    mutationFn: () => runNamedAgent({ data: { agent, systemId } }),
    onSuccess: (res) => {
      if (res.ok) {
        setOutput(res.text);
        toast.success("Agent run recorded");
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
    onError: () => toast.error("Agent run failed"),
  });

  const approveMut = useMutation({
    mutationFn: (input: { id: string; approve: boolean }) =>
      approveAgentRun({ data: input }),
    onSuccess: () => {
      toast.success("Decision recorded");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div>
      <PageHeader
        kicker="Control plane"
        title="Agents"
        description="Specialized agents with tool permissions, audit trails, and mandatory human approval for authorization-impacting actions."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dispatch</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1 text-xs text-muted-foreground">
            Agent
            <Select value={agent} onValueChange={setAgent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENTS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="flex-1 space-y-1 text-xs text-muted-foreground">
            System
            <Select value={systemId} onValueChange={setSystemId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.systems.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.acronym}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button onClick={() => runMut.mutate()} disabled={runMut.isPending}>
            {runMut.isPending ? "Running…" : "Run agent"}
          </Button>
        </CardContent>
        {output ? (
          <CardContent>
            <div className="max-h-80 overflow-auto rounded-lg bg-secondary/70 p-4">
              <RichText text={output} />
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a) => (
          <Card key={a.id}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  {a.lane}
                </div>
                <CycleBadge step={rmfStepForAgent(a.id)} />
              </div>
              <div className="mt-1 text-sm font-medium">{a.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{a.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-medium">Tool registry</h2>
      <div className="mb-8 flex flex-wrap gap-2">
        {TOOL_REGISTRY.map((t) => (
          <span
            key={t.id}
            className="rounded-md bg-secondary px-2 py-1 font-mono text-[11px] text-muted-foreground"
          >
            {t.id}
          </span>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-medium">Run history</h2>
      <div className="space-y-3">
        {data.agentRuns.map((run) => (
          <Card key={run.id}>
            <CardContent className="space-y-2 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{run.id}</div>
                  <div className="text-sm font-medium capitalize">{run.agent} · {run.objective}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CycleBadge step={rmfStepForAgent(run.agent)} />
                  <StatusBadge status={run.status} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{run.decision}</p>
              <div className="text-[11px] text-muted-foreground">
                {formatDate(run.createdAt)} · confidence {run.confidence}% · tools {run.tools.join(", ")}
              </div>
              {run.status === "pending_approval" ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveMut.mutate({ id: run.id, approve: true })}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => approveMut.mutate({ id: run.id, approve: false })}
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
