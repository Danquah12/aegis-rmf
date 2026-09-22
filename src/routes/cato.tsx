import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { CatoLoop } from "@/components/grc/cato-loop";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio, setCatoReview } from "@/lib/grc/queries";
import { catoHealth } from "@/lib/grc/layer3";
import type { CatoReviewState } from "@/lib/grc/types";

export const Route = createFileRoute("/cato")({
  loader: () => getPortfolio(),
  component: CatoPage,
});

function CatoPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (input: { systemId: string; state: CatoReviewState }) =>
      setCatoReview({
        data: {
          systemId: input.systemId,
          state: input.state,
          notes: "Human review recorded. Authorization history not modified by the engine.",
          actor: "ISSO",
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("cATO review recorded. ATO unchanged.");
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      }
    },
  });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="Continuous authorization"
        title="cATO engine"
        description="ATO → ConMon → change → impact → control evaluation → risk → human review → reassessment if needed → state recorded. The engine never issues an ATO."
      />
      <div className="space-y-6">
        {data.systems.map((s) => {
          const health = catoHealth(data, s.id);
          const reviews = data.catoReviews.filter((r) => r.systemId === s.id).slice(0, 3);
          const next: CatoReviewState =
            health.state === "reassess" ? "reassess" : health.state === "stable" ? "stable" : "review_required";
          return (
            <div key={s.id} className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium">{s.acronym}</h2>
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => mut.mutate({ systemId: s.id, state: next })} disabled={mut.isPending}>
                    Record human review
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/systems/$systemId" params={{ systemId: s.id }} search={{ view: "conmon" }}>
                      ConMon
                    </Link>
                  </Button>
                </div>
              </div>
              <CatoLoop health={health.state} reasons={health.reasons} />
              {reviews.length ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Reviews on file</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {reviews.map((r) => (
                      <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>{r.actor} · {r.notes}</span>
                        <StatusBadge status={r.state} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
