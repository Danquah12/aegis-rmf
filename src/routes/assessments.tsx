import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { AssessmentPipeline } from "@/components/grc/assessment-pipeline";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio } from "@/lib/grc/queries";
import { rmfStepForAssessment } from "@/lib/grc/cycle";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/assessments")({
  loader: () => getPortfolio(),
  component: AssessmentsPage,
});

function AssessmentsPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const [systemId, setSystemId] = useState("SYS-HELIOS");
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="800-53A · standalone"
        title="Assessments"
        description="AegisRMF records the assessment. Attach ACAS, STIG, Nmap, ETEC, and your scanners. Collect evidence, run TEST procedures, record SAT / other, open findings. Collectors never issue an ATO."
        actions={
          <Button asChild>
            <Link to="/engine">Run RMF engine</Link>
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {data.systems.map((s) => (
          <Button
            key={s.id}
            size="sm"
            variant={systemId === s.id ? "default" : "outline"}
            onClick={() => setSystemId(s.id)}
          >
            {s.acronym}
          </Button>
        ))}
        <Button size="sm" variant="outline" asChild>
          <Link to="/systems/$systemId" params={{ systemId }} search={{ view: "assess" }}>
            Open 800-53A workbench
          </Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to="/integrations">Collection plane</Link>
        </Button>
      </div>
      <AssessmentPipeline data={data} systemId={systemId} />
      <h2 className="mt-8 mb-3 text-sm font-medium">Assessment records</h2>
      <div className="space-y-3">
        {data.assessments.map((a) => {
          const sys = data.systems.find((s) => s.id === a.systemId);
          return (
            <Card key={a.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{a.id}</div>
                    <div className="text-sm font-medium">
                      {sys?.acronym} · {a.kind}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CycleBadge step={rmfStepForAssessment(a.kind)} />
                    <StatusBadge status={a.status} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{a.summary}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {a.assessor} · started {formatDate(a.startedAt)}
                    {a.completedAt ? ` · completed ${formatDate(a.completedAt)}` : ""}
                  </span>
                  <Link
                    to="/systems/$systemId"
                    params={{ systemId: a.systemId }}
                    search={{ view: "assess" }}
                    className="text-primary"
                  >
                    Open Assess
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
