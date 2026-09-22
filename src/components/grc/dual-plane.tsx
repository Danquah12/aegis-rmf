import { Link } from "@tanstack/react-router";

const RECORD = [
  "Systems · programs · organizations",
  "SSP / SAP / SAR · POA&M",
  "Controls · assessments · ATO",
  "Risk · evidence · ConMon",
];

const PLANE = [
  "Agents · tools · policies",
  "Memory · APIs · guardrails",
  "Collectors · change agent",
  "Human decision remains AO",
];

const LAYERS = [
  { title: "Document evidence", detail: "SSP · policies · procedures · contracts · diagrams · prior assessments" },
  { title: "System evidence", detail: "CMDB · cloud · servers · network · applications · databases" },
  { title: "Live telemetry", detail: "SIEM · EDR · scanners · IAM · CSPM · CI/CD" },
];

export function DualPlane() {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="border-b border-border p-5 md:border-r md:border-b-0">
          <div className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">RMF system of record</div>
          <ul className="mt-3 space-y-2 text-sm">
            {RECORD.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="p-5">
          <div className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">AI control plane</div>
          <ul className="mt-3 space-y-2 text-sm">
            {PLANE.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
        {LAYERS.map((layer) => (
          <div key={layer.title} className="bg-card p-4">
            <div className="text-sm font-medium">{layer.title}</div>
            <p className="mt-1 text-xs text-muted-foreground">{layer.detail}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span>Document · system · telemetry → normalize → control graph → 800-53A → recommendation → human assessor → official result</span>
        <Link to="/graph" className="text-primary">
          Knowledge graph
        </Link>
        <Link to="/engine" className="text-primary">
          RMF engine
        </Link>
        <Link to="/integrations" className="text-primary">
          Collection plane
        </Link>
        <Link to="/assessments" className="text-primary">
          Assessment pipeline
        </Link>
        <Link to="/twin" className="text-primary">
          Digital twin
        </Link>
        <Link to="/cato" className="text-primary">
          cATO engine
        </Link>
      </div>
    </div>
  );
}
