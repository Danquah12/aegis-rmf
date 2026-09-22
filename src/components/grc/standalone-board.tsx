import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STANDALONE_CAPABILITIES, STANDALONE_STATEMENT } from "@/lib/grc/assessment-tools";

export function StandaloneBoard({ compact = false }: { compact?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">System of record</div>
        <CardTitle className="mt-1">Standalone — eMASS / CSAM / Xacta not required</CardTitle>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{STANDALONE_STATEMENT}</p>
      </CardHeader>
      {compact ? null : (
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {STANDALONE_CAPABILITIES.map((c) => (
              <div key={`${c.replaces}-${c.capability}`} className="rounded-md border border-border px-3 py-2">
                <div className="text-[11px] tracking-wide text-muted-foreground uppercase">{c.replaces}</div>
                <div className="text-sm">{c.capability}</div>
                <Link to={c.where} className="text-xs text-primary">
                  Open {c.where}
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
