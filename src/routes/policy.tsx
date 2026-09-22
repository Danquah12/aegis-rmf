import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AiAction } from "@/components/grc/ai-action";
import { PageHeader } from "@/components/grc/page-header";
import { ErrorState, LoadingState } from "@/components/grc/empty-state";
import { RichText } from "@/components/grc/rich-text";
import { StatusBadge } from "@/components/grc/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { usePortfolio } from "@/hooks/use-portfolio";
import { getPortfolio, generatePolicy } from "@/lib/grc/queries";
import { policyGapAi } from "@/lib/grc/ai";
import { BASELINE_PROFILE, CONTROL_VERSIONS, REGULATORY_CHANGES } from "@/lib/grc/layer3";

export const Route = createFileRoute("/policy")({
  loader: () => getPortfolio(),
  component: PolicyPage,
});

function PolicyPage() {
  const initial = Route.useLoaderData();
  const { data, isLoading, error } = usePortfolio(initial);
  const qc = useQueryClient();
  const [paste, setPaste] = useState("");
  const [memo, setMemo] = useState<string | null>(null);
  const gapMut = useMutation({
    mutationFn: () => policyGapAi({ data: { policyText: paste } }),
    onSuccess: (res) => {
      if (res.ok) setMemo(res.text);
      else toast.error(res.error);
    },
  });
  const genMut = useMutation({
    mutationFn: () =>
      generatePolicy({
        data: {
          title: "Draft overlay policy",
          body: memo?.slice(0, 4000) || paste.slice(0, 4000) || "Draft generated from identified gaps. Human review required.",
          controls: "AC-2,IA-2,SI-2,CA-7",
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Draft ${res.id} saved. Not official policy.`);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      }
    },
  });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="min-w-0">
      <PageHeader
        kicker="Policy · versions · baseline"
        title="Policy and catalog change"
        description="Gap analysis against 800-53 / 800-53A, draft generator, regulatory change, control versioning, and the organization profile. Humans publish."
      />
      <h2 className="mb-3 text-sm font-medium">Policies on file</h2>
      <div className="mb-8 space-y-3">
        {data.policies.map((p) => (
          <Card key={p.id}>
            <CardContent className="space-y-2 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.source} · {p.updatedAt}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-sm text-muted-foreground">{p.body}</p>
              <div className="font-mono text-[11px] text-muted-foreground">{p.controls.join(" ")}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Gap analysis / generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={5}
            placeholder="Paste organizational policy text…"
          />
          <div className="flex flex-wrap gap-2">
            <AiAction label="Analyze policy gaps" pending={gapMut.isPending} onClick={() => gapMut.mutate()} />
            <Button size="sm" variant="outline" onClick={() => genMut.mutate()} disabled={genMut.isPending}>
              Save draft policy
            </Button>
          </div>
          {memo ? (
            <div className="max-h-80 overflow-auto">
              <RichText text={memo} />
            </div>
          ) : null}
        </CardContent>
      </Card>
      <h2 className="mb-3 text-sm font-medium">Regulatory change</h2>
      <div className="mb-8 space-y-3">
        {REGULATORY_CHANGES.map((r) => (
          <Card key={r.id}>
            <CardContent className="space-y-1 pt-5">
              <div className="text-sm font-medium">{r.source} · {r.title}</div>
              <div className="text-xs text-muted-foreground">{r.issued} · {r.controls.join(" ")}</div>
              <p className="text-sm text-muted-foreground">{r.ssp} {r.assessments}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-medium">Control versions</h2>
      <div className="mb-8 space-y-3">
        {CONTROL_VERSIONS.map((v) => (
          <Card key={v.id}>
            <CardContent className="pt-5 text-sm">
              <div className="font-medium">{v.id.replace("VER-", "")} · {v.from} → {v.to}</div>
              <p className="mt-1 text-muted-foreground">{v.change}</p>
              {v.systemsOnOld.length ? (
                <div className="mt-1 text-xs text-muted-foreground">Still on older wording: {v.systemsOnOld.join(", ")}</div>
              ) : (
                <div className="mt-1 text-xs text-muted-foreground">All packages on 5.2.0 language.</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-medium">Baseline optimizer</h2>
      <Card>
        <CardContent className="space-y-2 pt-5">
          <div className="text-sm font-medium">{BASELINE_PROFILE.name}</div>
          {BASELINE_PROFILE.layers.map((l) => (
            <div key={l.name} className="flex justify-between gap-3 text-sm">
              <span>{l.name}</span>
              <span className="text-muted-foreground">{l.controls} · {l.note}</span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{BASELINE_PROFILE.oscal}</p>
        </CardContent>
      </Card>
    </div>
  );
}
