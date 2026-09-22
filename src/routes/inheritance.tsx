import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AiAction } from "@/components/grc/ai-action";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { RichText } from "@/components/grc/rich-text";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio, decideInheritance } from "@/lib/grc/queries";
import { discoverInheritanceAi } from "@/lib/grc/ai";
import { buildControlRows, ccpKindLabel, COMMON_CONTROL_PROVIDERS } from "@/lib/grc/package";
import { useState } from "react";

export const Route = createFileRoute("/inheritance")({
  loader: () => getPortfolio(),
  component: InheritancePage,
});

function InheritancePage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const qc = useQueryClient();
  const [memo, setMemo] = useState<string | null>(null);
  const disc = useMutation({
    mutationFn: () => discoverInheritanceAi({ data: { systemId: "SYS-AETHER" } }),
    onSuccess: (res) => {
      if (res.ok) setMemo(res.text);
      else toast.error(res.error);
    },
  });
  const decide = useMutation({
    mutationFn: (input: { id: string; accept: boolean }) => decideInheritance({ data: input }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Inheritance ${res.status}. ATO unchanged.`);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div>
      <PageHeader
        kicker="Common control providers"
        title="Inheritance"
        description="eMASS-style control origination. Consumer packages inherit from enterprise ICAM, FedRAMP, CSP, SOC, and PMO authorizations — then overlay what they still own. Discovery proposals require a human accept."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <AiAction label="Discover inheritance" pending={disc.isPending} onClick={() => disc.mutate()} />
      </div>
      {memo ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Discovery (unofficial)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <RichText text={memo} />
            </div>
          </CardContent>
        </Card>
      ) : null}
      {data.inheritanceProposals.length ? (
        <div className="mb-8 space-y-3">
          <h2 className="text-sm font-medium">Human review queue</h2>
          {data.inheritanceProposals.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-5">
                <div>
                  <div className="text-sm font-medium">
                    {p.provider} → {p.controlId}
                  </div>
                  <p className="text-sm text-muted-foreground">{p.rationale}</p>
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">{p.systemId}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={p.status} />
                  {p.status === "proposed" ? (
                    <>
                      <Button size="sm" onClick={() => decide.mutate({ id: p.id, accept: true })} disabled={decide.isPending}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: p.id, accept: false })} disabled={decide.isPending}>
                        Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
      <div className="space-y-4">
        {COMMON_CONTROL_PROVIDERS.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>
                {p.acronym} · {p.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={ccpKindLabel(p.kind)} />
                <span className="text-xs text-muted-foreground">{p.authorization}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.controls.map((id) => (
                  <Link
                    key={id}
                    to="/controls/$controlId"
                    params={{ controlId: id }}
                    className="font-mono text-[11px] text-primary"
                  >
                    {id}
                  </Link>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {data.systems
                  .filter((s) => s.id !== p.systemId)
                  .map((s) => {
                    const used = buildControlRows(data, s.id).filter(
                      (r) => r.inheritedFrom === p.acronym,
                    );
                    return (
                      <Link
                        key={s.id}
                        to="/systems/$systemId"
                        params={{ systemId: s.id }}
                        search={{ view: "controls" }}
                        className="rounded-md bg-secondary/60 px-3 py-2 text-sm"
                      >
                        <div className="font-medium">{s.acronym}</div>
                        <div className="text-xs text-muted-foreground">
                          {used.length} inherited / hybrid
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
