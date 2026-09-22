import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";

export const Route = createFileRoute("/vulnerabilities")({
  loader: () => getPortfolio(),
  component: VulnerabilitiesPage,
});

function VulnerabilitiesPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;
  const kev = data.vulnerabilities.filter((v) => v.kev);
  const open = data.vulnerabilities.filter((v) => v.status === "open");

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="RA-5 · SI-2"
        title="Vulnerabilities"
        description="Scanner findings bound to assets, 800-53 controls, and POA&M. KEV items demand emergency treatment — they are not just inventory."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-muted-foreground">Open</div>
            <div className="font-display text-3xl tabular-nums">{open.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-muted-foreground">KEV</div>
            <div className="font-display text-3xl tabular-nums">{kev.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-xs text-muted-foreground">Mapped controls</div>
            <div className="font-display text-3xl tabular-nums">
              {new Set(data.vulnerabilities.flatMap((v) => v.controlIds)).size}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        {data.vulnerabilities.map((v) => {
          const sys = data.systems.find((s) => s.id === v.systemId);
          const asset = data.assets.find((a) => a.id === v.assetId);
          return (
            <Card key={v.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs">
                    {v.cve} · {sys?.acronym} · {asset?.name}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={v.severity} />
                    {v.kev ? <StatusBadge status="KEV" /> : null}
                    <StatusBadge status={v.status} />
                  </div>
                </div>
                <div className="text-sm font-medium">{v.title}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  CVSS {v.cvss} · {v.controlIds.join(" ")}
                </div>
                <Link
                  to="/systems/$systemId"
                  params={{ systemId: v.systemId }}
                  search={{ view: "conmon" }}
                  className="text-xs text-primary"
                >
                  Open ConMon
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
