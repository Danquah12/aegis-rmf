import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiAction({
  label,
  pending,
  onClick,
}: {
  label: string;
  pending?: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={pending}>
      <Sparkles className="size-3.5" />
      {pending ? "Working…" : label}
    </Button>
  );
}
