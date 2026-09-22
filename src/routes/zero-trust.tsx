import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/grc/page-header";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZT_PILLARS } from "@/lib/grc/layer3";

export const Route = createFileRoute("/zero-trust")({
  component: ZeroTrustPage,
});

function ZeroTrustPage() {
  return (
    <div className="min-w-0">
      <PageHeader
        kicker="CISA pillars"
        title="Zero Trust"
        description="Identity, devices, network, applications, data, visibility, and automation — each mapped to 800-53. Coverage is evidence-backed, not a maturity slogan."
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {ZT_PILLARS.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <CardTitle>{p.name}</CardTitle>
              <StatusBadge status={p.coverage} />
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{p.summary}</p>
              <div className="flex flex-wrap gap-2">
                {p.controls.map((id) => (
                  <Link key={id} to="/controls/$controlId" params={{ controlId: id }} className="font-mono text-[11px] text-primary">
                    {id}
                  </Link>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{p.evidence}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
