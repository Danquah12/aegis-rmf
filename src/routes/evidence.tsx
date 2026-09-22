import { createFileRoute, Link } from "@tanstack/react-router";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/hooks/use-portfolio";
import { rmfStepForControl } from "@/lib/grc/cycle";
import { ARTIFACT_KINDS, artifactsFor } from "@/lib/grc/package";
import { EVIDENCE_MAPPINGS } from "@/lib/grc/mappings";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/evidence")({
  component: EvidencePage,
});

function EvidencePage() {
  const { data, isLoading, error } = usePortfolio();
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div>
      <PageHeader
        kicker="Authorization package"
        title="Artifacts"
        description="Required eMASS package documents plus the hashed evidence lake. Collectors and the assessment pipeline write evidence; ISSO/AO approve. SAP/SAR update when the pipeline runs."
        actions={
          <Button variant="outline" asChild>
            <Link to="/assessments">Assessment pipeline</Link>
          </Button>
        }
      />

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium">Package documents</h2>
        <div className="space-y-4">
          {data.systems.map((system) => {
            const arts = artifactsFor(data, system.id);
            const ready = arts.filter((a) => a.status !== "missing").length;
            return (
              <Card key={system.id}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to="/systems/$systemId"
                      params={{ systemId: system.id }}
                      search={{ view: "ssp" }}
                      className="text-sm font-medium"
                    >
                      {system.acronym}
                    </Link>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {ready}/{arts.length}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {arts.map((a) => (
                      <div key={a.id} className="rounded-md bg-secondary/60 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs">{a.title}</span>
                          <StatusBadge status={a.status} />
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {ARTIFACT_KINDS.find((k) => k.id === a.kind)?.oscal ?? "package"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium">Approved source mappings</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EVIDENCE_MAPPINGS.map((m) => (
            <Card key={m.source}>
              <CardContent className="pt-5">
                <div className="text-sm font-medium">{m.source}</div>
                <div className="mt-1 text-xs text-muted-foreground">{m.authority}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.controls.map((id) => (
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
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <h2 className="mb-3 text-sm font-medium">Evidence lake</h2>
      <div className="space-y-3">
        {data.evidence.map((e) => {
          const sys = data.systems.find((s) => s.id === e.systemId);
          return (
            <Card key={e.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {e.id} · {sys?.acronym} · {e.controlId}
                  </span>
                  <div className="flex gap-2">
                    <CycleBadge step={rmfStepForControl(e.controlId)} />
                    <StatusBadge status={e.method} />
                    <StatusBadge status={e.classification} />
                  </div>
                </div>
                <div className="text-sm font-medium">{e.title}</div>
                <p className="text-sm text-muted-foreground">{e.summary}</p>
                <div className="text-[11px] text-muted-foreground">
                  {e.source} · collected {formatDate(e.collectedAt)} · {e.hash}
                  {e.expiresAt ? ` · expires ${formatDate(e.expiresAt)}` : ""}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
