import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { ADMIN_ROLES } from "@/lib/grc/layer3";
import { PROGRAMS } from "@/lib/grc/layer1";
import { ORG_KIND_LABEL, buildOrgPrepareView, isOrgUnitKind } from "@/lib/grc/phase0";

export const Route = createFileRoute("/admin")({
  loader: () => getPortfolio(),
  component: AdminPage,
});

function AdminPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;
  const orgView = buildOrgPrepareView(data);

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="Operations"
        title="Enterprise administration"
        description="RMF personas, routing, audit, retention, and tenants as directorate records. There is no login wall — this is not account authentication. The live role model lives on Organization Prepare."
        actions={
          <Button asChild className="min-h-11">
            <Link to="/prepare">Open Prepare</Link>
          </Button>
        }
      />
      <h2 className="mb-3 text-sm font-medium">Roles (RBAC / ABAC matrix)</h2>
      <div className="mb-8 grid gap-3 lg:grid-cols-2">
        {ADMIN_ROLES.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle>{r.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-muted-foreground">{r.persona}</div>
              <ul className="list-disc pl-4">
                {r.permissions.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">{r.notes}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-medium">Organization hierarchy</h2>
      <p className="mb-3 text-xs text-muted-foreground">{orgView.summary}</p>
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {orgView.units.map((o) => (
          <Card key={o.id}>
            <CardContent className="pt-5">
              <div className="text-sm font-medium">{o.name}</div>
              <div className="text-xs text-muted-foreground">
                {isOrgUnitKind(o.kind) ? ORG_KIND_LABEL[o.kind] : o.kind}
                {o.parentId ? ` · parent ${o.parentId}` : " · root"}
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {PROGRAMS.filter((p) => p.orgId === o.id).map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-medium">Personnel</h2>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="py-2 pr-3 font-medium">Name</th>
              <th className="py-2 pr-3 font-medium">Role</th>
              <th className="py-2 font-medium">Title</th>
            </tr>
          </thead>
          <tbody>
            {data.personnel.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="py-2 pr-3">{p.name}</td>
                <td className="py-2 pr-3">{p.role}</td>
                <td className="py-2 text-muted-foreground">{p.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mb-3 text-sm font-medium">Immutable audit</h2>
      <div className="mb-8 space-y-2">
        {data.auditEvents.slice(0, 12).map((e) => (
          <div key={e.id} className="rounded-md bg-secondary/60 px-3 py-2 text-sm">
            <span className="font-mono text-[11px] text-muted-foreground">{e.id}</span> · {e.actor} · {e.action} · {e.object}
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Classification", "CUI default on evidence and SSP"],
          ["Retention", "Authorization packages 7 years after expiration"],
          ["Backup", "Nightly snapshot of the system of record"],
          ["API", "OSCAL export + collection plane. No machine ATO."],
          ["Workflow routing", "ISSO → SCA → ISSM → AO → ConMon"],
          ["Multi-tenant", "Directorate / program isolation in the registry"],
        ].map(([t, d]) => (
          <Card key={t}>
            <CardContent className="pt-5">
              <div className="text-sm font-medium">{t}</div>
              <p className="mt-1 text-xs text-muted-foreground">{d}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

