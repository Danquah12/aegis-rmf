import { CATO_STAGES, type CatoHealth } from "@/lib/grc/layer3";
import { StatusBadge } from "@/components/grc/status-badge";
import { cn } from "@/lib/utils";

export function CatoLoop({
  health,
  reasons,
}: {
  health: CatoHealth;
  reasons: string[];
}) {
  const active =
    health === "not_authorized"
      ? "cato-ato"
      : health === "reassess"
        ? "cato-reassess"
        : health === "review_required"
          ? "cato-human"
          : "cato-state";
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <div className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Continuous authorization</div>
          <div className="text-sm font-medium">Engine stages residual risk. Humans still authorize.</div>
        </div>
        <StatusBadge status={health} />
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-4 py-3">
        {CATO_STAGES.map((s) => (
          <div
            key={s.id}
            className={cn(
              "min-h-20 min-w-36 shrink-0 rounded-md border px-3 py-2",
              s.id === active ? "border-primary bg-secondary" : "border-border bg-background",
            )}
          >
            <div className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">{s.actor}</div>
            <div className="text-sm font-medium">{s.label}</div>
          </div>
        ))}
      </div>
      <ul className="space-y-1 border-t border-border px-4 py-3 text-sm text-muted-foreground">
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
        {CATO_STAGES.find((s) => s.id === active) ? (
          <li>{CATO_STAGES.find((s) => s.id === active)?.summary}</li>
        ) : null}
      </ul>
    </div>
  );
}
