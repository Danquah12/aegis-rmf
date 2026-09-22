import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EngineRunner } from "@/components/grc/engine-runner";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";

type Search = { system?: string };

export const Route = createFileRoute("/engine")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    system: typeof search.system === "string" ? search.system : undefined,
  }),
  loader: () => getPortfolio(),
  component: EnginePage,
});

function EnginePage() {
  const initial = Route.useLoaderData();
  const { system: searchSystem } = Route.useSearch();
  const navigate = useNavigate({ from: "/engine" });
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  const systemId =
    searchSystem && data.systems.some((s) => s.id === searchSystem) ? searchSystem : "SYS-HELIOS";

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="Standalone RMF orchestrator"
        title="RMF engine"
        description="AegisRMF is the system of record. No eMASS, CSAM, or Xacta required. Scanners attach as TEST feeds. The 800-53A engine recommends. The authorizing official is the only official result."
      />
      <EngineRunner
        data={data}
        systemId={systemId}
        onSystem={(id) => {
          void navigate({ search: { system: id } });
        }}
      />
    </div>
  );
}
