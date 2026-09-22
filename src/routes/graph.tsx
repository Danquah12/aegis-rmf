import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { buildOrchestratorView } from "@/lib/grc/orchestrator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/graph")({
  loader: () => getPortfolio(),
  component: GraphPage,
});

function color(kind: string) {
  switch (kind) {
    case "system":
      return "var(--color-info)";
    case "vuln":
    case "finding":
    case "poam":
      return "var(--color-other)";
    case "control":
      return "var(--color-partial)";
    default:
      return "var(--color-muted-foreground)";
  }
}

function GraphPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const [systemId, setSystemId] = useState("SYS-HELIOS");
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  const id = data.systems.some((s) => s.id === systemId) ? systemId : data.systems[0]?.id;
  const view = id ? buildOrchestratorView(data, id) : null;
  const byId = Object.fromEntries((view?.graphNodes ?? []).map((n) => [n.id, n]));
  const vulns = data.vulnerabilities.filter((v) => v.systemId === id);

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="Control knowledge graph"
        title="What threatens authorization"
        description="Live graph from the RMF orchestrator: system, assets, tailored controls, vulnerabilities, findings, and POA&M. The engine recommends; the AO is the official result."
      />
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {data.systems.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSystemId(s.id)}
            className={cn(
              "min-h-11 rounded-lg border px-4 py-3 text-left",
              s.id === id
                ? "border-primary bg-secondary text-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wide">{s.acronym}</span>
              <StatusBadge status={s.atoStatus} />
            </div>
            <div className="mt-1 font-display text-lg leading-tight text-foreground">{s.name}</div>
          </button>
        ))}
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <svg
            viewBox="0 0 640 420"
            className="h-auto w-full max-h-[28rem] bg-card"
            role="img"
            aria-label="Control knowledge graph"
          >
            {(view?.graphEdges ?? []).map((e) => {
              const n1 = byId[e.from];
              const n2 = byId[e.to];
              if (!n1 || !n2) return null;
              return (
                <line
                  key={`${e.from}-${e.to}`}
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                />
              );
            })}
            {(view?.graphNodes ?? []).map((n) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r="14" fill="var(--color-secondary)" stroke={color(n.kind)} strokeWidth="1.5" />
                <text
                  x={n.x}
                  y={n.y + 26}
                  textAnchor="middle"
                  fill="var(--color-foreground)"
                  fontSize="10"
                  fontFamily="IBM Plex Sans, sans-serif"
                >
                  {n.label}
                </text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>
      {view ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {view.normalizedControls}/{view.tailored} tailored controls mapped · {view.recommendation.headline}{" "}
          <Link to="/engine" search={{ system: id ?? "SYS-HELIOS" }} className="text-primary">
            Open orchestrator
          </Link>
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {vulns.map((v) => {
          const sys = data.systems.find((s) => s.id === v.systemId);
          const asset = data.assets.find((a) => a.id === v.assetId);
          return (
            <Card key={v.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs">{v.cve}</span>
                  <div className="flex gap-2">
                    {v.kev ? <StatusBadge status="KEV" /> : null}
                    <StatusBadge status={v.severity} />
                  </div>
                </div>
                <div className="text-sm">{v.title}</div>
                <p className="text-xs text-muted-foreground">
                  {sys?.acronym} · {asset?.name} · CVSS {v.cvss} · {v.controlIds.join(", ")}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
