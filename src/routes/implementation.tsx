import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ImplGrid } from "@/components/grc/impl-grid";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { PageHeader } from "@/components/grc/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { buildControlRows } from "@/lib/grc/package";
import type { Origination } from "@/lib/grc/types";

export const Route = createFileRoute("/implementation")({
  loader: () => getPortfolio(),
  component: ImplementationPage,
});

function ImplementationPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const [q, setQ] = useState("");
  const [systemId, setSystemId] = useState<string>("all");
  const [origin, setOrigin] = useState<Origination | "all">("all");
  const [onlyGaps, setOnlyGaps] = useState(true);

  const rows = useMemo(() => {
    if (!data) return [];
    const systems = systemId === "all" ? data.systems : data.systems.filter((s) => s.id === systemId);
    return systems.flatMap((s) =>
      buildControlRows(data, s.id).map((r) => ({ ...r, systemId: s.id, acronym: s.acronym })),
    );
  }, [data, systemId]);

  const filtered = rows.filter((r) => {
    if (!r.selected) return false;
    if (origin !== "all" && r.origination !== origin) return false;
    if (onlyGaps && r.assessment === "satisfied" && r.implementation === "implemented") return false;
    if (onlyGaps && r.implementation === "inherited" && r.assessment === "satisfied") return false;
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return (
      r.controlId.toLowerCase().includes(query) ||
      r.title.toLowerCase().includes(query) ||
      r.statement.toLowerCase().includes(query)
    );
  });

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="eMASS · Control implementation"
        title="Control implementation"
        description="The live 800-53 implementation grid. Origination, assessment, evidence, and automation source — the table ISSOs live in, filled by agents instead of copy-paste."
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search control ID or statement"
          className="lg:max-w-sm"
        />
        <select
          value={systemId}
          onChange={(e) => setSystemId(e.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="all">All packages</option>
          {data.systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.acronym}
            </option>
          ))}
        </select>
        <select
          value={origin}
          onChange={(e) => setOrigin(e.target.value as Origination | "all")}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="all">All origination</option>
          <option value="system">System-specific</option>
          <option value="inherited">Inherited</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <button
          type="button"
          onClick={() => setOnlyGaps((v) => !v)}
          className="h-10 rounded-md bg-secondary px-3 text-sm"
        >
          {onlyGaps ? "Gaps only" : "All selected"}
        </button>
        <div className="self-center text-sm text-muted-foreground tabular-nums">
          {filtered.length} rows
        </div>
      </div>
      <Card>
        <CardContent className="p-0 pb-4">
          <ImplGrid rows={filtered} />
        </CardContent>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        Open a{" "}
        <Link to="/systems" className="text-primary">
          package
        </Link>{" "}
        and run the package engine to refresh assessment results from telemetry.
      </p>
    </div>
  );
}
