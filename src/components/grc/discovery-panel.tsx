import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/grc/status-badge";
import { UnderstandingCard } from "@/components/grc/matrix-board";
import { applyDiscovery } from "@/lib/grc/queries";
import {
  DISCOVERY_SOURCES,
  discoverInventory,
  PHASE1_ARTIFACTS,
  type DiscoveryDraft,
} from "@/lib/grc/discovery";
import { canPerform } from "@/lib/grc/phase0";
import { useActingRole } from "@/hooks/use-acting-role";
import type { PortfolioSnapshot, SystemRecord } from "@/lib/grc/types";
import { cn } from "@/lib/utils";

export function DiscoveryPreview({
  name,
  acronym,
  mission,
}: {
  name: string;
  acronym: string;
  mission: string;
}) {
  const draft = useMemo(
    () => discoverInventory({ name, acronym, mission }),
    [name, acronym, mission],
  );
  return <DiscoveryBody draft={draft} />;
}

export function SystemDiscoveryPanel({
  data,
  system,
}: {
  data: PortfolioSnapshot;
  system: SystemRecord;
}) {
  const { roleId, role } = useActingRole();
  const qc = useQueryClient();
  const draft = useMemo(
    () =>
      discoverInventory({
        name: system.name,
        acronym: system.acronym,
        mission: system.mission,
        existing: system,
      }),
    [system],
  );
  const assets = data.assets.filter((a) => a.systemId === system.id);
  const allowed = canPerform(roleId, "system.create") || canPerform(roleId, "control.implement");
  const mut = useMutation({
    mutationFn: () => applyDiscovery({ data: { systemId: system.id, actingRole: roleId } }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Discovery failed"),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.statement);
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Discovery engine</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Builds the system inventory from CMDB, cloud, identity, scanners, and pipelines. Do not type every CI.
          Discovery is unofficial until the system owner confirms. It does not issue an ATO.
        </p>
        {system.extra.discoveryAt ? (
          <p className="text-xs text-muted-foreground">
            Last run {system.extra.discoveryAt.slice(0, 10)} · {assets.length} CIs on the register ·{" "}
            {(system.extra.discoverySources ?? []).length} collectors.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No discovery pass on this boundary yet.</p>
        )}
        <DiscoveryBody draft={draft} />
        <UnderstandingCard data={data} systemId={system.id} />
        <div className="flex flex-wrap gap-2">
          <Button className="min-h-11" disabled={!allowed || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? "Discovering…" : "Run discovery"}
          </Button>
        </div>
        {!allowed ? (
          <p className="text-xs text-muted-foreground">
            Acting as {role.name}. Switch to System Owner, ISSO, or CIO to apply inventory.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DiscoveryBody({ draft }: { draft: DiscoveryDraft }) {
  const [sourceId, setSourceId] = useState(
    draft.hits.find((h) => h.status === "connected")?.sourceId ?? "cmdb",
  );
  const hit = draft.hits.find((h) => h.sourceId === sourceId) ?? draft.hits[0];
  const source = DISCOVERY_SOURCES.find((s) => s.id === sourceId);
  const sourceAssets = draft.assets.filter((a) => a.sourceId === sourceId);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 text-sm">
        <Fact label="Hosting" value={`${draft.hosting} · ${draft.cloudProvider}`} />
        <Fact label="Business function" value={draft.businessFunction} />
        <Fact label="Users" value={draft.users} />
        <Fact label="Locations" value={draft.geographicLocations.join(" · ")} />
        <Fact label="Applications" value={draft.applications.join(" · ")} />
        <Fact label="Infrastructure" value={draft.infrastructure.join(" · ")} />
        <Fact label="Dependencies" value={draft.dependencies.join(" · ")} />
        <Fact label="Data types" value={draft.dataTypes.join(" · ")} />
      </div>
      <p className="text-xs text-muted-foreground">{draft.authorizationBoundary}</p>
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {DISCOVERY_SOURCES.map((s) => {
          const h = draft.hits.find((x) => x.sourceId === s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSourceId(s.id)}
              className={cn(
                "flex min-h-11 min-w-28 shrink-0 flex-col justify-center rounded-lg border px-3 py-2 text-left",
                sourceId === s.id
                  ? "border-primary bg-secondary text-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <span className="text-xs font-medium text-foreground">{s.name}</span>
              <span className="font-mono text-[11px] tabular-nums">
                {h?.status ?? "empty"} · {h?.assetCount ?? 0}
              </span>
            </button>
          );
        })}
      </div>
      {hit && source ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <StatusBadge status={hit.status} />
          <span>
            {source.finds}. {hit.summary}
          </span>
        </div>
      ) : null}
      {sourceAssets.length ? (
        <ul className="space-y-1 text-sm">
          {sourceAssets.map((a) => (
            <li key={a.name} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{a.name}</span>
              <Badge variant="outline">{a.kind}</Badge>
              <span className="text-xs text-muted-foreground">{a.environment}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-1">
        {PHASE1_ARTIFACTS.map((a) => (
          <Badge key={a.id} variant="outline">
            {a.nistTask} {a.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div>{value || "—"}</div>
    </div>
  );
}
