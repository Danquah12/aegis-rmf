import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AiAction } from "@/components/grc/ai-action";
import { AttackPathCard } from "@/components/grc/attack-path";
import { RichText } from "@/components/grc/rich-text";
import { StatusBadge } from "@/components/grc/status-badge";
import { TwinLegend, TwinMap } from "@/components/grc/twin-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { systemSlice } from "@/hooks/use-portfolio";
import {
  analyzeWhatIf,
  assessorCopilot,
  mapDataFlowAi,
  reviewArchitecture,
} from "@/lib/grc/ai";
import {
  DATA_FLOWS,
  INTERVIEW_BANK,
  attackPathsFor,
  atoImpactLabel,
  evidenceGaps,
  evidenceQuality,
  twinFor,
  whatIfFor,
} from "@/lib/grc/layer3";
import { requestRecollection, runWhatIf, saveInterview } from "@/lib/grc/queries";
import type { PortfolioSnapshot } from "@/lib/grc/types";

export function TwinView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const slice = systemSlice(data, systemId);
  const twin = twinFor(systemId);
  const flow = DATA_FLOWS.find((f) => f.systemId === systemId) ?? DATA_FLOWS[0];
  const [memo, setMemo] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => mapDataFlowAi({ data: { systemId } }),
    onSuccess: (res) => {
      if (res.ok) setMemo(res.text);
      else toast.error(res.error);
    },
  });
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap gap-2">
        <AiAction label="Map data flow" pending={mut.isPending} onClick={() => mut.mutate()} />
        <Button variant="outline" size="sm" asChild>
          <Link to="/twin">Fleet twin</Link>
        </Button>
      </div>
      <TwinMap nodes={twin.nodes} edges={twin.edges} systemId={systemId} />
      <TwinLegend />
      <Card>
        <CardHeader>
          <CardTitle>Inventory mapped to controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {twin.nodes.map((n) => (
            <div key={n.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-secondary/60 px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm font-medium">{n.label}</div>
                <div className="text-xs text-muted-foreground">
                  {n.kind} · {n.detail}
                  {n.assetId ? ` · ${n.assetId}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 font-mono text-[11px] text-muted-foreground">
                {n.controlIds.map((id) => (
                  <Link key={id} to="/controls/$controlId" params={{ controlId: id }} className="text-primary">
                    {id}
                  </Link>
                ))}
                {n.vulnIds.map((id) => (
                  <span key={id}>{id}</span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Canonical data flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {flow.steps.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                {i > 0 ? <span className="text-muted-foreground">→</span> : null}
                <span className="rounded-md bg-secondary px-2 py-1">{s}</span>
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {flow.data} · {flow.controls.join(" ")}
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Assets" value={String(slice.assets.length)} />
        <Stat label="Open vulns" value={String(slice.vulnerabilities.filter((v) => v.status === "open").length)} />
        <Stat label="POA&M open" value={String(slice.poams.filter((p) => p.status !== "completed").length)} />
      </div>
      {memo ? (
        <Card>
          <CardHeader>
            <CardTitle>Data-flow map (unofficial)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <RichText text={memo} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function AttackView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const paths = attackPathsFor(systemId);
  return (
    <div className="min-w-0 space-y-4">
      <p className="text-sm text-muted-foreground">
        Attack path → vulnerability → asset → system → control → risk → POA&M → ATO impact. Agents do not change authorization.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        {paths.map((p) => (
          <AttackPathCard key={p.id} path={p} />
        ))}
      </div>
      {!paths.length ? (
        <p className="text-sm text-muted-foreground">No correlated attack paths on this package.</p>
      ) : null}
      <Button variant="outline" size="sm" asChild>
        <Link to="/attack">Fleet attack graph</Link>
      </Button>
    </div>
  );
}

export function SimulateView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const slice = systemSlice(data, systemId);
  const scenarios = whatIfFor(systemId);
  const qc = useQueryClient();
  const [memo, setMemo] = useState<string | null>(null);
  const [arch, setArch] = useState("");
  const simMut = useMutation({
    mutationFn: async (s: (typeof scenarios)[number]) => {
      const canned = `${s.architecture}\n\nEvidence: ${s.evidence}\n\nPOA&M: ${s.poam}\n\nRisk: ${s.risk}`;
      await runWhatIf({
        data: {
          systemId,
          scenario: s.title,
          result: canned,
          atoImpact: s.atoImpact,
        },
      });
      toast.success(`Simulation recorded. ${atoImpactLabel(s.atoImpact)}. ATO unchanged.`);
      await qc.invalidateQueries({ queryKey: ["portfolio"] });
      const ai = await analyzeWhatIf({ data: { systemId, scenario: s.prompt } });
      return { text: ai.ok ? ai.text : canned, impact: s.atoImpact, aiError: ai.ok ? null : ai.error };
    },
    onSuccess: (res) => {
      setMemo(res.text);
      if (res.aiError) toast.message(res.aiError);
    },
  });
  const archMut = useMutation({
    mutationFn: () => reviewArchitecture({ data: { systemId, description: arch } }),
    onSuccess: (res) => {
      if (res.ok) setMemo(res.text);
      else toast.error(res.error);
    },
  });
  return (
    <div className="min-w-0 space-y-4">
      <p className="text-sm text-muted-foreground">
        Simulations write a what-if run. They never disable MFA, move a database, or alter the ATO.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {scenarios.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{s.prompt}</p>
              <div className="flex flex-wrap gap-1 font-mono text-[11px] text-muted-foreground">
                {s.affectedControls.map((id) => (
                  <span key={id}>{id}</span>
                ))}
              </div>
              <StatusBadge status={atoImpactLabel(s.atoImpact)} />
              <Button size="sm" onClick={() => simMut.mutate(s)} disabled={simMut.isPending}>
                Run what-if
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Architecture reviewer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste a diagram description, Terraform, or draw.io XML. Binary Visio/PDF is not parsed here.
          </p>
          <Textarea
            value={arch}
            onChange={(e) => setArch(e.target.value)}
            placeholder="Internet → WAF → API gateway → EKS → Aurora. CDS out of boundary."
            rows={5}
          />
          <AiAction label="Review architecture" pending={archMut.isPending} onClick={() => archMut.mutate()} />
        </CardContent>
      </Card>
      {slice.whatIfRuns.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Recorded simulations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {slice.whatIfRuns.slice(0, 6).map((r) => (
              <div key={r.id} className="rounded-md bg-secondary/60 px-3 py-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{r.scenario}</span>
                  <StatusBadge status={r.atoImpact} />
                </div>
                <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{r.result}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {memo ? (
        <Card>
          <CardHeader>
            <CardTitle>Simulation (unofficial)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <RichText text={memo} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function AssessorView({ data, systemId }: { data: PortfolioSnapshot; systemId: string }) {
  const slice = systemSlice(data, systemId);
  const gaps = evidenceGaps(slice.implementations, slice.evidence).filter((g) => g.status !== "ok");
  const qc = useQueryClient();
  const [memo, setMemo] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const q = INTERVIEW_BANK[qIndex % INTERVIEW_BANK.length];
  const copilot = useMutation({
    mutationFn: () => assessorCopilot({ data: { systemId, controlId: q.controlId } }),
    onSuccess: (res) => {
      if (res.ok) setMemo(res.text);
      else toast.error(res.error);
    },
  });
  const recoll = useMutation({
    mutationFn: (controlId: string) => requestRecollection({ data: { systemId, controlId } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Recollection queued. Control not marked satisfied. ATO unchanged.");
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      }
    },
  });
  const interviewMut = useMutation({
    mutationFn: () => {
      const flag = /17|orphan|password|KEV|undocumented/i.test(answer)
        ? "Contradicts telemetry"
        : answer.trim().length < 12
          ? "Incomplete"
          : null;
      return saveInterview({
        data: {
          systemId,
          controlId: q.controlId,
          question: q.question,
          answer: answer.trim(),
          flag,
          assessor: "SCA",
        },
      });
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Interview recorded. Assessor still decides.");
        setAnswer("");
        setQIndex((i) => i + 1);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      }
    },
  });
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap gap-2">
        <AiAction label="Assessor copilot" pending={copilot.isPending} onClick={() => copilot.mutate()} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Evidence gaps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {gaps.slice(0, 12).map((g) => (
            <div key={g.controlId} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-secondary/60 px-3 py-2">
              <div>
                <Link to="/controls/$controlId" params={{ controlId: g.controlId }} className="font-mono text-sm text-primary">
                  {g.controlId}
                </Link>
                <p className="text-xs text-muted-foreground">{g.detail}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={g.status} />
                {g.status === "expired" || g.status === "missing" ? (
                  <Button size="sm" variant="outline" onClick={() => recoll.mutate(g.controlId)} disabled={recoll.isPending}>
                    Recollect
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Evidence quality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {slice.evidence.slice(0, 8).map((e) => {
            const qe = evidenceQuality(e);
            return (
              <div key={e.id} className="rounded-md bg-secondary/60 px-3 py-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-sm">{e.title}</span>
                  <StatusBadge status={qe.lifecycle} />
                </div>
                <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground sm:grid-cols-6">
                  <span>Rel {qe.relevance}</span>
                  <span>Fresh {qe.freshness}</span>
                  <span>Auth {qe.authenticity}</span>
                  <span>Comp {qe.completeness}</span>
                  <span>Cov {qe.coverage}</span>
                  <span>Int {qe.integrity}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Interview · {q.controlId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{q.question}</p>
          <p className="text-xs text-muted-foreground">{q.expected}</p>
          <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} placeholder="Assessee response" />
          <Button size="sm" onClick={() => interviewMut.mutate()} disabled={interviewMut.isPending || !answer.trim()}>
            Record interview
          </Button>
          {slice.interviews.length ? (
            <div className="space-y-2 pt-2">
              {slice.interviews.slice(0, 4).map((i) => (
                <div key={i.id} className="text-sm">
                  <span className="font-mono text-xs">{i.controlId}</span> · {i.answer}
                  {i.flag ? <StatusBadge status={i.flag} /> : null}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
      {memo ? (
        <Card>
          <CardHeader>
            <CardTitle>Assessor notes (unofficial)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <RichText text={memo} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-3xl tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
