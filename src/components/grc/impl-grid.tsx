import { Link } from "@tanstack/react-router";
import { CycleBadge } from "@/components/grc/cycle-badge";
import { StatusBadge } from "@/components/grc/status-badge";
import type { ControlImplRow } from "@/lib/grc/package";
import { cn } from "@/lib/utils";

export function ImplGrid({
  rows,
}: {
  rows: ControlImplRow[];
}) {
  if (rows.length === 0) {
    return (
      <p className="px-5 py-8 text-sm text-muted-foreground">No controls match this filter.</p>
    );
  }
  const multi = new Set(rows.map((r) => r.packageAcronym)).size > 1;
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[52rem] text-left text-xs">
        <thead>
          <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
            {multi ? <th className="px-3 py-2 font-medium">Package</th> : null}
            <th className="px-3 py-2 font-medium">Control</th>
            <th className="px-3 py-2 font-medium">Origination</th>
            <th className="px-3 py-2 font-medium">Implementation</th>
            <th className="px-3 py-2 font-medium">Assessment</th>
            <th className="px-3 py-2 font-medium">Methods</th>
            <th className="px-3 py-2 font-medium">Evidence</th>
            <th className="px-3 py-2 font-medium">Automation</th>
            <th className="px-3 py-2 font-medium">Step</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.packageAcronym}-${r.controlId}`} className="border-b border-border/70 align-top">
              {multi ? (
                <td className="px-3 py-2 font-medium">{r.packageAcronym}</td>
              ) : null}
              <td className="px-3 py-2">
                <Link
                  to="/controls/$controlId"
                  params={{ controlId: r.controlId }}
                  className="font-mono text-xs"
                >
                  {r.controlId}
                </Link>
                <div className={cn("max-w-xs text-sm")}>{r.title}</div>
              </td>
              <td className="px-3 py-2">
                <StatusBadge status={r.origination} />
                {r.inheritedFrom ? (
                  <div className="mt-1 text-[11px] text-muted-foreground">{r.inheritedFrom}</div>
                ) : null}
              </td>
              <td className="px-3 py-2">
                <StatusBadge status={r.implementation} />
              </td>
              <td className="px-3 py-2">
                <StatusBadge status={r.assessment} />
                {r.openFindings || r.openPoams ? (
                  <div className="mt-1 text-[11px] text-other">
                    {r.openFindings ? `${r.openFindings} finding` : ""}
                    {r.openFindings && r.openPoams ? " · " : ""}
                    {r.openPoams ? `${r.openPoams} POA&M` : ""}
                  </div>
                ) : null}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{r.methods.join(" / ")}</td>
              <td className="px-3 py-2 font-mono tabular-nums">{r.evidenceCount}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.automation ?? "Manual"}</td>
              <td className="px-3 py-2">
                <CycleBadge step={r.rmfStep} link={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
