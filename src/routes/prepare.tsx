import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { PrepareBoard } from "@/components/grc/prepare-board";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";

export const Route = createFileRoute("/prepare")({
  loader: () => getPortfolio(),
  component: PreparePage,
});

function PreparePage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="SP 800-37 Rev. 2 · Organization-level Prepare"
        title="Organization preparation"
        description="Organization Prepare first. Then register an information system — discovery fills inventory from CMDB, cloud, identity, scanners, and pipelines. Humans still authorize. Agents never issue an ATO."
      />
      <PrepareBoard data={data} />
    </div>
  );
}
