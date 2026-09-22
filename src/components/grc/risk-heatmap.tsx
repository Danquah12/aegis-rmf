import { Link } from "@tanstack/react-router";
import { heatMap, heatTone } from "@/lib/grc/layer1";
import type { ImpactLevel, RiskRecord } from "@/lib/grc/types";
import { cn } from "@/lib/utils";

const LEVELS: ImpactLevel[] = ["low", "moderate", "high"];

export function RiskHeatmap({ risks }: { risks: RiskRecord[] }) {
  const grid = heatMap(risks);
  const likelihoods: ImpactLevel[] = ["high", "moderate", "low"];
  return (
    <div className="min-w-0 overflow-x-auto">
      <div className="min-w-0">
        <div className="mb-2 text-center text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Impact →</div>
        <div className="grid grid-cols-[4rem_1fr_1fr_1fr] gap-2">
          <div />
          {LEVELS.map((i) => (
            <div key={i} className="text-center text-xs capitalize text-muted-foreground">
              {i}
            </div>
          ))}
          {likelihoods.map((l, row) => (
            <div key={l} className="contents">
              <div className="flex items-center text-xs capitalize text-muted-foreground">{row === 0 ? "Likelihood" : ""} {l}</div>
              {LEVELS.map((impact, col) => {
                const cell = grid[row][col];
                const tone = heatTone(l, impact);
                return (
                  <div
                    key={`${l}-${impact}`}
                    className={cn(
                      "min-h-20 rounded-md border p-2",
                      tone === "critical"
                        ? "border-other/50 bg-other/10"
                        : tone === "high"
                          ? "border-other/30 bg-secondary"
                          : tone === "moderate"
                            ? "border-partial/40 bg-secondary/60"
                            : "border-border bg-card",
                    )}
                  >
                    <div className="text-[11px] tracking-wide text-muted-foreground uppercase">{tone}</div>
                    <div className="font-display text-xl tabular-nums">{cell.length}</div>
                    {cell.slice(0, 2).map((r) => (
                      <Link
                        key={r.id}
                        to="/systems/$systemId"
                        params={{ systemId: r.systemId }}
                        search={{ view: "risk" }}
                        className="mt-1 block truncate text-[11px] text-muted-foreground"
                      >
                        {r.id} {r.controlId}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
