import { Link } from "@tanstack/react-router";
import { RMF_STEP_META } from "@/lib/grc/cycle";
import type { RmfStep } from "@/lib/grc/types";
import { cn } from "@/lib/utils";

export function CycleBadge({
  step,
  className,
  link = true,
}: {
  step: RmfStep;
  className?: string;
  link?: boolean;
}) {
  const meta = RMF_STEP_META[step];
  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        className,
      )}
    >
      <span className="font-mono tabular-nums text-muted-foreground">{meta.index}</span>
      <span>{meta.name}</span>
    </span>
  );
  if (!link) return inner;
  return (
    <Link to="/cycle" search={{ step }} className="inline-flex">
      {inner}
    </Link>
  );
}
