import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { sampleSarJson } from "@/lib/grc/assessment-ingest";
import { downloadOscal } from "@/lib/grc/oscal";
import { ingestAssessment } from "@/lib/grc/queries";
import type { PortfolioSnapshot } from "@/lib/grc/types";

export function AssessmentIngest({
  data,
  systemId,
  payload: controlled,
  onPayload,
  pending,
  onIngest,
}: {
  data: PortfolioSnapshot;
  systemId: string;
  payload?: string;
  onPayload?: (value: string) => void;
  pending?: boolean;
  onIngest?: () => void;
}) {
  const system = data.systems.find((s) => s.id === systemId);
  const [inner, setInner] = useState("");
  const payload = controlled ?? inner;
  const setPayload = onPayload ?? setInner;
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => ingestAssessment({ data: { systemId, payload } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`${res.summary}`);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  if (!system) return null;
  const busy = pending ?? mut.isPending;
  const ingest = onIngest ?? (() => mut.mutate());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment tool link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Paste OSCAL <span className="font-mono text-xs">assessment-results</span> from eMASS, Xacta, a C3PAO/3PAO workbench, or SCAP. Writes evidence, 800-53A
          objectives, and open findings. Does not issue an ATO, accept residual risk, or close a POA&M.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setPayload(sampleSarJson(systemId))}>
            Load sample SAR
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => downloadOscal(data, system)}>
            Export OSCAL package
          </Button>
        </div>
        <Textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder='{"oscal-version":"1.1.3","assessment-results":{"reviewed-controls":[{"control-id":"ac-3","result":"other","method":"test"}]}}'
          className="min-h-36 font-mono text-xs"
        />
        <Button onClick={() => ingest()} disabled={busy || !payload.trim()}>
          {busy ? "Ingesting…" : "Ingest into Assess"}
        </Button>
      </CardContent>
    </Card>
  );
}
