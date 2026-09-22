import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { AttackPathCard } from "@/components/grc/attack-path";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { ATTACK_PATHS } from "@/lib/grc/layer3";

export const Route = createFileRoute("/attack")({
  loader: () => getPortfolio(),
  component: AttackPage,
});

function AttackPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="Attack path → ATO"
        title="Attack correlation"
        description="Vuln to asset to system to control to POA&M to authorization impact. Paths do not authorize, accept risk, or close POA&M."
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {ATTACK_PATHS.map((p) => (
          <div key={p.id} className="space-y-2">
            <AttackPathCard path={p} />
            <Link
              to="/systems/$systemId"
              params={{ systemId: p.systemId }}
              search={{ view: "attack" }}
              className="text-xs text-primary"
            >
              Open on package
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
