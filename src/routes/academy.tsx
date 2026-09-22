import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio, completeLab } from "@/lib/grc/queries";
import { ACADEMY_COURSES, ACADEMY_LABS } from "@/lib/grc/layer3";

export const Route = createFileRoute("/academy")({
  loader: () => getPortfolio(),
  component: AcademyPage,
});

function AcademyPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (labId: string) => completeLab({ data: { labId } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Lab marked complete. This is training — not an authorization.");
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      }
    },
  });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="RMF Academy"
        title="Academy and labs"
        description="Train on RMF, 800-53, 800-53A, OSCAL, SSP, POA&M, ATO, cloud, FedRAMP, CMMC, Zero Trust, and DevSecOps. Labs do not issue ATOs."
      />
      <h2 className="mb-3 text-sm font-medium">Courses</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACADEMY_COURSES.map((c) => (
          <Card key={c.id}>
            <CardContent className="space-y-1 pt-5">
              <div className="text-sm font-medium">{c.title}</div>
              <div className="text-xs text-muted-foreground">
                {c.track} · {c.minutes} min
              </div>
              <p className="text-sm text-muted-foreground">{c.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-medium">Hands-on labs</h2>
      <div className="space-y-3">
        {ACADEMY_LABS.map((lab) => {
          const done = data.academyProgress.some((p) => p.labId === lab.id && p.status === "complete");
          return (
            <Card key={lab.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>{lab.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{lab.scenario}</p>
                </div>
                <StatusBadge status={done ? "complete" : "in_progress"} />
              </CardHeader>
              <CardContent className="space-y-3">
                <ol className="list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
                  {lab.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" asChild>
                    <Link to="/systems/$systemId" params={{ systemId: lab.systemId }} search={{ view: "overview" }}>
                      Open package
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => mut.mutate(lab.id)} disabled={mut.isPending || done}>
                    {done ? "Completed" : "Mark lab complete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
