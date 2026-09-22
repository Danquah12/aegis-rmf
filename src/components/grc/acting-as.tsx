import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActingRole } from "@/hooks/use-acting-role";
import { RMF_ROLES, isRmfRoleId } from "@/lib/grc/phase0";
import { cn } from "@/lib/utils";

export function ActingAsPicker({
  id = "acting-role",
  compact = false,
  className,
}: {
  id?: string;
  compact?: boolean;
  className?: string;
}) {
  const { roleId, setRoleId, role } = useActingRole();
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id}>{compact ? "Acting as" : "Acting as (capability model — not a login)"}</Label>
      <Select
        value={roleId}
        onValueChange={(v) => {
          if (isRmfRoleId(v)) setRoleId(v);
        }}
      >
        <SelectTrigger id={id} className="min-h-11">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          {RMF_ROLES.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.name}
              {r.overlay ? ` · ${r.overlay}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {compact ? null : (
        <p className="text-xs text-muted-foreground">
          {role.notes} Scope: {role.scope}. There is no sign-in wall.
        </p>
      )}
    </div>
  );
}
