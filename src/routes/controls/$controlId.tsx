import { createFileRoute, Link } from "@tanstack/react-router";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTROL_BY_ID } from "@/lib/grc/catalog";
import { rmfStepForControl, RMF_STEP_META } from "@/lib/grc/cycle";
import { FAMILY_META } from "@/lib/grc/families";
import { EVIDENCE_MAPPINGS } from "@/lib/grc/mappings";
import { crosswalkFor } from "@/lib/grc/crosswalks";
import { blastRadius } from "@/lib/grc/layer1";
import { controlDep } from "@/lib/grc/layer3";
import { COMMON_CONTROL_PROVIDERS } from "@/lib/grc/package";
import { usePortfolio } from "@/hooks/use-portfolio";

export const Route = createFileRoute("/controls/$controlId")({
  component: ControlDetail,
});

function ControlDetail() {
  const { controlId } = Route.useParams();
  const control = CONTROL_BY_ID[decodeURIComponent(controlId)];
  const { data, isLoading } = usePortfolio();
  if (!control) return <ErrorState>Control {controlId} is not in the loaded catalog.</ErrorState>;
  if (isLoading) return <LoadingState />;

  const cycle = rmfStepForControl(control.id);
  const impls = data?.implementations.filter((i) => i.controlId === control.id) ?? [];
  const evidence = data?.evidence.filter((e) => e.controlId === control.id) ?? [];
  const mappings = EVIDENCE_MAPPINGS.filter((m) => m.controls.includes(control.id));

  return (
    <div>
      <PageHeader
        kicker={`${control.family} · ${FAMILY_META[control.family].name}`}
        title={`${control.id}  ${control.title}`}
        description={FAMILY_META[control.family].summary}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <CycleBadge step={cycle} />
        {control.baselines.map((b) => (
          <StatusBadge key={b} status={`${b} baseline`} />
        ))}
        {control.methods.map((m) => (
          <StatusBadge key={m} status={m} />
        ))}
      </div>
      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        RMF step {RMF_STEP_META[cycle].index} · {RMF_STEP_META[cycle].name}. {RMF_STEP_META[cycle].purpose}
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Control statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{control.statement}</p>
            <div>
              <div className="text-xs text-muted-foreground">Discussion</div>
              <p className="mt-1 text-muted-foreground">{control.discussion}</p>
            </div>
            {control.parameters?.length ? (
              <div>
                <div className="text-xs text-muted-foreground">Parameters</div>
                <ul className="mt-1 list-disc pl-4">
                  {control.parameters.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <div className="text-xs text-muted-foreground">Related controls</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {control.related.map((id) =>
                  CONTROL_BY_ID[id] ? (
                    <Link
                      key={id}
                      to="/controls/$controlId"
                      params={{ controlId: id }}
                      className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                    >
                      {id}
                    </Link>
                  ) : (
                    <span key={id} className="font-mono text-xs text-muted-foreground">
                      {id}
                    </span>
                  ),
                )}
              </div>
            </div>
            {controlDep(control.id) ? (
              <div>
                <div className="text-xs text-muted-foreground">Dependency graph</div>
                <p className="mt-1 text-sm text-muted-foreground">{controlDep(control.id)?.note}</p>
                <div className="mt-2 text-xs">
                  <span className="text-muted-foreground">Depends on </span>
                  {(controlDep(control.id)?.dependsOn ?? []).map((id) => (
                    <Link key={id} to="/controls/$controlId" params={{ controlId: id }} className="mr-2 font-mono text-primary">
                      {id}
                    </Link>
                  ))}
                </div>
                <div className="mt-1 text-xs">
                  <span className="text-muted-foreground">Dependents </span>
                  {(controlDep(control.id)?.dependents ?? []).map((id) => (
                    <Link key={id} to="/controls/$controlId" params={{ controlId: id }} className="mr-2 font-mono text-primary">
                      {id}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-xs text-muted-foreground">Methods</div>
              <p className="capitalize">{control.methods.join(" · ")}</p>
              <div className="text-xs text-muted-foreground">Expected evidence</div>
              <ul className="list-disc pl-4 text-muted-foreground">
                {control.evidenceHints.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Source mappings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {mappings.length === 0 ? (
                <p className="text-muted-foreground">No automated source mapped yet.</p>
              ) : (
                mappings.map((m) => (
                  <div key={m.source} className="rounded-md bg-secondary/60 px-3 py-2">
                    <div>{m.source}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.authority} · {m.confidence}%
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium">Crosswalk</h2>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {crosswalkFor(control.id).length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No overlay mapping loaded for this control.</p>
            ) : (
              crosswalkFor(control.id).map((h) => (
                <div key={`${h.pack}-${h.ref}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{h.ref}</div>
                    <div>{h.title}</div>
                  </div>
                  <StatusBadge status={h.pack} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
      {data ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-medium">Inheritance blast radius</h2>
          <Card>
            <CardContent className="space-y-2 pt-5 text-sm">
              {(() => {
                const hit = blastRadius(control.id, data);
                const provider = COMMON_CONTROL_PROVIDERS.find(
                  (p) => p.controls.includes(control.id) || p.controls.includes(control.id.replace(/\([^)]+\)$/, "")),
                );
                return (
                  <>
                    <p>
                      {provider
                        ? `${provider.acronym} offers this control. Changing it would affect ${hit.count} consumer packages.`
                        : "This control is not published as a common control. Changes stay on the consuming system."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {hit.systems.map((s) => (
                        <Link
                          key={s.id}
                          to="/systems/$systemId"
                          params={{ systemId: s.id }}
                          search={{ view: "controls" }}
                          className="text-xs text-primary"
                        >
                          {s.acronym}
                        </Link>
                      ))}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </section>
      ) : null}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium">Implementations across systems</h2>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {impls.map((i) => {
              const sys = data?.systems.find((s) => s.id === i.systemId);
              return (
                <Link
                  key={i.id}
                  to="/systems/$systemId"
                  params={{ systemId: i.systemId }}
                  className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm">{sys?.acronym}</div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{i.statement}</p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={i.status} />
                    <StatusBadge status={`${i.confidence}%`} />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>
      {evidence.length ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-medium">Bound evidence</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {evidence.map((e) => (
              <Card key={e.id}>
                <CardContent className="pt-5 text-sm">
                  <div className="font-mono text-xs text-muted-foreground">{e.id}</div>
                  <div className="font-medium">{e.title}</div>
                  <p className="text-muted-foreground">{e.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
