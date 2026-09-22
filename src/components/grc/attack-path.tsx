import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/grc/status-badge";
import { atoImpactLabel, type AttackPath } from "@/lib/grc/layer3";

export function AttackPathCard({ path }: { path: AttackPath }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[11px] text-muted-foreground">{path.id}</div>
          <div className="text-sm font-medium">{path.title}</div>
        </div>
        <StatusBadge status={atoImpactLabel(path.atoImpact)} />
      </div>
      <ol className="mt-3 space-y-1.5">
        {path.steps.map((s, i) => (
          <li key={`${s.label}-${i}`} className="flex items-baseline gap-2 text-sm">
            <span className="w-4 shrink-0 text-[11px] tabular-nums text-muted-foreground">{i + 1}</span>
            <span>{s.label}</span>
            {s.ref ? <span className="font-mono text-[11px] text-muted-foreground">{s.ref}</span> : null}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted-foreground">{path.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        {path.controlIds.map((id) => (
          <Link key={id} to="/controls/$controlId" params={{ controlId: id }} className="font-mono text-primary">
            {id}
          </Link>
        ))}
        {path.poamIds.map((id) => (
          <span key={id} className="font-mono text-muted-foreground">{id}</span>
        ))}
      </div>
      {path.inherited.length ? (
        <div className="mt-2 text-[11px] text-muted-foreground">Inherited: {path.inherited.join(" · ")}</div>
      ) : null}
      {path.reassessment.length ? (
        <div className="mt-1 text-[11px] text-muted-foreground">Reassess: {path.reassessment.join(" ")}</div>
      ) : null}
    </div>
  );
}
