import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/grc/page-header";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CONTRACTS,
  DEVSECOPS_GATES,
  K8S_RESOURCES,
  SBOM_COMPONENTS,
  VENDORS,
} from "@/lib/grc/layer3";

export const Route = createFileRoute("/supply")({
  component: SupplyPage,
});

function SupplyPage() {
  return (
    <div className="min-w-0">
      <PageHeader
        kicker="SBOM · C-SCRM · K8s · DevSecOps"
        title="Supply chain and delivery"
        description="Software components, vendors, contracts, Kubernetes objects, and CI gates mapped onto 800-53. RMF-as-code stays OSCAL — not a shadow GRC."
      />
      <h2 className="mb-3 text-sm font-medium">SBOM</h2>
      <div className="mb-8 space-y-2">
        {SBOM_COMPONENTS.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-2 pt-5">
              <div>
                <div className="text-sm font-medium">{c.name} {c.version}</div>
                <div className="text-xs text-muted-foreground">{c.ecosystem} · {c.license} · {c.risk}</div>
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {c.controlIds.join(" ")}
                {c.vulnId ? ` · ${c.vulnId}` : ""}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-medium">Vendors</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {VENDORS.map((v) => (
          <Card key={v.id}>
            <CardHeader>
              <CardTitle>{v.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <div>{v.product} · {v.service}</div>
              <div>{v.data}</div>
              <p>{v.gap}</p>
              <StatusBadge status={v.risk} />
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-medium">Contract obligations</h2>
      <div className="mb-8 space-y-2">
        {CONTRACTS.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-5 text-sm">
              <div className="font-medium">{c.source}</div>
              <p className="text-muted-foreground">{c.obligation}</p>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">{c.controlIds.join(" ")} · {c.evidence}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-medium">Kubernetes → 800-53</h2>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="py-2 pr-3 font-medium">Kind</th>
              <th className="py-2 pr-3 font-medium">Name</th>
              <th className="py-2 pr-3 font-medium">Controls</th>
              <th className="py-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {K8S_RESOURCES.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-2 pr-3">{r.kind}</td>
                <td className="py-2 pr-3 font-mono text-xs">{r.name}</td>
                <td className="py-2 pr-3 font-mono text-[11px]">
                  {r.controls.map((id) => (
                    <Link key={id} to="/controls/$controlId" params={{ controlId: id }} className="mr-2 text-primary">
                      {id}
                    </Link>
                  ))}
                </td>
                <td className="py-2 text-xs text-muted-foreground">{r.finding ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mb-3 text-sm font-medium">DevSecOps gates / RMF-as-code</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {DEVSECOPS_GATES.map((g) => (
          <Card key={g.id}>
            <CardContent className="space-y-1 pt-5">
              <div className="flex justify-between gap-2">
                <span className="text-sm font-medium">{g.name}</span>
                <StatusBadge status={g.status} />
              </div>
              <div className="text-xs text-muted-foreground">{g.tool} · {g.controls.join(" ")}</div>
              <p className="text-sm text-muted-foreground">{g.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        OSCAL artifacts (system.oscal.json, profile.json, assessment.json) export from each package. CI validates them; CI does not authorize.
      </p>
    </div>
  );
}
