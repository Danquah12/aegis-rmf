import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AiAction } from "@/components/grc/ai-action";
import { BoundaryDesigner } from "@/components/grc/boundary-designer";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { ImplGrid } from "@/components/grc/impl-grid";
import { InheritanceGraph } from "@/components/grc/inheritance-graph";
import { LifecycleStrip } from "@/components/grc/lifecycle-strip";
import { Meter } from "@/components/grc/meter";
import { PackageWorkspace, isPackageModule } from "@/components/grc/package-workspace";
import { RichText } from "@/components/grc/rich-text";
import { RiskHeatmap } from "@/components/grc/risk-heatmap";
import { StatusBadge } from "@/components/grc/status-badge";
import { ActingAsPicker } from "@/components/grc/acting-as";
import { AssessmentPipeline } from "@/components/grc/assessment-pipeline";
import { SystemDiscoveryPanel } from "@/components/grc/discovery-panel";
import { AssessorView, AttackView, SimulateView, TwinView } from "@/components/grc/system-hub-l3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { systemSlice } from "@/hooks/use-portfolio";
import { analyzeImpact, analyzeReadiness, briefSystem, generateSsp, runAssessment, whatChangedAi, writeImplementation } from "@/lib/grc/ai";
import { CONTROL_BY_ID } from "@/lib/grc/catalog";
import {
  CONNECTORS,
  SYSTEM_VIEWS,
  ageDays,
  boundaryLayout,
  deriveObjectives,
  deriveSspSections,
  evidenceFreshness,
  orgOf,
  programOf,
  resultChoices,
  stepProgress,
  whatChangedSummary,
  type SystemViewId,
} from "@/lib/grc/layer1";
import { bindingHealth, feedsFor } from "@/lib/grc/collection";
import { evidenceQuality } from "@/lib/grc/layer3";
import { downloadOscal } from "@/lib/grc/oscal";
import { authorizationType, buildControlRows, impactTrio, packageCompleteness } from "@/lib/grc/package";
import {
  acceptRisk,
  collectFromConnector,
  recordAtoDecision,
  recordObjective,
  runConmon,
  saveSspSection,
  toggleConnector,
} from "@/lib/grc/queries";
import type { PackageModuleId } from "@/lib/grc/package";
import type { PortfolioSnapshot } from "@/lib/grc/types";
import { cn, formatDate } from "@/lib/utils";
import { useActingRole } from "@/hooks/use-acting-role";
import { canPerform } from "@/lib/grc/phase0";

const TREE: { view: SystemViewId; label: string }[] = [
  { view: "profile", label: "System profile" },
  { view: "profile", label: "Mission / owner / ISSO / ISSM / AO" },
  { view: "boundary", label: "Authorization boundary" },
  { view: "twin", label: "Digital twin" },
  { view: "attack", label: "Attack paths" },
  { view: "profile", label: "Data / users / components" },
  { view: "controls", label: "Controls" },
  { view: "assess", label: "Assessments" },
  { view: "assessor", label: "Assessor copilot" },
  { view: "evidence", label: "Evidence" },
  { view: "simulate", label: "What-if" },
  { view: "poam", label: "Findings / POA&M" },
  { view: "risk", label: "Risks" },
  { view: "ato", label: "Authorization" },
];

export function SystemHub({
  data,
  systemId,
  view,
  module,
  onView,
  onModule,
}: {
  data: PortfolioSnapshot;
  systemId: string;
  view: SystemViewId;
  module?: PackageModuleId;
  onView: (v: SystemViewId) => void;
  onModule: (m: PackageModuleId) => void;
}) {
  const slice = systemSlice(data, systemId);
  const system = slice.system;
  if (!system || !slice.readiness) return null;
  const cia = impactTrio(system);
  const steps = stepProgress(data, systemId);
  const complete = packageCompleteness(data, systemId);

  return (
    <div className="min-w-0 overflow-x-clip">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Information system · {orgOf(system)?.acronym ?? "ORG"} · {programOf(system)?.name ?? "Program"}
          </div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{system.acronym}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{system.name}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={authorizationType(system)} />
            <StatusBadge status={system.atoStatus} />
            <CycleBadge step={system.rmfStep} />
            <StatusBadge status={`C ${cia.confidentiality}`} />
            <StatusBadge status={`I ${cia.integrity}`} />
            <StatusBadge status={`A ${cia.availability}`} />
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl tabular-nums">{complete.overall}%</div>
          <div className="text-xs text-muted-foreground">Package completeness</div>
        </div>
      </div>

      <div className="mb-5">
        <LifecycleStrip steps={steps} />
      </div>

      <div className="mb-4 flex min-w-0 gap-1 overflow-x-auto pb-1">
        {SYSTEM_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onView(v.id)}
            className={cn(
              "flex min-h-11 shrink-0 items-center rounded-md px-3 text-xs transition-colors duration-150",
              view === v.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "overview" ? <Overview data={data} systemId={systemId} onView={onView} /> : null}
      {view === "profile" ? <Profile data={data} systemId={systemId} /> : null}
      {view === "boundary" ? <BoundaryDesigner layout={boundaryLayout(system, slice.assets)} /> : null}
      {view === "twin" ? <TwinView data={data} systemId={systemId} /> : null}
      {view === "attack" ? <AttackView data={data} systemId={systemId} /> : null}
      {view === "controls" ? <ControlsView data={data} systemId={systemId} /> : null}
      {view === "assess" ? <AssessView data={data} systemId={systemId} /> : null}
      {view === "assessor" ? <AssessorView data={data} systemId={systemId} /> : null}
      {view === "ssp" ? <SspView data={data} systemId={systemId} /> : null}
      {view === "evidence" ? <EvidenceView data={data} systemId={systemId} /> : null}
      {view === "poam" ? <PoamView data={data} systemId={systemId} /> : null}
      {view === "risk" ? <RiskView data={data} systemId={systemId} /> : null}
      {view === "simulate" ? <SimulateView data={data} systemId={systemId} /> : null}
      {view === "ato" ? <AtoView data={data} systemId={systemId} /> : null}
      {view === "conmon" ? <ConmonView data={data} systemId={systemId} /> : null}
      {view === "package" ? (
        <PackageWorkspace
          data={data}
          systemId={systemId}
          module={module && isPackageModule(module) ? module : "identification"}
          onModule={onModule}
        />
      ) : null}
    </div>
  );
}

function Overview({
  data,
  systemId,
  onView,
}: {
  data: PortfolioSnapshot;
  systemId: string;
  onView: (v: SystemViewId) => void;
}) {
  const system = data.systems.find((s) => s.id === systemId)!;
  const slice = systemSlice(data, systemId);
  const [memo, setMemo] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => briefSystem({ data: { systemId, focus: "system" } }),
    onSuccess: (res) => {
      if (res.ok) setMemo(res.text);
      else toast.error(res.error);
    },
  });
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[16rem_1fr]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Attached objects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {TREE.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => onView(t.view)}
              className="flex min-h-10 w-full items-center rounded-md px-2 text-left text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {t.label}
            </button>
          ))}
        </CardContent>
      </Card>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap gap-2">
          <AiAction label="Analyze system" pending={mut.isPending} onClick={() => mut.mutate()} />
        </div>
        <Card>
          <CardContent className="grid gap-3 pt-5 sm:grid-cols-4">
            <Stat label="Open POA&M" value={String(slice.poams.filter((p) => p.status !== "completed").length)} />
            <Stat label="Open findings" value={String(slice.findings.filter((f) => f.status === "open").length)} />
            <Stat label="Open risks" value={String(slice.risks.filter((r) => r.status !== "closed" && r.status !== "accepted").length)} />
            <Stat label="Evidence" value={String(slice.evidence.length)} />
          </CardContent>
        </Card>
        <InheritanceGraph data={data} />
        <SystemDiscoveryPanel data={data} system={system} />
        {memo ? (
          <Card>
            <CardHeader>
              <CardTitle>System analysis (unofficial)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-auto">
                <RichText text={memo} />
              </div>
            </CardContent>
          </Card>
        ) : null}
        <p className="text-sm text-muted-foreground">{system.mission}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl tabular-nums">{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function Profile({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const system = data.systems.find((s) => s.id === systemId)!;
  const people = data.personnel.filter((p) => p.systemId === systemId);
  const org = orgOf(system);
  const program = programOf(system);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>System identification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Field label="Organization" value={`${org?.name ?? "—"} (${org?.acronym ?? "—"})`} />
          <Field label="Program" value={program?.name ?? "—"} />
          <Field label="Mission" value={system.mission} />
          <Field label="Hosting" value={`${system.hosting} · ${system.cloudProvider ?? "—"}`} />
          <Field label="Business function" value={system.extra.businessFunction ?? "—"} />
          <Field label="Locations" value={(system.extra.geographicLocations ?? []).join(" · ") || "—"} />
          <Field label="Applications" value={(system.extra.applications ?? []).join(" · ") || "—"} />
          <Field label="Infrastructure" value={(system.extra.infrastructure ?? []).join(" · ") || "—"} />
          <Field label="Dependencies" value={(system.extra.dependencies ?? []).join(" · ") || "—"} />
          <Field label="Boundary" value={system.authorizationBoundary} />
          <Field
            label="Users / components"
            value={`${system.extra.users} · ${system.extra.components} components · ${system.extra.interfaces} interfaces`}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>RMF roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {people.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.title}</div>
              </div>
              <StatusBadge status={p.role} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ControlsView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const rows = useMemo(() => buildControlRows(data, systemId).filter((r) => r.selected), [data, systemId]);
  const [controlId, setControlId] = useState("SC-7");
  const [draft, setDraft] = useState<string | null>(null);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => writeImplementation({ data: { systemId, controlId } }),
    onSuccess: (res) => {
      if (res.ok) {
        setDraft(res.text);
        toast.success("Draft statement ready — accept, edit, or reject");
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <div className="text-xs text-muted-foreground">Control</div>
          <Input value={controlId} onChange={(e) => setControlId(e.target.value.toUpperCase())} className="w-32 font-mono" />
        </div>
        <AiAction label="Analyze control / draft statement" pending={mut.isPending} onClick={() => mut.mutate()} />
      </div>
      {draft ? (
        <Card>
          <CardHeader>
            <CardTitle>AI generated — {controlId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-80 overflow-auto">
              <RichText text={draft} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => { toast.success("Statement accepted into the SSP draft trail"); setDraft(null); }}>
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.message("Edit in SSP Studio")}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="p-0 pb-4">
          <ImplGrid rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

function AssessView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const qc = useQueryClient();
  const objectives = useMemo(() => deriveObjectives(data, systemId), [data, systemId]);
  const [filter, setFilter] = useState("");
  const [lens, setLens] = useState<"all" | "other" | "imported">("other");
  const [memo, setMemo] = useState<string | null>(null);
  const runMut = useMutation({
    mutationFn: () => runAssessment({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) {
        setMemo(res.text);
        toast.success("Assessment agent finished — human decision required");
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  const recMut = useMutation({
    mutationFn: async (id: string) => {
      const row = objectives.find((o) => o.id === id);
      if (!row) throw new Error("Missing objective");
      const order = resultChoices();
      const idx = Math.max(0, order.findIndex((r) => r.id === row.result));
      const next = order[(idx + 1) % order.length]!.id;
      return recordObjective({
        data: {
          id: row.id,
          systemId: row.systemId,
          controlId: row.controlId,
          objectiveId: row.objectiveId,
          method: row.method,
          result: next,
          comments: row.comments,
          assessor: row.assessor,
        },
      });
    },
    onSuccess: () => {
      toast.success("Objective recorded");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
  const q = filter.trim().toLowerCase();
  const ranked = [...objectives].sort((a, b) => {
    const rank = (o: (typeof objectives)[number]) =>
      o.result === "other" ? 0 : o.assessor === "Imported assessor" ? 1 : o.result === "not_assessed" ? 2 : 3;
    const d = rank(a) - rank(b);
    return d !== 0 ? d : a.controlId.localeCompare(b.controlId);
  });
  const filtered = ranked.filter((o) => {
    if (q && !o.controlId.toLowerCase().includes(q) && !o.method.includes(q)) return false;
    if (lens === "other") return o.result === "other";
    if (lens === "imported") return o.assessor === "Imported assessor";
    return true;
  });
  const shown = lens === "all" ? filtered.slice(0, 80) : filtered;
  const groups = new Map<string, typeof shown>();
  for (const o of shown) {
    const list = groups.get(o.controlId) ?? [];
    list.push(o);
    groups.set(o.controlId, list);
  }
  const otherCount = objectives.filter((o) => o.result === "other").length;
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter control" className="max-w-xs" />
        <Button size="sm" variant={lens === "other" ? "default" : "outline"} onClick={() => setLens("other")}>
          Other ({otherCount})
        </Button>
        <Button size="sm" variant={lens === "imported" ? "default" : "outline"} onClick={() => setLens("imported")}>
          Imported
        </Button>
        <Button size="sm" variant={lens === "all" ? "default" : "outline"} onClick={() => setLens("all")}>
          All
        </Button>
        <AiAction label="Run assessment agent" pending={runMut.isPending} onClick={() => runMut.mutate()} />
      </div>
      <AssessmentPipeline data={data} systemId={systemId} compact />
      {memo ? (
        <Card>
          <CardHeader>
            <CardTitle>Assessment memo (draft)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <RichText text={memo} />
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>800-53A workbench</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {shown.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">No objectives in this lens. Collect or ingest a SAR, then switch to All.</p>
          ) : null}
          {[...groups.entries()].map(([controlId, rows]) => {
            const ev = data.evidence.filter((e) => e.systemId === systemId && e.controlId === controlId).length;
            return (
              <div key={controlId} className="px-5 py-3">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs">{controlId}</div>
                    <div className="text-sm">{CONTROL_BY_ID[controlId]?.title}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">{ev} evidence</div>
                </div>
                <div className="space-y-2">
                  {rows.map((o) => (
                    <div key={o.id} className="flex flex-col gap-2 rounded-md bg-secondary/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {o.objectiveId} · {o.method} · {o.assessor}
                        </div>
                        <p className="text-xs text-muted-foreground">{o.comments}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={o.result} />
                        <Button size="sm" variant="outline" onClick={() => recMut.mutate(o.id)} disabled={recMut.isPending}>
                          Record next result
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Results: {resultChoices().map((r) => r.label).join(" · ")}. Agents propose; SCA records; AO authorizes.
      </p>
    </div>
  );
}

function SspView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const system = data.systems.find((s) => s.id === systemId)!;
  const sections = useMemo(() => deriveSspSections(data, systemId), [data, systemId]);
  const [open, setOpen] = useState("1");
  const [body, setBody] = useState<string | null>(null);
  const [ai, setAi] = useState<string | null>(null);
  const qc = useQueryClient();
  const saveMut = useMutation({
    mutationFn: () => {
      const sec = sections.find((s) => s.sectionId === open)!;
      return saveSspSection({
        data: {
          id: sec.id,
          systemId,
          sectionId: sec.sectionId,
          title: sec.title,
          body: body ?? sec.body,
          source: "ISSO",
        },
      });
    },
    onSuccess: () => {
      toast.success("SSP section saved as draft");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
  const sspMut = useMutation({
    mutationFn: () => generateSsp({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) {
        setAi(res.text);
        toast.success("SSP narrative drafted");
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  const current = sections.find((s) => s.sectionId === open);
  return (
    <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
      <div className="space-y-1">
        {sections.map((s) => (
          <button
            key={s.sectionId}
            type="button"
            onClick={() => {
              setOpen(s.sectionId);
              setBody(null);
            }}
            className={cn(
              "flex min-h-10 w-full items-center justify-between rounded-md px-3 text-left text-xs",
              open === s.sectionId ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            <span>
              {s.sectionId}. {s.title}
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <AiAction label="Improve SSP" pending={sspMut.isPending} onClick={() => sspMut.mutate()} />
          <Button size="sm" variant="outline" onClick={() => downloadOscal(data, system)}>
            Export OSCAL JSON
          </Button>
          <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            Save section
          </Button>
        </div>
        {current ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {current.sectionId}. {current.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={body ?? current.body} onChange={(e) => setBody(e.target.value)} rows={10} />
              <div className="mt-2 text-xs text-muted-foreground">
                Source {current.source} · {current.status}
              </div>
            </CardContent>
          </Card>
        ) : null}
        {ai ? (
          <Card>
            <CardHeader>
              <CardTitle>AI SSP narrative</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-auto">
                <RichText text={ai} />
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function EvidenceView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const slice = systemSlice(data, systemId);
  const fresh = evidenceFreshness(slice.evidence);
  const qc = useQueryClient();
  const [memo, setMemo] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: (c: { name: string; controlId: string }) =>
      collectFromConnector({ data: { systemId, connector: c.name, controlId: c.controlId } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`${res.evidenceCount} artifacts · ${res.summary}`);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  const missMut = useMutation({
    mutationFn: () => briefSystem({ data: { systemId, focus: "evidence" } }),
    onSuccess: (res) => {
      if (res.ok) setMemo(res.text);
      else toast.error(res.error);
    },
  });
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap gap-2">
        <AiAction label="Find missing evidence" pending={missMut.isPending} onClick={() => missMut.mutate()} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <Meter value={fresh.currentPct} label="Current (≤7d)" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <Meter value={fresh.monthPct} label="<30 days" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <Meter value={fresh.stalePct} label=">30 days" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <Meter value={fresh.expiredPct} label="Expired" />
          </CardContent>
        </Card>
      </div>
      {memo ? (
        <Card>
          <CardHeader>
            <CardTitle>Evidence gaps (unofficial)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <RichText text={memo} />
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Collectors</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {(slice.connectorBindings.length
            ? feedsFor(systemId).filter((c) => slice.connectorBindings.some((b) => b.connectorId === c.id && b.status === "enabled"))
            : feedsFor(systemId)
          ).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 rounded-md bg-secondary/60 px-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.cadence} · {c.authority}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => mut.mutate({ name: c.name, controlId: c.controls[0] ?? "CM-6" })} disabled={mut.isPending}>
                Collect
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="space-y-3">
        {slice.evidence.map((e) => {
          const qe = evidenceQuality(e);
          return (
            <Card key={e.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs">{e.id} · {e.controlId}</span>
                  <div className="flex gap-2">
                    <StatusBadge status={qe.lifecycle} />
                    <StatusBadge status={e.method} />
                    <StatusBadge status={e.classification} />
                  </div>
                </div>
                <div className="text-sm font-medium">{e.title}</div>
                <p className="text-sm text-muted-foreground">{e.summary}</p>
                <div className="text-[11px] text-muted-foreground">
                  Collector {e.source} · {e.hash} · {ageDays(e.collectedAt)}d old
                  {e.expiresAt ? ` · expires ${formatDate(e.expiresAt)}` : ""}
                  · quality {qe.overall}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PoamView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const slice = systemSlice(data, systemId);
  const [memo, setMemo] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => briefSystem({ data: { systemId, focus: "poam" } }),
    onSuccess: (res) => {
      if (res.ok) setMemo(res.text);
      else toast.error(res.error);
    },
  });
  return (
    <div className="min-w-0 space-y-4">
      <AiAction label="Analyze remediation" pending={mut.isPending} onClick={() => mut.mutate()} />
      {memo ? (
        <Card>
          <CardHeader>
            <CardTitle>Remediation analysis (unofficial)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <RichText text={memo} />
            </div>
          </CardContent>
        </Card>
      ) : null}
      {slice.poams.map((p) => {
        const tickets = slice.tickets.filter((t) => t.poamId === p.id);
        return (
          <Card key={p.id}>
            <CardContent className="space-y-3 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-xs">{p.id} · {p.controlId}</div>
                  <p className="mt-1 text-sm">{p.weakness}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={p.riskLevel} />
                  <StatusBadge status={p.status} />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {p.owner} · due {formatDate(p.dueDate)} · {p.daysOpen}d · {p.resources}
              </div>
              {tickets.length ? (
                <div className="space-y-1">
                  {tickets.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2 text-xs">
                      <span>
                        {t.source} {t.externalId} · {t.title}
                      </span>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RiskView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const risks = data.risks.filter((r) => r.systemId === systemId);
  const qc = useQueryClient();
  const [memo, setMemo] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: (id: string) => acceptRisk({ data: { id, expires: "2027-01-23", notes: "AO residual-risk acceptance." } }),
    onSuccess: () => {
      toast.success("Risk acceptance logged — periodic review required");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
  const aiMut = useMutation({
    mutationFn: () => briefSystem({ data: { systemId, focus: "risk" } }),
    onSuccess: (res) => {
      if (res.ok) setMemo(res.text);
      else toast.error(res.error);
    },
  });
  return (
    <div className="min-w-0 space-y-4">
      <AiAction label="Analyze risk" pending={aiMut.isPending} onClick={() => aiMut.mutate()} />
      <RiskHeatmap risks={risks} />
      {memo ? (
        <Card>
          <CardHeader>
            <CardTitle>Risk analysis (unofficial)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <RichText text={memo} />
            </div>
          </CardContent>
        </Card>
      ) : null}
      {risks.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-2 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs">{r.id} · {r.controlId}</div>
                <div className="text-sm font-medium">{r.title}</div>
                <p className="text-sm text-muted-foreground">
                  Threat: {r.threat}. Vulnerability: {r.vulnerability}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={r.riskLevel} />
                <StatusBadge status={r.status} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Likelihood {r.likelihood} · impact {r.impact} · residual {r.residual} · {r.owner}
            </div>
            <p className="text-sm">{r.mitigation}</p>
            {r.status !== "accepted" && r.status !== "closed" ? (
              <Button size="sm" variant="outline" onClick={() => mut.mutate(r.id)} disabled={mut.isPending}>
                AO accept residual risk
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">Accepted until {r.acceptanceExpires ? formatDate(r.acceptanceExpires) : "—"}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AtoView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const system = data.systems.find((s) => s.id === systemId)!;
  const complete = packageCompleteness(data, systemId);
  const slice = systemSlice(data, systemId);
  const qc = useQueryClient();
  const [brief, setBrief] = useState<string | null>(null);
  const [conditions, setConditions] = useState("Close open High/Critical POA&M. Monthly ConMon to AO.");
  const { roleId, role } = useActingRole();
  const canAuthorize = canPerform(roleId, "ato.issue") || canPerform(roleId, "ato.condition");
  const readyMut = useMutation({
    mutationFn: () => analyzeReadiness({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) setBrief(res.text);
      else toast.error(res.error);
    },
  });
  const decMut = useMutation({
    mutationFn: (decision: "authorized" | "authorized_with_conditions" | "not_authorized") =>
      recordAtoDecision({ data: { systemId, decision, conditions, actingRole: roleId } }),
    onSuccess: (res) => {
      if (res && "ok" in res && res.ok === false) {
        toast.error(res.error);
        return;
      }
      toast.success("Authorization decision recorded");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
  const high = slice.risks.filter((r) => r.riskLevel === "high" || r.riskLevel === "critical");
  const openPoam = slice.poams.filter((p) => p.status !== "completed");
  return (
    <div className="min-w-0 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ATO decision center</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Meter value={complete.implementation} label="Control implementation" />
            <Meter value={complete.assessment} label="Assessment completion" />
            <Meter value={complete.evidence} label="Evidence coverage" />
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">High / critical risks</div>
              <div className="font-display text-2xl tabular-nums">{high.length}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Open POA&M</div>
              <div className="font-display text-2xl tabular-nums">{openPoam.length}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Artifacts</div>
              <div className="font-display text-2xl tabular-nums">
                {complete.artifactsReady}/{complete.artifactsRequired}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {slice.artifacts.map((a) => (
              <StatusBadge key={a.id} status={`${a.kind} ${a.status}`} />
            ))}
          </div>
          <Textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={3} />
          <ActingAsPicker compact id="ato-acting" />
          {!canAuthorize ? (
            <p className="text-sm text-muted-foreground">
              {role.name} cannot issue an ATO. Switch acting-as to Authorizing Official or AO designated representative.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <AiAction label="Analyze authorization readiness" pending={readyMut.isPending} onClick={() => readyMut.mutate()} />
            <Button variant="outline" onClick={() => downloadOscal(data, system)}>
              Generate authorization package
            </Button>
            <Button onClick={() => decMut.mutate("authorized")} disabled={decMut.isPending || !canAuthorize} className="min-h-11">
              Authorize
            </Button>
            <Button variant="outline" onClick={() => decMut.mutate("authorized_with_conditions")} disabled={decMut.isPending || !canAuthorize} className="min-h-11">
              Authorize with conditions
            </Button>
            <Button variant="ghost" onClick={() => decMut.mutate("not_authorized")} disabled={decMut.isPending || !canAuthorize} className="min-h-11">
              Return for remediation
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The decision remains with {system.aoRole}. Agents assemble the package; they do not authorize.
          </p>
        </CardContent>
      </Card>
      {brief ? (
        <Card>
          <CardHeader>
            <CardTitle>AO briefing (unofficial)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <RichText text={brief} />
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Authorization history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {slice.authorizationHistory.map((h) => (
            <div key={h.id} className="rounded-md bg-secondary/60 p-3 text-sm">
              <div className="flex justify-between gap-2">
                <StatusBadge status={h.decision} />
                <span className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{h.actor}</div>
              <p className="mt-1">{h.conditions}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ConmonView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const slice = systemSlice(data, systemId);
  const summary = whatChangedSummary(data, systemId);
  const [q, setQ] = useState("If we move this application from AWS to Azure, what happens to our authorization?");
  const [ai, setAi] = useState<string | null>(null);
  const qc = useQueryClient();
  const changedMut = useMutation({
    mutationFn: () => whatChangedAi({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) setAi(res.text);
      else toast.error(res.error);
    },
  });
  const impactMut = useMutation({
    mutationFn: () => analyzeImpact({ data: { systemId, question: q } }),
    onSuccess: (res) => {
      if (res.ok) {
        setAi(res.text);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  const runMut = useMutation({
    mutationFn: () => runConmon({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`ConMon: ${res.feeds} feeds · ${res.evidenceCount} artifacts. ATO unchanged.`);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      }
    },
  });
  const collectMut = useMutation({
    mutationFn: (connector: string) => collectFromConnector({ data: { systemId, connector, controlId: "CM-6" } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.summary);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  const togMut = useMutation({
    mutationFn: (input: { connectorId: string; enabled: boolean }) =>
      toggleConnector({ data: { systemId, connectorId: input.connectorId, enabled: input.enabled } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
  const jobs = slice.collectionJobs.slice(0, 8);
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Collectors write evidence, tests, and 800-53A objectives. They do not close POA&M or issue an ATO.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/assessments">Assessment pipeline</Link>
          </Button>
          <Button onClick={() => runMut.mutate()} disabled={runMut.isPending}>
            {runMut.isPending ? "Collecting…" : "Run ConMon now"}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <Stat label="Infrastructure changes" value={String(summary.infra)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <Stat label="Identity / access" value={String(summary.identity)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <Stat label="Open vulns" value={String(summary.vulnsOpen)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <Stat label="KEV" value={String(summary.vulnsKev)} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Enabled feeds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {feedsFor(systemId).map((c) => {
            const b = slice.connectorBindings.find((x) => x.connectorId === c.id);
            const health = b ? bindingHealth(b) : "due";
            return (
              <div key={c.id} className="rounded-md bg-secondary/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.cadence} · {c.authority}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={health} />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togMut.mutate({ connectorId: c.id, enabled: b?.status !== "enabled" })}
                      disabled={togMut.isPending}
                    >
                      {b?.status === "disabled" ? "Enable" : "Disable"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => collectMut.mutate(c.id)} disabled={collectMut.isPending || b?.status === "disabled"}>
                      Collect
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px] text-primary">
                  {c.controls.map((id) => (
                    <Link key={id} to="/controls/$controlId" params={{ controlId: id }}>
                      {id}
                    </Link>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{b?.lastSummary || "Never collected."}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
      {jobs.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Collection jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobs.map((j) => (
              <div key={j.id} className="rounded-md bg-secondary/60 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{CONNECTORS.find((c) => c.id === j.connectorId)?.name ?? j.connectorId}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {j.evidenceCount} evidence · {j.changeCount} changes
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{j.summary}</p>
                <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px]">
                  {j.mappings.map((m) => (
                    <span key={`${j.id}-${m.controlId}-${m.method}`}>
                      {m.controlId} {m.method} → {m.result}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Configuration change agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.changes.map((c) => (
            <div key={c.id} className="rounded-md bg-secondary/60 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{c.kind}</span>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-1 text-muted-foreground">{c.summary}</p>
              <div className="mt-1 flex flex-wrap gap-2 font-mono text-[11px] text-primary">
                {c.controls.map((id) => (
                  <Link key={id} to="/controls/$controlId" params={{ controlId: id }}>
                    {id}
                  </Link>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.risk}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <AiAction label="What changed since last assessment?" pending={changedMut.isPending} onClick={() => changedMut.mutate()} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} />
        <AiAction label="Impact analysis" pending={impactMut.isPending} onClick={() => impactMut.mutate()} />
      </div>
      <p className="text-xs text-muted-foreground">Potentially affected controls: {summary.controls.join(" · ") || "none detected"}</p>
      {ai ? (
        <Card>
          <CardContent className="pt-5">
            <div className="max-h-96 overflow-auto">
              <RichText text={ai} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
