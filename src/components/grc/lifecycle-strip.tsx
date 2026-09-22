import { RMF_STEP_META } from "@/lib/grc/cycle";
import type { StepProgress } from "@/lib/grc/layer1";
import { cn } from "@/lib/utils";

export function LifecycleStrip({
  steps,
  compact = false,
}: {
  steps: StepProgress[];
  compact?: boolean;
}) {
  return (
    <ol className={cn("grid min-w-0 gap-2", compact ? "grid-cols-2 sm:grid-cols-4 xl:grid-cols-7" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-7")}>
      {steps.map((s) => {
        const meta = RMF_STEP_META[s.step];
        return (
          <li
            key={s.step}
            className={cn(
              "rounded-lg border px-3 py-2",
              s.state === "complete"
                ? "border-satisfied/40 bg-secondary/50"
                : s.state === "active"
                  ? "border-info/50 bg-secondary/70"
                  : s.state === "pending"
                    ? "border-border bg-card"
                    : "border-partial/40 bg-secondary/50",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                {meta.index} {meta.short}
              </span>
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  s.state === "complete"
                    ? "text-satisfied"
                    : s.state === "active"
                      ? "text-info"
                      : s.state === "pending"
                        ? "text-muted-foreground"
                        : "text-partial",
                )}
              >
                {s.label}
              </span>
            </div>
            <div className="mt-1 text-sm font-medium">{meta.name}</div>
            {compact ? null : <p className="mt-1 text-[11px] text-muted-foreground">{s.detail}</p>}
          </li>
        );
      })}
    </ol>
  );
}
