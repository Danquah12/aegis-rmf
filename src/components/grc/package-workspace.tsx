import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { ImplGrid } from "@/components/grc/impl-grid";
import { Meter } from "@/components/grc/meter";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSsp, runAssessment } from "@/lib/grc/ai";
import { CONTROL_BY_ID } from "@/lib/grc/catalog";
import {
  ARTIFACT_KINDS,
  authorizationType,
  buildControlRows,
  collectionJobs,
  ccpKindLabel,
  COMMON_CONTROL_PROVIDERS,
  currentGate,
  deriveInterconnects,
  deriveTestResults,
  deriveWorkflow,
  deriveArtifacts,
  impactTrio,
  isPackageModule,
  PACKAGE_MODULES,
  packageCompleteness,
  WORKFLOW_GATES,
  type PackageModuleId,
} from "@/lib/grc/package";
import { advanceWorkflow, runPackage } from "@/lib/grc/queries";
import { formatDate } from "@/lib/utils";
import { systemSlice } from "@/hooks/use-portfolio";
import type { PortfolioSnapshot, WorkflowGateId } from "@/lib/grc/types";
import { RichText } from "@/components/grc/rich-text";
import { cn } from "@/lib/utils";

export function PackageWorkspace({
  data,
  systemId,
  module,
  onModule,
}: {
  data: PortfolioSnapshot;
  systemId: string;
  module: PackageModuleId;
  onModule: (id: PackageModuleId) => void;
}) {
  const slice = systemSlice(data, systemId);
  const system = slice.system;
  const qc = useQueryClient();
  const [sspText, setSspText] = useState<string | null>(null);
  const [assessText, setAssessText] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);

  const rows = useMemo(() => buildControlRows(data, systemId), [data, systemId]);
  const complete = useMemo(() => packageCompleteness(data, systemId), [data, systemId]);
  const cia = system ? impactTrio(system) : null;
  const gate = system ? currentGate(system) : "isso_implement";
  const tests = slice.testResults.length
    ? slice.testResults
    : system
      ? deriveTestResults(data, systemId)
      : [];
  const interconnects = slice.interconnections.length
    ? slice.interconnections
    : system
      ? deriveInterconnects(system)
      : [];
  const artifacts = slice.artifacts.length
    ? slice.artifacts
    : system
      ? deriveArtifacts(data, systemId)
      : [];
  const events = slice.workflowEvents.length
    ? slice.workflowEvents
    : system
      ? deriveWorkflow(system)
      : [];

  const packageMut = useMutation({
    mutationFn: () => runPackage({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) {
        setReport(
          `Automated package run complete. ${res.testsWritten} 800-53A test results. ${res.artifacts} artifacts refreshed. Completeness ${res.completeness}%. AO signature still required.`,
        );
        toast.success("Package engine finished — staged for human review");
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
    onError: () => toast.error("Package run failed"),
  });

  const sspMut = useMutation({
    mutationFn: () => generateSsp({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) {
        setSspText(res.text);
        toast.success("Draft SSP ready for ISSO review");
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });

  const assessMut = useMutation({
    mutationFn: () => runAssessment({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) {
        setAssessText(res.text);
        toast.success("SAR memo drafted — SCA/AO approval required");
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });

  const signMut = useMutation({
    mutationFn: (input: { gate: WorkflowGateId; notes: string }) =>
      advanceWorkflow({ data: { systemId, ...input } }),
    onSuccess: () => {
      toast.success("Workflow signature recorded");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  if (!system || !slice.readiness || !cia) return null;

  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Authorization package · {system.extra.packageVersion ?? "1.0"} · {system.id}
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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => sspMut.mutate()} disabled={sspMut.isPending}>
            {sspMut.isPending ? "Drafting SSP…" : "Generate SSP"}
          </Button>
          <Button variant="outline" onClick={() => assessMut.mutate()} disabled={assessMut.isPending}>
            {assessMut.isPending ? "Assessing…" : "Generate SAR"}
          </Button>
          <Button onClick={() => packageMut.mutate()} disabled={packageMut.isPending}>
            {packageMut.isPending ? "Running package…" : "Run package"}
          </Button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <Meter value={complete.overall} label="Package completeness" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-sm">
            <div className="text-xs text-muted-foreground">Workflow gate</div>
            <div className="mt-1 font-medium">
              {WORKFLOW_GATES.find((g) => g.id === gate)?.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {WORKFLOW_GATES.find((g) => g.id === gate)?.actor}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-sm">
            <div className="text-xs text-muted-foreground">Selected controls</div>
            <div className="font-display text-2xl tabular-nums">{complete.selected}</div>
            <div className="text-xs text-muted-foreground">
              {complete.implemented} implemented · {complete.assessed} assessed
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-sm">
            <div className="text-xs text-muted-foreground">Required artifacts</div>
            <div className="font-display text-2xl tabular-nums">
              {complete.artifactsReady}/{complete.artifactsRequired}
            </div>
            <div className="text-xs text-muted-foreground">
              ATO {system.atoExpires ? formatDate(system.atoExpires) : "not issued"}
            </div>
          </CardContent>
        </Card>
      </div>

      {report ? (
        <p className="mb-4 rounded-lg bg-secondary/60 px-4 py-3 text-sm">{report}</p>
      ) : null}

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {PACKAGE_MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModule(m.id)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-xs transition-colors duration-150",
              module === m.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="font-mono tabular-nums">{m.emass}</span>
            {m.label}
          </button>
        ))}
      </div>

      {module === "identification" ? (
        <Identification system={system} />
      ) : null}
      {module === "categorization" ? <Categorization system={system} /> : null}
      {module === "implementation" ? (
        <Card>
          <CardHeader>
            <CardTitle>Control implementation</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <ImplGrid rows={rows.filter((r) => r.selected)} />
          </CardContent>
        </Card>
      ) : null}
      {module === "assessment" ? (
        <AssessmentModule
          tests={tests}
          assessments={slice.assessments}
          assessText={assessText}
        />
      ) : null}
      {module === "poam" ? (
        <div className="space-y-3">
          {slice.poams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No POA&M items on this package.</p>
          ) : (
            slice.poams.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-2 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs">{p.id} · {p.controlId}</span>
                    <div className="flex gap-2">
                      <StatusBadge status={p.riskLevel} />
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                  <p className="text-sm">{p.weakness}</p>
                  <div className="text-xs text-muted-foreground">
                    {p.owner} · due {formatDate(p.dueDate)} · {p.daysOpen}d
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : null}
      {module === "artifacts" ? (
        <ArtifactsModule
          artifacts={artifacts}
          sspText={sspText || system.sspDraft}
        />
      ) : null}
      {module === "inheritance" ? (
        <InheritanceModule systemId={system.id} rows={rows} />
      ) : null}
      {module === "inventory" ? (
        <InventoryModule slice={slice} jobs={collectionJobs(data.evidence, system.id)} />
      ) : null}
      {module === "interconnect" ? (
        <div className="space-y-3">
          {interconnects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interconnections on file.</p>
          ) : (
            interconnects.map((i) => (
              <Card key={i.id}>
                <CardContent className="space-y-1 pt-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{i.partner}</div>
                    <StatusBadge status={i.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {i.kind} · {i.agreement}
                  </div>
                  <p className="text-sm">{i.dataFlow}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : null}
      {module === "authorization" ? (
        <AuthorizationModule
          system={system}
          events={events}
          gate={gate}
          signing={signMut.isPending}
          onSign={(g, notes) => signMut.mutate({ gate: g, notes })}
        />
      ) : null}
      {module === "conmon" ? (
        <ConmonModule slice={slice} jobs={collectionJobs(data.evidence, system.id)} />
      ) : null}
    </div>
  );
}

function Identification({ system }: { system: NonNullable<ReturnType<typeof systemSlice>["system"]> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>System identification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Field label="System name" value={system.name} />
          <Field label="Acronym" value={system.acronym} />
          <Field label="Mission" value={system.mission} />
          <Field label="Hosting" value={`${system.hosting} · ${system.cloudProvider ?? "—"}`} />
          <Field label="Authorization boundary" value={system.authorizationBoundary} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Personnel (eMASS roles)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Field label="System owner" value={system.ownerRole} />
          <Field label="ISSO" value={system.issoRole} />
          <Field label="ISSM" value={system.extra.issmRole ?? "ISSM"} />
          <Field label="SCA" value={system.extra.scaRole ?? "Assessor"} />
          <Field label="Authorizing official" value={system.aoRole} />
          <Field label="Users / components" value={`${system.extra.users} · ${system.extra.components} components · ${system.extra.interfaces} interfaces`} />
        </CardContent>
      </Card>
    </div>
  );
}

function Categorization({ system }: { system: NonNullable<ReturnType<typeof systemSlice>["system"]> }) {
  const cia = impactTrio(system);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>FIPS 199 / SP 800-60</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <CiaBox label="Confidentiality" value={cia.confidentiality} />
          <CiaBox label="Integrity" value={cia.integrity} />
          <CiaBox label="Availability" value={cia.availability} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Baseline and overlays</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Field label="High water mark" value={system.impactLevel} />
          <Field label="800-53B baseline" value={system.extra.baseline} />
          <Field label="Overlays" value={system.extra.overlay ?? "None"} />
          <div>
            <div className="text-xs text-muted-foreground">Information types</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {system.dataTypes.map((t) => (
                <StatusBadge key={t} status={t} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AssessmentModule({
  tests,
  assessments,
  assessText,
}: {
  tests: ReturnType<typeof deriveTestResults>;
  assessments: ReturnType<typeof systemSlice>["assessments"];
  assessText: string | null;
}) {
  return (
    <div className="space-y-4">
      {assessText ? (
        <Card>
          <CardHeader>
            <CardTitle>Latest SAR memo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <RichText text={assessText} />
            </div>
          </CardContent>
        </Card>
      ) : null}
      {assessments.map((a) => (
        <Card key={a.id}>
          <CardContent className="space-y-2 pt-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{a.kind}</span>
              <StatusBadge status={a.status} />
            </div>
            <p className="text-sm text-muted-foreground">{a.summary}</p>
            <div className="text-xs text-muted-foreground">
              {a.assessor} · {formatDate(a.startedAt)}
            </div>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader>
          <CardTitle>800-53A test results</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {tests.slice(0, 40).map((t) => (
            <div key={t.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:justify-between">
              <div>
                <div className="font-mono text-xs">
                  {t.controlId} · {t.method}
                  {t.automated ? " · automated" : ""}
                </div>
                <div className="text-sm">{CONTROL_BY_ID[t.controlId]?.title ?? t.objective}</div>
                <p className="text-xs text-muted-foreground">{t.comments}</p>
              </div>
              <StatusBadge status={t.result} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ArtifactsModule({
  artifacts,
  sspText,
}: {
  artifacts: ReturnType<typeof systemSlice>["artifacts"];
  sspText: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {(artifacts.length ? artifacts : ARTIFACT_KINDS.map((k) => ({
          id: k.id,
          kind: k.id,
          title: k.label,
          status: "missing" as const,
          source: "—",
          updatedAt: "—",
          systemId: "",
        }))).map((a) => (
          <Card key={a.id}>
            <CardContent className="space-y-2 pt-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{a.title}</div>
                <StatusBadge status={a.status} />
              </div>
              <div className="text-xs text-muted-foreground">
                {ARTIFACT_KINDS.find((k) => k.id === a.kind)?.oscal ?? "package artifact"} · {a.source}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {sspText ? (
        <Card>
          <CardHeader>
            <CardTitle>SSP narrative (draft)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <RichText text={sspText} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function InheritanceModule({
  systemId,
  rows,
}: {
  systemId: string;
  rows: ReturnType<typeof buildControlRows>;
}) {
  return (
    <div className="space-y-4">
      {COMMON_CONTROL_PROVIDERS.filter((p) => p.systemId !== systemId).map((p) => {
        const used = rows.filter((r) => r.inheritedFrom === p.acronym);
        return (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>
                {p.acronym} · {p.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-xs text-muted-foreground">
                {ccpKindLabel(p.kind)} · {p.authorization}
              </div>
              <div className="flex flex-wrap gap-1">
                {p.controls.map((id) => (
                  <Link
                    key={id}
                    to="/controls/$controlId"
                    params={{ controlId: id }}
                    className="font-mono text-[11px] text-primary"
                  >
                    {id}
                  </Link>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                {used.length} controls inherited or hybrid on this package
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function InventoryModule({
  slice,
  jobs,
}: {
  slice: ReturnType<typeof systemSlice>;
  jobs: ReturnType<typeof collectionJobs>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Hardware / software / components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {slice.assets.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2 text-sm">
              <div>
                <div className="font-mono text-xs text-muted-foreground">{a.id}</div>
                {a.name} · {a.kind}
              </div>
              <StatusBadge status={a.criticality} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Automated collection jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {jobs.map((j) => (
            <div key={j.source} className="flex items-center justify-between gap-2 text-sm">
              <div>
                <div className="font-medium">{j.source}</div>
                <div className="text-xs text-muted-foreground">
                  {j.authority} · {j.covered}/{j.controls.length} controls
                </div>
              </div>
              <StatusBadge status={j.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AuthorizationModule({
  system,
  events,
  gate,
  signing,
  onSign,
}: {
  system: NonNullable<ReturnType<typeof systemSlice>["system"]>;
  events: ReturnType<typeof systemSlice>["workflowEvents"];
  gate: WorkflowGateId;
  signing: boolean;
  onSign: (gate: WorkflowGateId, notes: string) => void;
}) {
  const history = events.length ? events : [];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Signature chain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {WORKFLOW_GATES.map((g) => {
            const done =
              WORKFLOW_GATES.findIndex((x) => x.id === g.id) <=
              WORKFLOW_GATES.findIndex((x) => x.id === gate);
            return (
              <div key={g.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium">{g.label}</div>
                  <div className="text-xs text-muted-foreground">{g.actor}</div>
                </div>
                <StatusBadge status={done ? "complete" : "pending"} />
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              disabled={signing}
              onClick={() => onSign("isso_submit", "ISSO submits the authorization package.")}
            >
              ISSO submit
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={signing}
              onClick={() => onSign("sca_assess", "SCA attests assessment complete.")}
            >
              SCA sign
            </Button>
            <Button
              size="sm"
              disabled={signing}
              onClick={() =>
                onSign("ao_decision", "AO accepts residual risk and issues ATO with conditions.")
              }
            >
              AO authorize
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Agents prepare the package. {system.aoRole} remains accountable for the decision.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Workflow history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.map((e) => (
            <div key={e.id} className="rounded-md bg-secondary/60 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{e.action}</span>
                <span className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {e.actor} · {e.gate.replaceAll("_", " ")}
              </div>
              <p className="mt-1 text-muted-foreground">{e.notes}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ConmonModule({
  slice,
  jobs,
}: {
  slice: ReturnType<typeof systemSlice>;
  jobs: ReturnType<typeof collectionJobs>;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Continuous monitoring strategy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Control status is taken from live telemetry, not the date of the last SAR. Collection jobs
          below remap scanner, IdP, SIEM, and cloud-config evidence to 800-53 Rev. 5.
        </CardContent>
      </Card>
      <InventoryModule slice={slice} jobs={jobs} />
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

function CiaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-3 text-center">
      <div className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="mt-1 font-display text-xl capitalize">{value}</div>
    </div>
  );
}

export { isPackageModule };
