import { createFileRoute } from "@tanstack/react-router";
import { SystemHub } from "@/components/grc/system-hub";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { isSystemView, type SystemViewId } from "@/lib/grc/layer1";
import { isPackageModule, type PackageModuleId } from "@/lib/grc/package";

type Search = { view?: SystemViewId; module?: PackageModuleId };

export const Route = createFileRoute("/systems/$systemId")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    view: isSystemView(search.view) ? search.view : undefined,
    module: isPackageModule(search.module) ? search.module : undefined,
  }),
  loader: () => getPortfolio(),
  component: SystemDetail,
});

function SystemDetail() {
  const { systemId } = Route.useParams();
  const { view, module } = Route.useSearch();
  const navigate = Route.useNavigate();
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;
  const system = data.systems.find((s) => s.id === systemId);
  if (!system) return <ErrorState>System not found in the registry.</ErrorState>;

  return (
    <SystemHub
      data={data}
      systemId={systemId}
      view={view ?? "overview"}
      module={module}
      onView={(next) => {
        void navigate({ search: { view: next, module } });
      }}
      onModule={(next) => {
        void navigate({ search: { view: "package", module: next } });
      }}
    />
  );
}
