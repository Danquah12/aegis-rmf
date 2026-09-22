import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Meter } from "@/components/grc/meter";
import { StatusBadge } from "@/components/grc/status-badge";
import { addOrgArtifactKind, publishOrgRmfBaseline, saveOrgArtifact, saveOrgRmfBaseline } from "@/lib/grc/queries";
import {
  activeOrgBaseline,
  comparePhase0Artifacts,
  coversKind,
  PHASE0_AI_ACTIVITIES,
  PHASE0_CATALOG,
  runPhase0Ai,
  type Phase0AiId,
} from "@/lib/grc/phase0-artifacts";
import { canPerform, roleById } from "@/lib/grc/phase0";
import { useActingRole } from "@/hooks/use-acting-role";
import type { PortfolioSnapshot } from "@/lib/grc/types";
import { cn } from "@/lib/utils";

export function Phase0ArtifactsPanel({ data }: { data: PortfolioSnapshot }) {
  const qc = useQueryClient();
  const { roleId, role } = useActingRole();
  const view = useMemo(() => comparePhase0Artifacts(data), [data]);
  const baseline = useMemo(() => activeOrgBaseline(data), [data]);
  const firstGap = view.gaps[0]?.id ?? view.kinds[0]?.id ?? "ispp";
  const [kindId, setKindId] = useState(firstGap);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [controlIds, setControlIds] = useState("");
  const [url, setUrl] = useState("");
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [stageId, setStageId] = useState(baseline.stages[6]?.id ?? "methodology");
  const [agencyName, setAgencyName] = useState("");
  const [agencyAliases, setAgencyAliases] = useState("");
  const [agencyCanon, setAgencyCanon] = useState("isp");
  const [agencyLabel, setAgencyLabel] = useState("ANMA");
  const [agencyRequired, setAgencyRequired] = useState(false);

  const kind = view.kinds.find((k) => k.id === kindId) ?? view.kinds[0];
  const docs = view.artifacts.filter((a) => a.kindId === kind?.id);
  const orgId = data.organizations.find((o) => o.kind === "security_program")?.id ?? "ORG-SEC";

  const saveMut = useMutation({
    mutationFn: () =>
      saveOrgArtifact({
        data: {
          kindId: kind.id,
          orgId,
          title,
          body,
          controlIds,
          url: url || undefined,
        },
      }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Save failed"),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Phase 0 artifact attached. Engine compares it on Prepare.");
      setTitle("");
      setBody("");
      setControlIds("");
      setUrl("");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  const kindMut = useMutation({
    mutationFn: () =>
      addOrgArtifactKind({
        data: {
          name: agencyName,
          aliases: agencyAliases,
          canonicalId: agencyCanon,
          required: agencyRequired,
          agency: agencyLabel,
        },
      }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Save failed"),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Agency-specific requirement added.");
      setAgencyName("");
      setAgencyAliases("");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  const baselineMut = useMutation({
    mutationFn: () => saveOrgRmfBaseline({ data: { actingRole: roleId } }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Baseline failed"),
    onSuccess: (res) => {
      if (!res.ok) return;
      setAiNote(res.baseline.statement);
      toast.success("Organizational RMF baseline rebuilt. Unofficial.");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  const publishMut = useMutation({
    mutationFn: () => publishOrgRmfBaseline({ data: { actingRole: roleId } }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Publish failed"),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Org baseline published. Not an ATO.");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  function runAi(activity: Phase0AiId) {
    if (activity === "baseline") {
      baselineMut.mutate();
      return;
    }
    const result = runPhase0Ai(data, activity, { title, body, kindId: kind.id });
    setAiNote(result.summary);
    if (result.kindId) setKindId(result.kindId);
    if (result.controlIds?.length) setControlIds(result.controlIds.join(", "));
    if (result.title) setTitle(result.title);
    if (result.body) setBody(result.body);
  }

  if (!kind) return null;
  const owner = roleById(kind.ownerRole);
  const attached = coversKind(view.kinds, view.artifacts, kind);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>3 · Phase 0 artifacts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Organizational governance documents for Prepare. The catalog is NIST-aligned. Agencies add their own
          names and templates. The engine compares coverage on Prepare. Humans still publish; agents never issue an
          ATO.
        </p>
        <Meter
          value={view.percent}
          label={`Required artifacts attached (${view.covered}/${view.required})`}
        />

        <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium">Organizational RMF baseline</div>
            <StatusBadge status={baseline.status} />
            <Badge variant="outline">{baseline.defaultCadence}</Badge>
            {baseline.cadenceAssumed ? <Badge variant="other">Cadence assumed</Badge> : null}
          </div>
          <p className="text-sm">{baseline.statement}</p>
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {baseline.stages.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStageId(s.id)}
                className={cn(
                  "flex min-h-11 min-w-28 shrink-0 flex-col justify-center rounded-lg border px-3 py-2 text-left",
                  stageId === s.id
                    ? "border-primary bg-card text-foreground"
                    : "border-border bg-card/60 text-muted-foreground",
                )}
              >
                <span className="font-mono text-[11px] uppercase tracking-wide">
                  {i + 1}
                </span>
                <span className="text-xs font-medium text-foreground">{s.label}</span>
              </button>
            ))}
          </div>
          {baseline.stages.find((s) => s.id === stageId) ? (
            <p className="text-xs text-muted-foreground">
              {baseline.stages.find((s) => s.id === stageId)?.detail}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11"
              disabled={baselineMut.isPending}
              onClick={() => baselineMut.mutate()}
            >
              {baselineMut.isPending ? "Building…" : "Build org RMF baseline"}
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={publishMut.isPending || !canPerform(roleId, "policy.publish")}
              onClick={() => publishMut.mutate()}
            >
              {publishMut.isPending ? "Publishing…" : "Publish baseline"}
            </Button>
          </div>
          {!canPerform(roleId, "policy.publish") ? (
            <p className="text-xs text-muted-foreground">
              Acting as {role.name}. Switch to SAISO or CIO to publish. Publishing is not an ATO.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {PHASE0_AI_ACTIVITIES.filter((a) => a.id !== "baseline").map((a) => (
            <Button key={a.id} type="button" variant="outline" className="min-h-11" onClick={() => runAi(a.id)}>
              {a.label}
            </Button>
          ))}
        </div>
        {aiNote ? <p className="text-sm text-muted-foreground">{aiNote}</p> : (
          <p className="text-xs text-muted-foreground">
            The engine uses this organization's cadence. It does not assume every customer is quarterly.
          </p>
        )}

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {view.kinds.map((k) => {
            const ok = coversKind(view.kinds, view.artifacts, k);
            const count = view.artifacts.filter((a) => a.kindId === k.id).length;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  setKindId(k.id);
                  setControlIds(k.controlIds.join(", "));
                }}
                className={cn(
                  "flex min-h-11 min-w-36 shrink-0 flex-col justify-center rounded-lg border px-3 py-2 text-left",
                  kind.id === k.id
                    ? "border-primary bg-secondary text-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <span className="font-mono text-[11px] uppercase tracking-wide">
                  {k.nistTask}
                  {k.required ? "" : " · optional"}
                  {k.agency !== "NIST" ? ` · ${k.agency}` : ""}
                </span>
                <span className="font-display text-base leading-tight text-foreground">{k.name}</span>
                <span className="font-mono text-[11px] tabular-nums">
                  {ok ? "attached" : "gap"} · {count} docs
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={attached ? "attached" : "gap"} />
          {owner ? <Badge variant="outline">{owner.name}</Badge> : null}
          <span className="font-mono text-[11px] text-muted-foreground">{kind.controlIds.join(" ")}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {kind.hint}
          {kind.aliases ? ` Also known as: ${kind.aliases}.` : ""}
        </p>

        <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
          <div className="text-sm font-medium">Attach {kind.name}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="oa-title">Title</Label>
              <Input
                id="oa-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="min-h-11"
                placeholder={kind.name}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="oa-controls">Organization control IDs</Label>
              <Input
                id="oa-controls"
                value={controlIds}
                onChange={(e) => setControlIds(e.target.value)}
                className="min-h-11"
                placeholder={kind.controlIds.join(", ")}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="oa-body">Document text</Label>
            <Textarea
              id="oa-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Paste the program plan, policy, strategy, or architecture excerpt."
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="oa-url">Link (optional)</Label>
            <Input id="oa-url" value={url} onChange={(e) => setUrl(e.target.value)} className="min-h-11" />
          </div>
          <Button className="min-h-11" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? "Saving…" : `Attach to ${kind.name}`}
          </Button>
        </div>

        <div className="space-y-2">
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents on {kind.name} yet.</p>
          ) : (
            docs.map((d) => (
              <div key={d.id} className="rounded-md border border-border px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-medium">{d.title}</div>
                  <StatusBadge status={d.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.body}</p>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">{d.controlIds.join(" ")}</div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="text-sm font-medium">Agency-specific requirement</div>
          <p className="text-xs text-muted-foreground">
            Not every organization uses the NIST document name. Add the agency title and map it to a catalog kind.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="oa-agency-name">Agency document name</Label>
              <Input
                id="oa-agency-name"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="min-h-11"
                placeholder="Cybersecurity Discipline Implementation Plan"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="oa-agency">Agency</Label>
              <Input
                id="oa-agency"
                value={agencyLabel}
                onChange={(e) => setAgencyLabel(e.target.value)}
                className="min-h-11"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="oa-canon">Maps to catalog kind</Label>
              <Select value={agencyCanon} onValueChange={setAgencyCanon}>
                <SelectTrigger id="oa-canon" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASE0_CATALOG.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="oa-aliases">Aliases</Label>
              <Input
                id="oa-aliases"
                value={agencyAliases}
                onChange={(e) => setAgencyAliases(e.target.value)}
                className="min-h-11"
                placeholder="CDIP, CSIP"
              />
            </div>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={agencyRequired}
              onChange={(e) => setAgencyRequired(e.target.checked)}
              className="size-4"
            />
            Required for this agency
          </label>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={kindMut.isPending}
            onClick={() => kindMut.mutate()}
          >
            {kindMut.isPending ? "Saving…" : "Add agency requirement"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
