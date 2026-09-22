import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { CycleRail } from "@/components/grc/cycle-rail";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { Meter } from "@/components/grc/meter";
import { PageHeader } from "@/components/grc/page-header";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { SupportDocsPanel } from "@/components/grc/support-docs";
import {
  categorizePortfolio,
  CYCLE_KIND_META,
  CYCLE_KINDS,
  isRmfStep,
  RMF_STEP_META,
  RMF_STEPS,
  type CycleKind,
} from "@/lib/grc/cycle";
import type { RmfStep } from "@/lib/grc/types";
import { cn } from "@/lib/utils";

type CycleSearch = { step?: RmfStep };

export const Route = createFileRoute("/cycle")({
  validateSearch: (search: Record<string, unknown>): CycleSearch => ({
    step: isRmfStep(search.step) ? search.step : undefined,
  }),
  loader: () => getPortfolio(),
  component: CyclePage,
});

function CyclePage() {
  const { step: searchStep } = Route.useSearch();
  const navigate = Route.useNavigate();
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const [kind, setKind] = useState<CycleKind | "all">("all");

  const board = useMemo(() => (data ? categorizePortfolio(data) : null), [data]);
  const active: RmfStep | "all" = searchStep ?? "all";

  if (isLoading) return <LoadingState />;
  if (error || !data || !board) return <ErrorState />;

  function select(next: RmfStep | "all") {
    void navigate({
      search: next === "all" ? {} : { step: next },
    });
  }

  const visibleKinds = CYCLE_KINDS.filter((k) =>
    RMF_STEPS.some((s) => (board.kindCounts[s][k] ?? 0) > 0),
  );

  return (
    <div className="min-w-0 overflow-x-hidden">
      <PageHeader
        kicker="NIST SP 800-37 Rev. 2"
        title="Risk management cycle"
        description="Prepare through Monitor. Every system, control, artifact, finding, and agent is classified to the RMF step that owns it. Monitor loops — authorization is continuous."
      />

      <CycleRail
        active={active}
        onSelect={select}
        counts={board.counts}
        health={board.health}
        work={board.work}
      />

      <div className="mt-6 mb-5 flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
        <KindChip
          active={kind === "all"}
          label="All items"
          onClick={() => setKind("all")}
        />
        {visibleKinds.map((k) => (
          <KindChip
            key={k}
            active={kind === k}
            label={CYCLE_KIND_META[k].plural}
            onClick={() => setKind(k)}
          />
        ))}
      </div>

      {active === "all" ? (
        <AllStepsBoard board={board} kind={kind} onSelect={select} />
      ) : (
        <StepDetail board={board} step={active} kind={kind} data={data} />
      )}
    </div>
  );
}

function AllStepsBoard({
  board,
  kind,
  onSelect,
}: {
  board: ReturnType<typeof categorizePortfolio>;
  kind: CycleKind | "all";
  onSelect: (step: RmfStep) => void;
}) {
  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {RMF_STEPS.map((step) => {
        const meta = RMF_STEP_META[step];
        const rows = board.byStep[step].filter((i) => kind === "all" || i.kind === kind);
        const preview = rows.slice(0, 5);
        const systems = board.systemsInStep[step];
        return (
          <Card key={step} className="flex min-h-72 min-w-0 flex-col">
            <CardHeader>
              <button
                type="button"
                onClick={() => onSelect(step)}
                className="text-left"
              >
                <div className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                  Step {meta.index}
                </div>
                <CardTitle className="font-display text-xl">{meta.name}</CardTitle>
              </button>
              <Meter value={board.health[step]} />
              <div className="flex flex-wrap gap-1 pt-1">
                {systems.map((s) => (
                  <Link
                    key={s.id}
                    to="/systems/$systemId"
                    params={{ systemId: s.id }}
                    className="font-mono text-[11px] text-primary"
                  >
                    {s.acronym}
                  </Link>
                ))}
                {systems.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground">No system parked here</span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2">
              {preview.length === 0 ? (
                <p className="text-xs text-muted-foreground">No items in this filter.</p>
              ) : (
                preview.map((item) => <ItemRow key={`${item.kind}-${item.id}`} item={item} compact />)
              )}
              {rows.length > preview.length ? (
                <button
                  type="button"
                  onClick={() => onSelect(step)}
                  className="mt-auto pt-1 text-left text-xs text-primary"
                >
                  {rows.length - preview.length} more in {meta.name}
                </button>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StepDetail({
  board,
  step,
  kind,
  data,
}: {
  board: ReturnType<typeof categorizePortfolio>;
  step: RmfStep;
  kind: CycleKind | "all";
  data: NonNullable<ReturnType<typeof usePortfolio>["data"]>;
}) {
  const meta = RMF_STEP_META[step];
  const rows = board.byStep[step].filter((i) => kind === "all" || i.kind === kind);
  const grouped = CYCLE_KINDS.map((k) => ({
    kind: k,
    items: rows.filter((i) => i.kind === k),
  })).filter((g) => g.items.length > 0);
  const systems = board.systemsInStep[step];

  return (
    <div className="space-y-4">
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Step {meta.index} · {meta.tasks}
          </div>
          <CardTitle className="font-display text-2xl">{meta.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">{meta.purpose}</p>
          <Meter value={board.health[step]} label="Step posture" />
          <div>
            <div className="text-xs text-muted-foreground">Outputs</div>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {meta.outputs.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Accountable</div>
            <p className="mt-1">{meta.roles}</p>
          </div>
          {step === "assess" ? (
            <Button asChild>
              <Link to="/engine">Run RMF engine</Link>
            </Button>
          ) : null}
          {step === "monitor" ? (
            <Button variant="outline" asChild>
              <Link to="/integrations">Open collection plane</Link>
            </Button>
          ) : null}
          {step === "authorize" ? (
            <Button variant="outline" asChild>
              <Link to="/ato">AO decision (human)</Link>
            </Button>
          ) : null}
          <div>
            <div className="text-xs text-muted-foreground">Systems currently in this step</div>
            <div className="mt-2 flex flex-col gap-2">
              {systems.length === 0 ? (
                <p className="text-muted-foreground">None. Items below are owned by this step regardless of system position.</p>
              ) : (
                systems.map((s) => (
                  <Link
                    key={s.id}
                    to="/systems/$systemId"
                    params={{ systemId: s.id }}
                    className="rounded-md bg-secondary/60 px-3 py-2 font-mono text-sm"
                  >
                    {s.acronym}
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {CYCLE_KINDS.map((k) => {
              const n = board.kindCounts[step][k] ?? 0;
              if (!n) return null;
              return (
                <div key={k} className="rounded-md bg-secondary/50 px-2 py-2">
                  <div className="font-mono tabular-nums text-foreground">{n}</div>
                  <div className="text-muted-foreground">{CYCLE_KIND_META[k].plural}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        {grouped.length === 0 ? (
          <Card>
            <CardContent className="pt-5 text-sm text-muted-foreground">
              No items match this filter in {meta.name}.
            </CardContent>
          </Card>
        ) : (
          grouped.map((g) => (
            <section key={g.kind}>
              <h2 className="mb-2 text-sm font-medium">
                {CYCLE_KIND_META[g.kind].plural}
                <span className="ml-2 font-mono text-xs text-muted-foreground tabular-nums">
                  {g.items.length}
                </span>
              </h2>
              <Card>
                <CardContent className="divide-y divide-border p-0">
                  {g.items.map((item) => (
                    <div key={`${item.kind}-${item.id}`} className="px-5 py-3">
                      <ItemRow item={item} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ))
        )}
      </div>
    </div>
    <SupportDocsPanel
      data={data}
      systemId={systems[0]?.id ?? data.systems[0]?.id ?? "SYS-HELIOS"}
      defaultStep={step}
    />
    </div>
  );
}

function ItemRow({
  item,
  compact,
}: {
  item: ReturnType<typeof categorizePortfolio>["items"][number];
  compact?: boolean;
}) {
  const body = (
    <div className={cn("min-w-0", compact ? "" : "flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between")}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] break-all text-muted-foreground">{item.id}</span>
          {compact ? null : (
            <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
              {CYCLE_KIND_META[item.kind].label}
            </span>
          )}
        </div>
        <div className={cn("font-medium", compact ? "truncate text-xs" : "text-sm")}>{item.title}</div>
        {compact ? null : (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.subtitle}</p>
        )}
      </div>
      {compact ? null : (
        <div className="mt-2 shrink-0 sm:mt-0">
          <StatusBadge status={item.status} />
        </div>
      )}
    </div>
  );
  return <ItemLink item={item}>{body}</ItemLink>;
}

function ItemLink({
  item,
  children,
}: {
  item: ReturnType<typeof categorizePortfolio>["items"][number];
  children: ReactNode;
}) {
  const className = "block hover:text-foreground";
  if (item.kind === "system" && item.systemId) {
    return (
      <Link to="/systems/$systemId" params={{ systemId: item.systemId }} className={className}>
        {children}
      </Link>
    );
  }
  if ((item.kind === "control" || item.kind === "implementation") && item.controlId) {
    return (
      <Link to="/controls/$controlId" params={{ controlId: item.controlId }} className={className}>
        {children}
      </Link>
    );
  }
  if (item.kind === "asset" && item.systemId) {
    return (
      <Link to="/systems/$systemId" params={{ systemId: item.systemId }} className={className}>
        {children}
      </Link>
    );
  }
  if (item.kind === "poam" || item.kind === "finding") {
    return (
      <Link to="/poam" className={className}>
        {children}
      </Link>
    );
  }
  if (item.kind === "evidence") {
    return (
      <Link to="/evidence" className={className}>
        {children}
      </Link>
    );
  }
  if (item.kind === "assessment") {
    return (
      <Link to="/assessments" className={className}>
        {children}
      </Link>
    );
  }
  if (item.kind === "vulnerability") {
    return (
      <Link to="/monitoring" className={className}>
        {children}
      </Link>
    );
  }
  if (item.kind === "agent" || item.kind === "agent-run") {
    return (
      <Link to="/agents" className={className}>
        {children}
      </Link>
    );
  }
  return <div>{children}</div>;
}

function KindChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-9 shrink-0 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
          : "h-9 shrink-0 rounded-md bg-secondary px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}
