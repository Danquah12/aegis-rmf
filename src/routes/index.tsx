import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { CycleRail } from "@/components/grc/cycle-rail";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { Meter } from "@/components/grc/meter";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DualPlane } from "@/components/grc/dual-plane";
import { LifecycleStrip } from "@/components/grc/lifecycle-strip";
import { AiAction } from "@/components/grc/ai-action";
import { RichText } from "@/components/grc/rich-text";
import { CatoLoop } from "@/components/grc/cato-loop";
import { familyHealth, portfolioReadiness, usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { categorizePortfolio } from "@/lib/grc/cycle";
import { FAMILY_META } from "@/lib/grc/families";
import { stepProgress } from "@/lib/grc/layer1";
import { catoHealth, dailyBrief, evidenceGaps, isCommandLens, type CommandLens } from "@/lib/grc/layer3";
import { dailyBriefing } from "@/lib/grc/ai";
import {
  authorizationType,
  currentGate,
  impactTrio,
  packageCompleteness,
  WORKFLOW_GATES,
} from "@/lib/grc/package";
import { daysUntil, formatDate, cn } from "@/lib/utils";
import { buildOrgPrepareView } from "@/lib/grc/phase0";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

type Search = { lens?: CommandLens };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    lens: isCommandLens(search.lens) ? search.lens : undefined,
  }),
  loader: () => getPortfolio(),
  component: CommandCenter,
});

function CommandCenter() {
  const initial = Route.useLoaderData();
  const { lens } = Route.useSearch();
  const active: CommandLens = lens ?? "command";
  const { data, isLoading, error } = usePortfolio(initial);
  const navigate = useNavigate();
  const board = useMemo(() => (data ? categorizePortfolio(data) : null), [data]);
  const [briefMemo, setBriefMemo] = useState<string | null>(null);
  const briefMut = useMutation({
    mutationFn: () => dailyBriefing({ data: {} }),
    onSuccess: (res) => {
      if (res.ok) setBriefMemo(res.text);
      else toast.error(res.error);
    },
  });
  if (isLoading) return <LoadingState />;
  if (error || !data || !board) return <ErrorState />;

  const { per } = portfolioReadiness(data);
  const completeness = data.systems.map((s) => packageCompleteness(data, s.id));
  const meanComplete = completeness.length
    ? Math.round(completeness.reduce((s, c) => s + c.overall, 0) / completeness.length)
    : 0;
  const openPoams = data.poams.filter((p) => p.status !== "completed");
  const highPoams = openPoams.filter(
    (p) => p.riskLevel === "high" || p.riskLevel === "critical",
  );
  const families = familyHealth(data.implementations);
  const pendingAgents = data.agentRuns.filter((r) => r.status === "pending_approval");
  const inAssessment = data.systems.filter((s) => s.atoStatus === "in_assessment").length;
  const dueFeeds = data.connectorBindings.filter((b) => !b.lastRun && b.status === "enabled").length;
  const brief = dailyBrief(data);
  const kev = data.vulnerabilities.filter((v) => v.kev && v.status === "open").length;
  const expiringAto = data.systems.filter((s) => {
    const d = daysUntil(s.atoExpires);
    return d !== null && d <= 120;
  });
  const gaps = evidenceGaps(data.implementations, data.evidence).filter((g) => g.status !== "ok");
  const orgView = buildOrgPrepareView(data);

  const lenses: { id: CommandLens; label: string }[] = [
    { id: "command", label: "Command" },
    { id: "ciso", label: "CISO" },
    { id: "ao", label: "AO" },
    { id: "isso", label: "ISSO" },
    { id: "brief", label: "Daily brief" },
  ];

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="System of record"
        title="Command"
        description="RMF system of record. The information system is the hub — controls, evidence, risk, and ATO attach to it. Agents keep the package synchronized with live state; humans still authorize."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/prepare">Organization Prepare</Link>
            </Button>
            <Button asChild>
              <Link to="/engine">Run engine</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/workflow">Open workflow</Link>
            </Button>
            <Button asChild>
              <Link to="/ask">
                Ask Aegis
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Phase 0 · Organization Prepare
            </div>
            <div className="text-sm font-medium">{orgView.overall}% complete</div>
            <p className="text-xs text-muted-foreground">{orgView.summary}</p>
          </div>
          <Button variant="outline" asChild className="min-h-11 shrink-0">
            <Link to="/prepare">Open Prepare</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="mb-6 flex min-w-0 gap-1 overflow-x-auto pb-1">
        {lenses.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => {
              void navigate({
                to: "/",
                search: { lens: l.id === "command" ? undefined : l.id },
              });
            }}
            className={cn(
              "flex min-h-11 shrink-0 items-center rounded-md px-3 text-xs transition-colors duration-150",
              active === l.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      {active === "ciso" ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Authorized" value={String(data.systems.filter((s) => s.atoStatus === "authorized" || s.atoStatus === "authorized_with_conditions").length)} hint={`${inAssessment} pending assessment`} />
          <StatCard label="Critical / high POA&M" value={String(highPoams.length)} hint={`${openPoams.length} open total`} />
          <StatCard label="Open KEV" value={String(kev)} hint="Authorization-relevant" />
          <StatCard label="Incidents" value={String(data.incidents.length)} hint="Not auto-closed" />
        </div>
      ) : null}
      {active === "ao" ? (
        <div className="mb-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Expiring ATO" value={String(expiringAto.length)} hint="Within 120 days" />
            <StatCard label="High-risk packages" value={String(highPoams.length ? new Set(highPoams.map((p) => p.systemId)).size : 0)} hint="Open high/critical POA&M" />
            <StatCard label="Unreviewed change" value={String(data.configChanges.filter((c) => c.status === "open").length)} hint="Significant-change queue" />
            <StatCard label="Risk accepted" value={String(data.poams.filter((p) => p.status === "risk_accepted").length)} hint="Time-bound only" />
          </div>
          {data.systems.slice(0, 2).map((s) => {
            const h = catoHealth(data, s.id);
            return <CatoLoop key={s.id} health={h.state} reasons={[s.acronym, ...h.reasons]} />;
          })}
        </div>
      ) : null}
      {active === "isso" ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Evidence gaps" value={String(gaps.length)} hint="Missing, expired, or incomplete" />
          <StatCard label="POA&M due" value={String(brief.poamDue)} hint="By month-end" />
          <StatCard label="Open vulns" value={String(data.vulnerabilities.filter((v) => v.status === "open").length)} hint={`${kev} KEV`} />
          <StatCard label="Config changes" value={String(data.configChanges.filter((c) => c.status === "open").length)} hint="Need ISSO review" />
        </div>
      ) : null}
      {active === "brief" ? (
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            <AiAction label="Write daily briefing" pending={briefMut.isPending} onClick={() => briefMut.mutate()} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {brief.lines.map((line) => (
              <Card key={line}>
                <CardContent className="pt-5 text-sm">{line}</CardContent>
              </Card>
            ))}
          </div>
          {briefMemo ? (
            <Card>
              <CardHeader>
                <CardTitle>Daily briefing (unofficial)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-auto">
                  <RichText text={briefMemo} />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Package completeness" value={`${meanComplete}%`} hint="Mean across authorization boundaries" />
        <StatCard label="Open POA&M" value={String(openPoams.length)} hint={`${highPoams.length} high or critical`} />
        <StatCard label="Pending signatures" value={String(pendingAgents.length)} hint="Human-in-the-loop" />
        <StatCard
          label="Authorization packages"
          value={String(data.systems.length)}
          hint={`${inAssessment} in assessment · ${dueFeeds} feeds due`}
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-sm font-medium">Package workflow</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/workflow">ISSO → AO</Link>
          </Button>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {WORKFLOW_GATES.filter((g) => g.id !== "conmon").map((g) => {
            const n = data.systems.filter((s) => currentGate(s) === g.id).length;
            return (
              <Link
                key={g.id}
                to="/workflow"
                className="flex min-h-11 min-w-36 shrink-0 flex-col justify-center rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  {g.actor}
                </span>
                <span className="text-sm font-medium">{g.label}</span>
                <span className="font-display text-xl tabular-nums">{n}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-sm font-medium">Risk management cycle</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/cycle">Open cycle</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-5">
            <CycleRail
              active="all"
              onSelect={(step) => {
                void navigate({
                  to: "/cycle",
                  search: step === "all" ? {} : { step },
                });
              }}
              counts={board.counts}
              health={board.health}
              work={board.work}
              allowAll={false}
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium">Dual plane</h2>
        <DualPlane />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Authorization packages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {per.map(({ system }) => {
              const days = daysUntil(system.atoExpires);
              const complete = packageCompleteness(data, system.id);
              const cia = impactTrio(system);
              return (
                <Link
                  key={system.id}
                  to="/systems/$systemId"
                  params={{ systemId: system.id }}
                  className="block rounded-lg bg-secondary/60 p-4 transition-colors duration-150 hover:bg-secondary"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">{system.id}</div>
                      <div className="text-sm font-medium">{system.acronym}</div>
                      <div className="text-xs text-muted-foreground">{system.name}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={authorizationType(system)} />
                      <StatusBadge status={`C ${cia.confidentiality}`} />
                      <StatusBadge status={`I ${cia.integrity}`} />
                      <StatusBadge status={`A ${cia.availability}`} />
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Meter value={complete.overall} label="Package completeness" />
                    <div className="flex items-end justify-between text-xs text-muted-foreground">
                      <CycleBadge step={system.rmfStep} link={false} />
                      <span className="tabular-nums">
                        {system.atoExpires
                          ? `${formatDate(system.atoExpires)}${days !== null ? ` · ${days}d` : ""}`
                          : "No ATO date"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <LifecycleStrip steps={stepProgress(data, system.id)} compact />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authorization blockers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highPoams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No high-risk open POA&M items.</p>
            ) : (
              highPoams.map((p) => {
                const sys = data.systems.find((s) => s.id === p.systemId);
                return (
                  <Link
                    key={p.id}
                    to="/poam"
                    className="block rounded-lg bg-secondary/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs">{p.id}</span>
                      <StatusBadge status={p.riskLevel} />
                    </div>
                    <div className="mt-1 text-sm">
                      {sys?.acronym} · {p.controlId}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.weakness}</p>
                    <div className="mt-2 text-[11px] text-muted-foreground tabular-nums">
                      Open {p.daysOpen}d · due {formatDate(p.dueDate)}
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium">Control family health</h2>
        <Card>
          <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {families.map((f) => (
              <div key={f.family} className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs">{f.family}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {FAMILY_META[f.family].name}
                  </span>
                </div>
                <Meter value={f.score} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Agent activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/agents">All agents</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.agentRuns.slice(0, 4).map((run) => (
              <div key={run.id} className="rounded-lg bg-secondary/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium capitalize">{run.agent} agent</span>
                  <StatusBadge status={run.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{run.objective}</p>
                <div className="mt-2 font-mono text-[11px] text-muted-foreground">
                  confidence {run.confidence}%
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>How the package engine works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Same structures as eMASS and Xacta — identification, categorization, implementation, assessment, POA&M, artifacts, inheritance, inventory, interconnects, authorization, ConMon — filled by collection jobs instead of copy-paste.
            </p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>FIPS 199 CIA and 800-53B baseline select the overlay.</li>
              <li>Controls originate as system, inherited, or hybrid from CCPs.</li>
              <li>Collection jobs map SIEM, IdP, scanner, and cloud config to 800-53A methods.</li>
              <li>The engine refreshes SSP / SAP / SAR / POA&M and stages residual risk.</li>
              <li>ISSO submits, SCA signs, ISSM reviews, AO authorizes. Agents never issue an ATO.</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to="/implementation">Open implementation grid</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/workflow">Sign a package</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 font-display text-3xl tabular-nums tracking-tight">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}
