import { Badge } from "@/components/ui/badge";
import { labelStatus, statusTone } from "@/lib/grc/scoring";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const tone = statusTone(status);
  const variant =
    tone === "satisfied"
      ? "satisfied"
      : tone === "partial"
        ? "partial"
        : tone === "other"
          ? "other"
          : tone === "info"
            ? "info"
            : "default";
  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {labelStatus(status)}
    </Badge>
  );
}
