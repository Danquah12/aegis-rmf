import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/grc/page-header";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENTS } from "@/lib/grc/mappings";
import { CONNECTORS } from "@/lib/grc/layer1";
import { COMPLIANCE_PACKS } from "@/lib/grc/crosswalks";

export const Route = createFileRoute("/marketplace")({
  component: MarketplacePage,
});

function MarketplacePage() {
  return (
    <div>
      <PageHeader
        kicker="Packs · connectors · agents"
        title="Marketplace"
        description="Install compliance packs, collection connectors, assessment agents, training, and overlays. OSCAL is the exchange layer — packs should not lock you in."
      />
      <h2 className="mb-3 text-sm font-medium">Compliance packs</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMPLIANCE_PACKS.map((p) => (
          <Card key={p.id}>
            <CardContent className="space-y-2 pt-5">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium">{p.name}</div>
                <StatusBadge status={p.installed ? "installed" : "available"} />
              </div>
              <div className="text-xs text-muted-foreground">
                {p.authority} · {p.version} · {p.controls} controls
              </div>
              <p className="text-sm text-muted-foreground">{p.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 flex items-end justify-between gap-3 text-sm font-medium">
        Collectors
        <Link to="/integrations" className="text-xs text-primary">
          Open collection plane
        </Link>
      </h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONNECTORS.map((c) => (
          <Card key={c.id}>
            <CardContent className="space-y-1 pt-5">
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                {c.family} · {c.cadence}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">{c.controls.join(" ")}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-medium">Agents</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle>{a.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{a.summary}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
