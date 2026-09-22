import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/grc/status-badge";
import { assessmentTools, TOOL_HINTS, type AssessmentToolId } from "@/lib/grc/assessment-tools";
import { AXIOM_DASHBOARD, AXIOM_EVIDENCE, AXIOM_PORTAL } from "@/lib/grc/axiom";
import { IAC_ORIGIN, IAC_SCAN, SCA_ORIGIN, SCA_SCAN } from "@/lib/grc/axiom-suite";
import { bindingHealth } from "@/lib/grc/collection";
import { collectFromConnector, toggleConnector } from "@/lib/grc/queries";
import type { PortfolioSnapshot } from "@/lib/grc/types";

export function AssessmentToolsPanel({
  data,
  systemId,
}: {
  data: PortfolioSnapshot;
  systemId: string;
}) {
  const system = data.systems.find((s) => s.id === systemId);
  const qc = useQueryClient();
  const collectMut = useMutation({
    mutationFn: (connector: string) =>
      collectFromConnector({ data: { systemId, connector, controlId: "CA-2" } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.summary);
        qc.invalidateQueries({ queryKey: ["portfolio"] });
      } else toast.error(res.error);
    },
  });
  const togMut = useMutation({
    mutationFn: (input: { connectorId: string; enabled: boolean }) =>
      toggleConnector({ data: { systemId, connectorId: input.connectorId, enabled: input.enabled } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });

  if (!system) return null;
  const tools = assessmentTools();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Attach assessment tools</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          AXIOM DAST, SCA, and IaC auto-scan the system under assessment on Assess and ConMon. ACAS, STIG, Nmap, and
          ETEC attach here. They never issue an ATO.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          DAST:{" "}
          <a className="text-primary underline-offset-2 hover:underline" href={AXIOM_PORTAL} target="_blank" rel="noreferrer">
            portal
          </a>
          {" · "}
          <a className="text-primary underline-offset-2 hover:underline" href={AXIOM_DASHBOARD} target="_blank" rel="noreferrer">
            dashboard
          </a>
          {" · "}
          <a className="text-primary underline-offset-2 hover:underline" href={AXIOM_EVIDENCE} target="_blank" rel="noreferrer">
            evidence
          </a>
          {" — SCA: "}
          <a className="text-primary underline-offset-2 hover:underline" href={SCA_ORIGIN} target="_blank" rel="noreferrer">
            platform
          </a>
          {" · "}
          <a className="text-primary underline-offset-2 hover:underline" href={SCA_SCAN} target="_blank" rel="noreferrer">
            scan
          </a>
          {" — IaC: "}
          <a className="text-primary underline-offset-2 hover:underline" href={IAC_ORIGIN} target="_blank" rel="noreferrer">
            platform
          </a>
          {" · "}
          <a className="text-primary underline-offset-2 hover:underline" href={IAC_SCAN} target="_blank" rel="noreferrer">
            scan
          </a>
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {tools.map((c) => {
          const b = data.connectorBindings.find((x) => x.systemId === systemId && x.connectorId === c.id);
          const health = b ? bindingHealth(b) : "due";
          const hint = TOOL_HINTS[c.id as AssessmentToolId];
          const attached = b?.status === "enabled";
          return (
            <div key={c.id} className="rounded-md border border-border px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    <StatusBadge status={attached ? health : "disabled"} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
                  <p className="text-xs text-muted-foreground">{b?.lastSummary || "Not collected on this system."}</p>
                  <p className="font-mono text-[11px] text-primary">{c.controls.join(" · ")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={togMut.isPending}
                    onClick={() => togMut.mutate({ connectorId: c.id, enabled: !attached })}
                    className="min-h-11"
                  >
                    {attached ? "Detach" : "Attach"}
                  </Button>
                  <Button
                    size="sm"
                    disabled={collectMut.isPending || !attached}
                    onClick={() => collectMut.mutate(c.id)}
                    className="min-h-11"
                  >
                    Collect TEST
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
