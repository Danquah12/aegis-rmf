import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/grc/status-badge";
import type { BoundaryLayout } from "@/lib/grc/layer1";
import { cn } from "@/lib/utils";

function fill(kind: BoundaryLayout["nodes"][number]["kind"]) {
  switch (kind) {
    case "internet":
      return "var(--color-muted-foreground)";
    case "edge":
      return "var(--color-info)";
    case "app":
      return "var(--color-primary)";
    case "data":
      return "var(--color-partial)";
    case "identity":
      return "var(--color-satisfied)";
    case "ops":
      return "var(--color-info)";
    default:
      return "var(--color-other)";
  }
}

export function BoundaryDesigner({ layout }: { layout: BoundaryLayout }) {
  const [active, setActive] = useState<string | null>(layout.nodes.find((n) => n.inBoundary)?.id ?? null);
  const node = layout.nodes.find((n) => n.id === active);
  const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_16rem]">
      <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
        <svg viewBox="0 0 400 320" className="h-auto w-full" role="img" aria-label="Authorization boundary">
          <rect x="36" y="128" width="328" height="164" rx="10" fill="none" stroke="var(--color-border)" strokeDasharray="6 4" />
          <text x="48" y="148" fill="var(--color-muted-foreground)" fontSize="10" letterSpacing="0.16em">
            AUTHORIZATION BOUNDARY
          </text>
          {layout.edges.map(([a, b]) => {
            const n1 = byId[a];
            const n2 = byId[b];
            if (!n1 || !n2) return null;
            return (
              <line
                key={`${a}-${b}`}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke="var(--color-border)"
                strokeWidth="1.5"
              />
            );
          })}
          {layout.nodes.map((n) => (
            <g key={n.id} onClick={() => setActive(n.id)} className="cursor-pointer">
              <rect
                x={n.x - 52}
                y={n.y - 18}
                width="104"
                height="36"
                rx="6"
                fill="var(--color-secondary)"
                stroke={active === n.id ? "var(--color-primary)" : fill(n.kind)}
                strokeWidth={active === n.id ? 2 : 1}
              />
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                fill="var(--color-foreground)"
                fontSize="11"
                fontFamily="IBM Plex Sans, sans-serif"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        {node ? (
          <div className="space-y-3">
            <div>
              <div className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Component</div>
              <div className="text-sm font-medium">{node.label}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                <StatusBadge status={node.kind} />
                <StatusBadge status={node.inBoundary ? "in boundary" : "out of boundary"} />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Allocated controls</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {node.controls.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No allocated overlay.</span>
                ) : (
                  node.controls.map((id) => (
                    <Link
                      key={id}
                      to="/controls/$controlId"
                      params={{ controlId: id }}
                      className="font-mono text-xs text-primary"
                    >
                      {id}
                    </Link>
                  ))
                )}
              </div>
            </div>
            <p className={cn("text-xs text-muted-foreground")}>
              Select step allocates controls to components as system-specific, hybrid, or common.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a component.</p>
        )}
      </div>
    </div>
  );
}
