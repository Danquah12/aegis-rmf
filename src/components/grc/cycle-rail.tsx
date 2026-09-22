import { RMF_STEP_META, RMF_STEPS } from "@/lib/grc/cycle";
import type { RmfStep } from "@/lib/grc/types";
import { cn } from "@/lib/utils";

export function CycleRail({
  active,
  onSelect,
  counts,
  health,
  work,
  allowAll = true,
}: {
  active: RmfStep | "all";
  onSelect: (step: RmfStep | "all") => void;
  counts?: Record<RmfStep, number>;
  health?: Record<RmfStep, number>;
  work?: Record<RmfStep, number>;
  allowAll?: boolean;
}) {
  return (
    <div className="relative min-w-0 max-w-full">
      <div className="-mx-1 flex w-full min-w-0 gap-2 overflow-x-auto px-1 pb-2">
        {allowAll ? (
          <button
            type="button"
            onClick={() => onSelect("all")}
            className={cn(
              "flex min-h-11 min-w-28 shrink-0 flex-col justify-center rounded-lg border px-3 py-2 text-left transition-colors duration-150",
              active === "all"
                ? "border-primary bg-secondary text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <span className="text-[11px] tracking-[0.14em] uppercase">All steps</span>
            <span className="font-display text-lg leading-tight">Cycle</span>
          </button>
        ) : null}
        {RMF_STEPS.map((step, i) => {
          const meta = RMF_STEP_META[step];
          const selected = active === step;
          const score = health?.[step];
          return (
            <button
              key={step}
              type="button"
              onClick={() => onSelect(step)}
              className={cn(
                "flex min-h-11 min-w-36 shrink-0 flex-col justify-center rounded-lg border px-3 py-2 text-left transition-colors duration-150",
                selected
                  ? "border-primary bg-secondary text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span className="flex items-center justify-between gap-2 text-[11px] tracking-[0.14em] uppercase">
                <span className="font-mono tabular-nums">
                  {meta.index} {meta.short}
                </span>
                {i === RMF_STEPS.length - 1 ? (
                  <span className="normal-case tracking-normal text-info">loops</span>
                ) : null}
              </span>
              <span className="font-display text-lg leading-tight">{meta.name}</span>
              <span className="mt-1 flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                <span>{counts ? `${counts[step]} items` : meta.short}</span>
                {typeof score === "number" ? <span>{score}%</span> : null}
              </span>
              {work && work[step] > 0 ? (
                <span className="mt-0.5 text-[11px] text-partial">
                  {work[step]} open
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Monitor feeds every prior step. Authorization is ongoing, not a point in time.
      </p>
    </div>
  );
}
