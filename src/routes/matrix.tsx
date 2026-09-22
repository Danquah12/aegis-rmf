import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MatrixBoard } from "@/components/grc/matrix-board";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { PageHeader } from "@/components/grc/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";

export const Route = createFileRoute("/matrix")({
  loader: () => getPortfolio(),
  component: MatrixPage,
});

function MatrixPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const [systemId, setSystemId] = useState(initial.systems[0]?.id ?? "SYS-HELIOS");
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;
  const current = data.systems.some((s) => s.id === systemId) ? systemId : data.systems[0]?.id;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="Technical requirements"
        title="Artifact matrix"
        description="RMF phase → NIST publication → task → artifact → agent → evidence → 800-53A procedure → human approval → OSCAL → FISMA → tables. Agency schemas vary. The engine does not issue an ATO."
        actions={
          <Select value={current} onValueChange={setSystemId}>
            <SelectTrigger className="min-h-11 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.systems.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.acronym}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      {current ? <MatrixBoard data={data} systemId={current} /> : <ErrorState>No system on the register.</ErrorState>}
    </div>
  );
}
