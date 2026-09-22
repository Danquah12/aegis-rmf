import { Link } from "@tanstack/react-router";
import type { TwinEdge, TwinKind, TwinNode } from "@/lib/grc/layer3";
import { cn } from "@/lib/utils";

const KIND_STROKE: Record<TwinKind, string> = {
  app: "var(--color-primary)",
  server: "var(--color-info)",
  container: "var(--color-info)",
  network: "var(--color-partial)",
  database: "var(--color-satisfied)",
  cloud: "var(--color-primary)",
  data: "var(--color-satisfied)",
  user: "var(--color-info)",
  control: "var(--color-partial)",
  vuln: "var(--color-other)",
  boundary: "var(--color-muted-foreground)",
};

export function TwinMap({
  nodes,
  edges,
  systemId,
}: {
  nodes: TwinNode[];
  edges: TwinEdge[];
  systemId: string;
}) {
  const width = 460;
  const height = 280;
  if (!nodes.length) {
    return (
      <p className="text-sm text-muted-foreground">No twin graph for this system yet.</p>
    );
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-w-full" role="img" aria-label="System digital twin">
        {edges.map((e) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          return (
            <line
              key={`${e.from}-${e.to}-${e.kind}`}
              x1={a.x + 36}
              y1={a.y + 14}
              x2={b.x + 36}
              y2={b.y + 14}
              stroke="var(--color-border)"
              strokeWidth="1"
            />
          );
        })}
        {nodes.map((n) => (
          <g key={n.id}>
            <rect
              x={n.x}
              y={n.y}
              width="92"
              height="44"
              rx="6"
              fill="var(--color-secondary)"
              stroke={n.inBoundary ? KIND_STROKE[n.kind] : "var(--color-muted-foreground)"}
              strokeDasharray={n.inBoundary ? undefined : "3 2"}
            />
            <text x={n.x + 46} y={n.y + 18} textAnchor="middle" fill="var(--color-foreground)" fontSize="9">
              {n.label}
            </text>
            <text x={n.x + 46} y={n.y + 32} textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="8">
              {n.kind}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
        {(["app", "server", "container", "network", "database", "cloud", "data", "user", "control", "vuln"] as TwinKind[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: KIND_STROKE[k] }} />
            {k}
          </span>
        ))}
        <Link
          to="/systems/$systemId"
          params={{ systemId }}
          search={{ view: "twin" }}
          className="text-primary"
        >
          Open twin
        </Link>
      </div>
    </div>
  );
}

export function TwinLegend({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Solid stroke is in-boundary. Dashed is outside the authorization boundary.
    </p>
  );
}
