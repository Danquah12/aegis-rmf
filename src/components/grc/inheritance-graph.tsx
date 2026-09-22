import { Link } from "@tanstack/react-router";
import { COMMON_CONTROL_PROVIDERS } from "@/lib/grc/package";
import type { PortfolioSnapshot } from "@/lib/grc/types";

export function InheritanceGraph({ data }: { data: PortfolioSnapshot }) {
  const providers = COMMON_CONTROL_PROVIDERS;
  const consumers = data.systems;
  const width = 400;
  const height = 220;
  const pY = 52;
  const cY = 168;
  const pGap = width / (providers.length + 1);
  const cGap = width / (consumers.length + 1);

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-card">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-w-full" role="img" aria-label="Control inheritance graph">
        <text x={width / 2} y="16" textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="9" letterSpacing="0.16em">
          ENTERPRISE
        </text>
        {providers.map((p, i) => {
          const x = pGap * (i + 1);
          return consumers.map((s, j) => {
            if (s.id === p.systemId) return null;
            const cx = cGap * (j + 1);
            return (
              <line
                key={`${p.id}-${s.id}`}
                x1={x}
                y1={pY + 12}
                x2={cx}
                y2={cY - 12}
                stroke="var(--color-border)"
                strokeWidth="1"
              />
            );
          });
        })}
        {providers.map((p, i) => {
          const x = pGap * (i + 1);
          return (
            <g key={p.id}>
              <rect x={x - 42} y={pY - 14} width="84" height="28" rx="6" fill="var(--color-secondary)" stroke="var(--color-info)" />
              <text x={x} y={pY + 4} textAnchor="middle" fill="var(--color-foreground)" fontSize="10">
                {p.acronym}
              </text>
            </g>
          );
        })}
        {consumers.map((s, i) => {
          const x = cGap * (i + 1);
          return (
            <g key={s.id}>
              <rect x={x - 42} y={cY - 14} width="84" height="28" rx="6" fill="var(--color-secondary)" stroke="var(--color-primary)" />
              <text x={x} y={cY + 4} textAnchor="middle" fill="var(--color-foreground)" fontSize="10">
                {s.acronym}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        {providers.map((p) => (
          <span key={p.id}>
            <span className="text-foreground">{p.acronym}</span> · {p.controls.slice(0, 4).join(" ")}
            {p.controls.length > 4 ? "…" : ""}
          </span>
        ))}
        <Link to="/inheritance" className="text-primary">
          Open inheritance
        </Link>
      </div>
    </div>
  );
}
