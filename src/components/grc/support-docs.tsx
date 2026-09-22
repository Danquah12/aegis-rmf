import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
import { RMF_STEP_META, RMF_STEPS } from "@/lib/grc/cycle";
import { saveSupportDocument } from "@/lib/grc/queries";
import {
  compareSupportDocs,
  DOC_KINDS,
  isDocKind,
  parseControlIds,
  STEP_DOC_HINT,
  STEP_DOC_KIND,
} from "@/lib/grc/support-docs";
import type { PortfolioSnapshot, RmfStep } from "@/lib/grc/types";
import { cn } from "@/lib/utils";

function firstEmptyStep(data: PortfolioSnapshot, systemId: string, fallback: RmfStep): RmfStep {
  return RMF_STEPS.find((s) => compareSupportDocs(data, systemId, s).docs === 0) ?? fallback;
}

export function SupportDocsPanel({
  data,
  systemId,
  defaultStep,
  numbered,
}: {
  data: PortfolioSnapshot;
  systemId: string;
  defaultStep?: RmfStep;
  numbered?: boolean;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState<RmfStep>(() => firstEmptyStep(data, systemId, defaultStep ?? "select"));
  const [kind, setKind] = useState(STEP_DOC_KIND[step]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [controlIds, setControlIds] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    setStep(firstEmptyStep(data, systemId, defaultStep ?? "select"));
    setTitle("");
    setBody("");
    setControlIds("");
    setUrl("");
  }, [systemId]);

  useEffect(() => {
    setKind(STEP_DOC_KIND[step]);
  }, [step]);

  const overall = useMemo(() => compareSupportDocs(data, systemId), [data, systemId]);
  const perStep = useMemo(
    () => RMF_STEPS.map((s) => ({ step: s, cmp: compareSupportDocs(data, systemId, s) })),
    [data, systemId],
  );
  const active = perStep.find((p) => p.step === step)?.cmp;
  const docs = (data.supportDocuments ?? []).filter((d) => d.systemId === systemId && d.rmfStep === step);
  const phasesWithDocs = perStep.filter((p) => p.cmp.docs > 0).length;
  const selectedIds = parseControlIds(controlIds);

  function toggleId(id: string) {
    const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    setControlIds(next.join(", "));
  }

  const saveMut = useMutation({
    mutationFn: (payload: {
      systemId: string;
      rmfStep: RmfStep;
      kind: string;
      title: string;
      body: string;
      controlIds: string;
      url?: string;
    }) => saveSupportDocument({ data: payload }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Attached to ${RMF_STEP_META[step].name}. Engine will compare it to the tailored set.`);
      setTitle("");
      setBody("");
      setControlIds("");
      setUrl("");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      const remaining = RMF_STEPS.filter((s) => s !== step).find(
        (s) => compareSupportDocs(data, systemId, s).docs === 0,
      );
      if (remaining) setStep(remaining);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not attach the document.");
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{numbered ? "3 · Supporting documentation" : "Supporting documentation"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Walk all seven RMF phases. Attach the artifact for the selected chip and map the tailored (selected, not
          N/A) control IDs it supports. The engine compares that mapping at every step. Paste text or a link — not a
          binary file.
        </p>
        <Meter
          value={overall.percent}
          label={`Tailored controls mapped (${overall.covered}/${overall.tailored}) · documents on ${phasesWithDocs} of 7 phases`}
        />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {perStep.map(({ step: s, cmp }) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={cn(
                "flex min-h-11 min-w-28 shrink-0 flex-col justify-center rounded-lg border px-3 py-2 text-left",
                step === s
                  ? "border-primary bg-secondary text-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <span className="font-mono text-[11px] uppercase tracking-wide">
                {RMF_STEP_META[s].index} {RMF_STEP_META[s].short}
              </span>
              <span className="font-display text-base leading-tight text-foreground">{RMF_STEP_META[s].name}</span>
              <span className="font-mono text-[11px] tabular-nums">
                {cmp.covered}/{cmp.tailored} · {cmp.docs} docs
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{STEP_DOC_HINT[step]}</p>
        {active ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-secondary/50 px-3 py-2">
              <div className="text-[11px] tracking-wide text-muted-foreground uppercase">Covered</div>
              <div className="font-mono text-lg tabular-nums">{active.covered}</div>
            </div>
            <div className="rounded-md bg-secondary/50 px-3 py-2">
              <div className="text-[11px] tracking-wide text-muted-foreground uppercase">Gaps</div>
              <div className="font-mono text-lg tabular-nums">{active.gapIds.length}</div>
            </div>
            <div className="rounded-md bg-secondary/50 px-3 py-2">
              <div className="text-[11px] tracking-wide text-muted-foreground uppercase">Not in tailored set</div>
              <div className="font-mono text-lg tabular-nums">{active.extra}</div>
            </div>
          </div>
        ) : null}

        {active && active.gapIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {active.gapIds.length} tailored IDs unmapped on {RMF_STEP_META[step].name}.
            </span>
            <div className="flex flex-wrap gap-1.5">
              {active.gapIds.slice(0, 10).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleId(id)}
                  className={cn(
                    "min-h-8 rounded-md border px-2 font-mono text-[11px]",
                    selectedIds.includes(id)
                      ? "border-primary bg-secondary text-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {id}
                </button>
              ))}
              {active.gapIds.length > 10 ? (
                <span className="self-center font-mono text-[11px] text-muted-foreground">
                  +{active.gapIds.length - 10} more
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
          <div className="text-sm font-medium">Attach a document to {RMF_STEP_META[step].name}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="doc-kind">Kind</Label>
              <Select
                value={kind}
                onValueChange={(value) => {
                  if (isDocKind(value)) setKind(value);
                }}
              >
                <SelectTrigger id="doc-kind" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_KINDS.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${RMF_STEP_META[step].name} artifact`}
                className="min-h-11"
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <Label htmlFor="doc-controls">Tailored control IDs this document supports</Label>
              {active && active.gapIds.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setControlIds(active.gapIds.join(", "))}
                >
                  Map remaining {active.gapIds.length} IDs
                </Button>
              ) : null}
            </div>
            <Input
              id="doc-controls"
              value={controlIds}
              onChange={(e) => setControlIds(e.target.value)}
              placeholder="PL-2, AC-3, SC-28"
              className="min-h-11"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-body">Document text</Label>
            <Textarea
              id="doc-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Paste the worksheet, overlay, SSP excerpt, SAP, residual-risk brief, or ConMon strategy."
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-url">Link (optional)</Label>
            <Input
              id="doc-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              className="min-h-11"
            />
          </div>
          <Button
            className="min-h-11"
            disabled={saveMut.isPending}
            onClick={() =>
              saveMut.mutate({
                systemId,
                rmfStep: step,
                kind,
                title,
                body,
                controlIds,
                url: url || undefined,
              })
            }
          >
            {saveMut.isPending ? "Saving…" : `Attach to ${RMF_STEP_META[step].name}`}
          </Button>
        </div>

        <div className="space-y-2">
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents on {RMF_STEP_META[step].name} yet. Attach one above before running the engine.
            </p>
          ) : (
            docs.map((d) => (
              <div key={d.id} className="rounded-md border border-border px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-medium">{d.title}</div>
                  <Badge variant="outline">{DOC_KINDS.find((k) => k.id === d.kind)?.label ?? d.kind}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.body}</p>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">{d.controlIds.join(" ")}</div>
                {d.url ? (
                  <a href={d.url} className="text-xs text-primary" target="_blank" rel="noreferrer">
                    {d.url}
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
