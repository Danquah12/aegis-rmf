import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function Meter({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const tone =
    value >= 88 ? "bg-satisfied" : value >= 70 ? "bg-partial" : "bg-other";
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {Math.round(value)}%
          </span>
        </div>
      ) : null}
      <Progress value={value} indicatorClassName={tone} />
    </div>
  );
}
