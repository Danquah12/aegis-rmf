import { CONTROL_BY_ID, NIST_CATALOG } from "./catalog";
import { RMF_STEPS } from "./cycle";
import { COMMON_CONTROL_PROVIDERS, impactTrio, packageCompleteness } from "./package";
import type {
  AssessmentMethod,
  AssessmentResult,
  AuthHistoryRecord,
  ConfigChangeRecord,
  EvidenceRecord,
  ImpactLevel,
  ObjectiveRecord,
  OrganizationRecord,
  PersonnelRecord,
  PortfolioSnapshot,
  ProgramRecord,
  RiskLevel,
  RiskRecord,
  RmfStep,
  SspSectionRecord,
  SystemRecord,
  TicketRecord,
} from "./types";

export const SYSTEM_VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "boundary", label: "Boundary" },
  { id: "twin", label: "Twin" },
  { id: "attack", label: "Attack" },
  { id: "controls", label: "Controls" },
  { id: "assess", label: "Assess" },
  { id: "assessor", label: "Assessor" },
  { id: "ssp", label: "SSP Studio" },
  { id: "evidence", label: "Evidence" },
  { id: "poam", label: "POA&M" },
  { id: "risk", label: "Risk" },
  { id: "simulate", label: "Simulate" },
  { id: "ato", label: "ATO" },
  { id: "conmon", label: "ConMon" },
  { id: "package", label: "Package" },
] as const;

export type SystemViewId = (typeof SYSTEM_VIEWS)[number]["id"];

export function isSystemView(value: unknown): value is SystemViewId {
  return typeof value === "string" && SYSTEM_VIEWS.some((v) => v.id === value);
}

export const ORGANIZATIONS: OrganizationRecord[] = [
  {
    id: "ORG-MD",
    name: "Mission Directorate",
    acronym: "MD",
    kind: "component",
    parentId: "ORG-DEP",
    description: "Tactical command and analytics component. Home of Aether and Helios.",
    status: "established",
  },
  {
    id: "ORG-ES",
    name: "Enterprise Services",
    acronym: "ES",
    kind: "component",
    parentId: "ORG-DEP",
    description: "Shared ICAM and common-control provider. Home of Argus.",
    status: "established",
  },
  {
    id: "ORG-CISO",
    name: "Office of the CISO",
    acronym: "CISO",
    kind: "component",
    parentId: "ORG-DEP",
    description: "Security operations component. Home of Vanguard endpoint services.",
    status: "established",
  },
];

export const PROGRAMS: ProgramRecord[] = [
  { id: "PRG-AETHER", orgId: "ORG-MD", name: "Aether Command Program", mission: "Tactical mission command and COP." },
  { id: "PRG-ICAM", orgId: "ORG-ES", name: "Enterprise ICAM", mission: "Identity, credential, and access management." },
  { id: "PRG-ANLY", orgId: "ORG-MD", name: "Mission analytics", mission: "CUI analytic lake for mission cells." },
  { id: "PRG-EDR", orgId: "ORG-CISO", name: "Endpoint services", mission: "Fleet detection and response." },
];

export const PERSONNEL: PersonnelRecord[] = [
  { id: "PER-01", systemId: "SYS-AETHER", orgId: "ORG-MD", name: "M. Calder", role: "System owner", title: "Mission Owner, Aether Program" },
  { id: "PER-02", systemId: "SYS-AETHER", orgId: "ORG-MD", name: "J. Okonkwo", role: "ISSO", title: "ISSO, Aether-C2" },
  { id: "PER-03", systemId: "SYS-AETHER", orgId: "ORG-MD", name: "R. Voss", role: "ISSM", title: "ISSM, Mission Directorate" },
  { id: "PER-04", systemId: "SYS-AETHER", orgId: "ORG-MD", name: "A. Brennan", role: "AO", title: "Authorizing Official, Mission Directorate" },
  { id: "PER-05", systemId: "SYS-AETHER", orgId: "ORG-CISO", name: "L. Hart", role: "SCA", title: "Independent assessor (3PAO analog)" },
  { id: "PER-06", systemId: "SYS-ARGUS", orgId: "ORG-ES", name: "S. Patel", role: "System owner", title: "ICAM Program Owner" },
  { id: "PER-07", systemId: "SYS-ARGUS", orgId: "ORG-ES", name: "K. Nguyen", role: "ISSO", title: "ISSO, Argus-ID" },
  { id: "PER-08", systemId: "SYS-ARGUS", orgId: "ORG-ES", name: "D. Morales", role: "AO", title: "Authorizing Official, Enterprise Services" },
  { id: "PER-09", systemId: "SYS-HELIOS", orgId: "ORG-MD", name: "E. Cho", role: "System owner", title: "Analytics Program Owner" },
  { id: "PER-10", systemId: "SYS-HELIOS", orgId: "ORG-MD", name: "T. Ibarra", role: "ISSO", title: "ISSO, Helios" },
  { id: "PER-11", systemId: "SYS-VANGUARD", orgId: "ORG-CISO", name: "N. Brooks", role: "System owner", title: "CISO Operations" },
  { id: "PER-12", systemId: null, orgId: "ORG-CISO", name: "H. Adler", role: "Risk executive", title: "Agency risk executive (function)" },
];

export const SSP_SECTION_DEFS = [
  { id: "1", title: "System identification" },
  { id: "2", title: "System environment" },
  { id: "3", title: "System categorization" },
  { id: "4", title: "Authorization boundary" },
  { id: "5", title: "Architecture" },
  { id: "6", title: "Data flow" },
  { id: "7", title: "Information types" },
  { id: "8", title: "System components" },
  { id: "9", title: "Users" },
  { id: "10", title: "External interfaces" },
  { id: "11", title: "Control implementations" },
  { id: "12", title: "Common controls" },
  { id: "13", title: "Hybrid controls" },
  { id: "14", title: "System-specific controls" },
  { id: "15", title: "Continuous monitoring" },
] as const;

export interface ConnectorDef {
  id: string;
  name: string;
  family: "cloud" | "security" | "identity" | "itsm" | "devsecops" | "assessment";
  authority: string;
  controls: string[];
  cadence: string;
}

export const CONNECTORS: ConnectorDef[] = [
  { id: "aws", name: "AWS GovCloud", family: "cloud", authority: "Config + IAM + Security Hub", controls: ["CM-6", "CM-2", "AC-3", "SC-7", "AU-12", "IA-2"], cadence: "Every 24 hours" },
  { id: "azure", name: "Azure Government", family: "cloud", authority: "Policy + Entra", controls: ["AC-2", "IA-2", "IA-2(1)", "CM-6"], cadence: "Every 24 hours" },
  { id: "gcp", name: "GCP", family: "cloud", authority: "SCC + IAM", controls: ["CM-6", "SC-7", "RA-5"], cadence: "Every 24 hours" },
  { id: "tenable", name: "Tenable", family: "security", authority: "Authenticated scan", controls: ["RA-5", "RA-5(2)", "SI-2", "CM-8"], cadence: "Daily" },
  { id: "qualys", name: "Qualys", family: "security", authority: "Policy / vuln scan", controls: ["RA-5", "SI-2", "CM-6"], cadence: "Daily" },
  { id: "splunk", name: "Splunk", family: "security", authority: "SIEM", controls: ["AU-2", "AU-3", "AU-6", "AU-12", "IR-4"], cadence: "Continuous" },
  { id: "sentinel", name: "Microsoft Sentinel", family: "security", authority: "Cloud SIEM", controls: ["AU-6", "IR-4", "SI-4", "CA-7"], cadence: "Continuous" },
  { id: "crowdstrike", name: "CrowdStrike", family: "security", authority: "EDR", controls: ["SI-3", "SI-4", "IR-4", "IR-5"], cadence: "Continuous" },
  { id: "defender", name: "Microsoft Defender", family: "security", authority: "Endpoint / identity", controls: ["SI-3", "SI-4", "IA-2"], cadence: "Continuous" },
  { id: "wiz", name: "Wiz", family: "cloud", authority: "CNAPP", controls: ["CM-6", "RA-5", "SC-7", "SC-28"], cadence: "Every 12 hours" },
  { id: "prisma", name: "Prisma Cloud", family: "cloud", authority: "CSPM", controls: ["CM-6", "SC-7", "AC-3"], cadence: "Every 12 hours" },
  { id: "github", name: "GitHub Advanced Security", family: "devsecops", authority: "Code scanning", controls: ["SA-11", "SI-2", "RA-5", "CM-3"], cadence: "On commit" },
  { id: "gitlab", name: "GitLab", family: "devsecops", authority: "SAST / dependency", controls: ["SA-11", "RA-5", "CM-3"], cadence: "On commit" },
  { id: "jira", name: "Jira", family: "itsm", authority: "Remediation tickets", controls: ["CA-5", "SI-2"], cadence: "On change" },
  { id: "servicenow", name: "ServiceNow", family: "itsm", authority: "ITSM / CMDB", controls: ["CM-3", "IR-4", "CA-5", "PS-4"], cadence: "On change" },
  { id: "k8s", name: "Kubernetes", family: "cloud", authority: "Admission / runtime", controls: ["CM-6", "SC-39", "AC-3"], cadence: "Hourly" },
  { id: "terraform", name: "Terraform", family: "devsecops", authority: "IaC state", controls: ["CM-2", "CM-6", "CM-8", "SC-7"], cadence: "On apply" },
  { id: "okta", name: "Okta", family: "identity", authority: "Workforce IdP", controls: ["AC-2", "IA-2", "IA-5"], cadence: "Hourly" },
  { id: "entra", name: "Entra ID", family: "identity", authority: "Identity lifecycle", controls: ["AC-2", "AC-2(1)", "AC-2(3)", "IA-2", "PS-4"], cadence: "Hourly" },
  { id: "ad", name: "Active Directory", family: "identity", authority: "Hybrid directory", controls: ["AC-2", "IA-2", "IA-5"], cadence: "Hourly" },
  { id: "oscal", name: "Aegis 800-53A workbench", family: "assessment", authority: "Native SAR · examine / interview / test", controls: ["CA-2", "CA-7", "PL-2", "AC-3"], cadence: "On assessment" },
  { id: "acas", name: "ACAS", family: "assessment", authority: "DoD Assured Compliance Assessment Solution", controls: ["RA-5", "RA-5(2)", "SI-2", "CM-8"], cadence: "Daily" },
  { id: "stig", name: "STIG / SCAP", family: "assessment", authority: "DISA STIG checklist · Evaluate-STIG", controls: ["CM-6", "CM-2", "CM-3", "SI-2"], cadence: "On scan" },
  { id: "nmap", name: "Nmap", family: "assessment", authority: "Network discovery and service map", controls: ["CM-8", "SC-7", "RA-5", "CA-3"], cadence: "On scan" },
  { id: "etec", name: "ETEC", family: "assessment", authority: "Evaluation test engine (attach your harness)", controls: ["CA-2", "CA-8", "SA-11", "SI-6"], cadence: "On assessment" },
  { id: "network-scan", name: "Network scanner", family: "assessment", authority: "Attach your network scanner", controls: ["SC-7", "CM-8", "SC-5", "CA-3"], cadence: "On scan" },
  { id: "app-scan", name: "Application scanner", family: "assessment", authority: "Attach your application scanner", controls: ["SA-11", "SI-10", "RA-5", "SC-8"], cadence: "On scan" },
  { id: "axiom", name: "AXIOM DAST (S2)", family: "assessment", authority: "AXIOM Security Intelligence v2 · live DAST catalog", controls: ["SA-11", "SI-10", "AC-3", "SC-7", "SC-8"], cadence: "On scan" },
  { id: "axiom-sca", name: "AXIOM SCA", family: "assessment", authority: "Software composition · SBOM / CVE catalog", controls: ["RA-5", "SI-2", "SR-3", "SA-15"], cadence: "On scan" },
  { id: "axiom-iac", name: "AXIOM IaC", family: "assessment", authority: "Terraform / Checkov / tfsec / OPA", controls: ["CM-6", "SC-7", "AC-3", "SC-28", "AU-12"], cadence: "On scan" },
];

export type StepState = "complete" | "active" | "pending" | "percent";

export interface StepProgress {
  step: RmfStep;
  state: StepState;
  label: string;
  score: number;
  detail: string;
}

export function stepProgress(p: PortfolioSnapshot, systemId: string): StepProgress[] {
  const system = p.systems.find((s) => s.id === systemId);
  if (!system) return [];
  const complete = packageCompleteness(p, systemId);
  const impls = p.implementations.filter((i) => i.systemId === systemId && i.status !== "not_applicable");
  const selected = impls.length;
  const implemented = impls.filter((i) => i.status === "implemented" || i.status === "inherited").length;
  const assessed = impls.filter((i) => i.result !== "not_assessed").length;
  const implPct = selected ? Math.round((implemented / selected) * 100) : 0;
  const assessPct = selected ? Math.round((assessed / selected) * 100) : 0;
  const evidencePct = complete.evidence;
  const current = system.rmfStep;
  const idx = RMF_STEPS.indexOf(current);

  function stateFor(step: RmfStep, score: number, doneWhen: boolean): { state: StepState; label: string } {
    const si = RMF_STEPS.indexOf(step);
    if (step === current && step === "monitor") return { state: "active", label: "ACTIVE" };
    if (step === current && score < 100) return { state: "percent", label: `${score}%` };
    if (doneWhen && si < idx) return { state: "complete", label: "COMPLETE" };
    if (doneWhen && score >= 96) return { state: "complete", label: "COMPLETE" };
    if (si > idx) return { state: "pending", label: "PENDING" };
    if (score >= 96 && si <= idx) return { state: "complete", label: "COMPLETE" };
    if (si === idx) return { state: "percent", label: `${score}%` };
    return { state: "percent", label: `${score}%` };
  }

  const prepare = stateFor("prepare", 100, true);
  const cat = stateFor("categorize", 100, Boolean(system.extra.confidentiality || system.impactLevel));
  const select = stateFor("select", selected ? 100 : 40, selected > 0);
  const implement = stateFor("implement", implPct, implPct >= 96);
  const assess = stateFor("assess", assessPct, assessPct >= 96);
  const authDone =
    system.atoStatus === "authorized" || system.atoStatus === "authorized_with_conditions";
  const authorize = authDone
    ? { state: "complete" as const, label: "COMPLETE" }
    : current === "authorize"
      ? { state: "percent" as const, label: `${complete.overall}%` }
      : idx < RMF_STEPS.indexOf("authorize")
        ? { state: "pending" as const, label: "PENDING" }
        : { state: "percent" as const, label: `${complete.overall}%` };
  const monitor =
    current === "monitor"
      ? { state: "active" as const, label: "ACTIVE" }
      : authDone
        ? { state: "pending" as const, label: "PENDING" }
        : { state: "pending" as const, label: "PENDING" };

  return [
    { step: "prepare", ...prepare, score: 100, detail: "Roles, boundary, inventory registered." },
    { step: "categorize", ...cat, score: 100, detail: `FIPS 199 ${system.impactLevel} high-water mark.` },
    { step: "select", ...select, score: selected ? 100 : 40, detail: `${complete.selected} controls selected · ${system.extra.baseline} baseline.` },
    { step: "implement", ...implement, score: implPct, detail: `${implemented}/${selected} implemented or inherited.` },
    { step: "assess", ...assess, score: assessPct, detail: `${assessed}/${selected} assessed · evidence ${evidencePct}%.` },
    { step: "authorize", ...authorize, score: complete.overall, detail: authDone ? `Decision on file (${system.extra.authorizationType ?? system.atoStatus}).` : "AO decision pending." },
    { step: "monitor", ...monitor, score: evidencePct, detail: current === "monitor" ? "Telemetry remapped to 800-53." : "ConMon starts after authorization." },
  ];
}

export function evidenceFreshness(evidence: EvidenceRecord[], asOf = "2026-09-18T12:00:00Z") {
  const now = new Date(asOf).getTime();
  const buckets = { current: 0, month: 0, stale: 0, expired: 0, total: evidence.length };
  for (const e of evidence) {
    if (e.expiresAt && new Date(e.expiresAt).getTime() < now) {
      buckets.expired += 1;
      continue;
    }
    const age = now - new Date(e.collectedAt).getTime();
    const days = age / 86_400_000;
    if (days <= 7) buckets.current += 1;
    else if (days <= 30) buckets.month += 1;
    else buckets.stale += 1;
  }
  const pct = (n: number) => (buckets.total ? Math.round((n / buckets.total) * 100) : 0);
  return {
    ...buckets,
    currentPct: pct(buckets.current),
    monthPct: pct(buckets.month),
    stalePct: pct(buckets.stale),
    expiredPct: pct(buckets.expired),
  };
}

export function ageDays(iso: string, asOf = "2026-09-18T12:00:00Z"): number {
  return Math.max(0, Math.round((new Date(asOf).getTime() - new Date(iso).getTime()) / 86_400_000));
}

const LIKELIHOOD_IDX: Record<ImpactLevel, number> = { low: 0, moderate: 1, high: 2 };
const IMPACT_IDX: Record<ImpactLevel, number> = { low: 0, moderate: 1, high: 2 };

export function heatMap(risks: RiskRecord[]) {
  const grid: RiskRecord[][][] = [
    [[], [], []],
    [[], [], []],
    [[], [], []],
  ];
  for (const r of risks.filter((x) => x.status !== "closed")) {
    grid[2 - LIKELIHOOD_IDX[r.likelihood]][IMPACT_IDX[r.impact]].push(r);
  }
  return grid;
}

export function heatTone(likelihood: ImpactLevel, impact: ImpactLevel): RiskLevel {
  const score = LIKELIHOOD_IDX[likelihood] + IMPACT_IDX[impact];
  if (score >= 4) return "critical";
  if (score >= 3) return "high";
  if (score >= 2) return "moderate";
  return "low";
}

export interface BoundaryNode {
  id: string;
  label: string;
  kind: "internet" | "edge" | "app" | "data" | "identity" | "ops" | "out";
  x: number;
  y: number;
  inBoundary: boolean;
  assetId?: string;
  controls: string[];
}

export interface BoundaryLayout {
  systemId: string;
  nodes: BoundaryNode[];
  edges: [string, string][];
}

export function boundaryLayout(system: SystemRecord, assets: { id: string; name: string; kind: string }[]): BoundaryLayout {
  const byKind = (kind: string) => assets.filter((a) => a.kind.toLowerCase().includes(kind.toLowerCase()));
  if (system.id === "SYS-AETHER") {
    return {
      systemId: system.id,
      nodes: [
        { id: "inet", label: "Internet", kind: "internet", x: 200, y: 24, inBoundary: false, controls: [] },
        { id: "fw", label: "WAF / TGW", kind: "edge", x: 200, y: 88, inBoundary: false, controls: ["SC-7", "AC-4"] },
        { id: "api", label: "API gateway", kind: "app", x: 70, y: 168, inBoundary: true, assetId: "AST-02", controls: ["SC-7", "IA-5", "SI-10"] },
        { id: "eks", label: "EKS cluster", kind: "app", x: 200, y: 168, inBoundary: true, assetId: "AST-01", controls: ["CM-6", "SC-39", "AC-3"] },
        { id: "win", label: "win-ops-12", kind: "ops", x: 330, y: 168, inBoundary: true, assetId: "AST-05", controls: ["CM-6", "SI-2", "RA-5"] },
        { id: "db", label: "Aurora", kind: "data", x: 200, y: 248, inBoundary: true, assetId: "AST-03", controls: ["SC-28", "AC-3", "AU-12"] },
        { id: "bastion", label: "Bastion", kind: "ops", x: 70, y: 248, inBoundary: true, assetId: "AST-04", controls: ["AC-6", "IA-2"] },
        { id: "cds", label: "CDS guard", kind: "out", x: 330, y: 248, inBoundary: false, controls: ["AC-4", "SC-7"] },
      ],
      edges: [
        ["inet", "fw"],
        ["fw", "api"],
        ["fw", "eks"],
        ["api", "eks"],
        ["eks", "db"],
        ["bastion", "eks"],
        ["win", "eks"],
        ["eks", "cds"],
      ],
    };
  }
  if (system.id === "SYS-ARGUS") {
    return {
      systemId: system.id,
      nodes: [
        { id: "inet", label: "Workforce / federation", kind: "internet", x: 200, y: 28, inBoundary: false, controls: [] },
        { id: "proxy", label: "App Proxy", kind: "edge", x: 200, y: 100, inBoundary: true, controls: ["SC-7", "IA-2"] },
        { id: "entra", label: "Entra tenant", kind: "identity", x: 110, y: 188, inBoundary: true, assetId: "AST-06", controls: ["AC-2", "IA-2", "IA-5"] },
        { id: "pim", label: "PIM", kind: "identity", x: 290, y: 188, inBoundary: true, assetId: "AST-07", controls: ["AC-6", "IA-2(1)"] },
        { id: "kv", label: "Key Vault", kind: "data", x: 200, y: 268, inBoundary: true, controls: ["SC-12", "SC-13"] },
      ],
      edges: [
        ["inet", "proxy"],
        ["proxy", "entra"],
        ["entra", "pim"],
        ["entra", "kv"],
      ],
    };
  }
  if (system.id === "SYS-HELIOS") {
    return {
      systemId: system.id,
      nodes: [
        { id: "aether", label: "AETHER-C2 API", kind: "out", x: 70, y: 40, inBoundary: false, controls: ["CA-3"] },
        { id: "s3", label: "S3 CUI lake", kind: "data", x: 200, y: 120, inBoundary: true, assetId: "AST-08", controls: ["SC-28", "AC-3"] },
        { id: "glue", label: "Glue / Athena", kind: "app", x: 330, y: 120, inBoundary: true, controls: ["AC-3", "AU-12"] },
        { id: "kafka", label: "On-prem Kafka", kind: "ops", x: 200, y: 220, inBoundary: true, assetId: "AST-09", controls: ["AC-3", "SC-7"] },
      ],
      edges: [
        ["aether", "s3"],
        ["s3", "glue"],
        ["kafka", "s3"],
      ],
    };
  }
  return {
    systemId: system.id,
    nodes: [
      { id: "fleet", label: "Agency fleet", kind: "ops", x: 80, y: 80, inBoundary: false, controls: [] },
      { id: "tenant", label: "EDR tenant", kind: "app", x: 240, y: 80, inBoundary: true, assetId: "AST-10", controls: ["SI-3", "SI-4"] },
      { id: "sentinel", label: "Sentinel", kind: "out", x: 240, y: 180, inBoundary: false, controls: ["AU-6", "IR-4"] },
    ],
    edges: [
      ["fleet", "tenant"],
      ["tenant", "sentinel"],
    ],
  };
}

export function defaultSspBody(system: SystemRecord, sectionId: string, p: PortfolioSnapshot): string {
  const cia = impactTrio(system);
  const assets = p.assets.filter((a) => a.systemId === system.id);
  const impls = p.implementations.filter((i) => i.systemId === system.id && i.status !== "not_applicable");
  const inherited = impls.filter((i) => i.status === "inherited");
  switch (sectionId) {
    case "1":
      return `${system.name} (${system.acronym}, ${system.id}) is operated by ${system.ownerRole}. ISSO: ${system.issoRole}. AO: ${system.aoRole}. Package ${system.extra.packageVersion ?? "1.0"}.`;
    case "2":
      return `Hosting: ${system.hosting}${system.cloudProvider ? ` · ${system.cloudProvider}` : ""}. ${system.extra.components} components, ${system.extra.interfaces} interfaces, ${system.extra.users} users.`;
    case "3":
      return `FIPS 199: confidentiality ${cia.confidentiality}, integrity ${cia.integrity}, availability ${cia.availability}. High-water mark ${system.impactLevel}. Overlay: ${system.extra.overlay ?? "none"}.`;
    case "4":
      return system.authorizationBoundary;
    case "5":
      return `Architecture is expressed in the authorization boundary designer. Inventory: ${assets.map((a) => a.name).join(", ") || "see CMDB"}.`;
    case "6":
      return (p.interconnections.filter((i) => i.systemId === system.id).map((i) => `${i.partner}: ${i.dataFlow}`).join(" ") || "Internal flows only.");
    case "7":
      return `Information types: ${system.dataTypes.join(", ")}.`;
    case "8":
      return assets.map((a) => `${a.name} (${a.kind}, ${a.environment}, ${a.criticality})`).join("; ");
    case "9":
      return system.extra.users;
    case "10":
      return p.interconnections.filter((i) => i.systemId === system.id).map((i) => `${i.kind} to ${i.partner} under ${i.agreement}`).join("; ") || "None recorded.";
    case "11":
      return `${impls.length} selected controls. ${impls.filter((i) => i.status === "implemented").length} system-implemented. Gaps remain where result is other-than-satisfied.`;
    case "12":
      return COMMON_CONTROL_PROVIDERS.filter((c) => c.systemId !== system.id)
        .map((c) => `${c.acronym} provides ${c.controls.join(", ")}`)
        .join(". ");
    case "13":
      return "Hybrid controls overlay enterprise inheritance with system-specific configuration (see origination column).";
    case "14":
      return `${impls.filter((i) => i.status === "implemented").length} system-specific implementations. ${inherited.length} fully inherited.`;
    case "15":
      return "Control status is taken from live telemetry, not the date of the last SAR. Collection jobs remap scanner, IdP, SIEM, and cloud-config evidence to 800-53 Rev. 5.";
    default:
      return "";
  }
}

export function deriveSspSections(p: PortfolioSnapshot, systemId: string): SspSectionRecord[] {
  const persisted = p.sspSections.filter((s) => s.systemId === systemId);
  if (persisted.length) return persisted;
  const system = p.systems.find((s) => s.id === systemId);
  if (!system) return [];
  return SSP_SECTION_DEFS.map((d) => ({
    id: `SSP-${systemId}-${d.id}`,
    systemId,
    sectionId: d.id,
    title: d.title,
    body: defaultSspBody(system, d.id, p),
    source: "Aegis SSP Studio",
    status: system.sspDraft || system.atoStatus !== "in_assessment" ? "draft" : "missing",
    updatedAt: "2026-09-18",
  }));
}

export function deriveObjectives(p: PortfolioSnapshot, systemId: string): ObjectiveRecord[] {
  const persisted = p.objectives.filter((o) => o.systemId === systemId);
  const byId = new Map(persisted.map((o) => [o.id, o]));
  const impls = p.implementations.filter((i) => i.systemId === systemId && i.status !== "not_applicable");
  const tests = p.testResults.filter((t) => t.systemId === systemId);
  const rows: ObjectiveRecord[] = [];
  const seen = new Set<string>();
  for (const impl of impls) {
    const control = CONTROL_BY_ID[impl.controlId];
    if (!control) continue;
    for (const method of control.methods) {
      const id = `OBJ-${systemId}-${impl.controlId}-${method}`;
      seen.add(id);
      const hit = byId.get(id);
      if (hit) {
        rows.push(hit);
        continue;
      }
      const test = tests.find((t) => t.controlId === impl.controlId && t.method === method);
      rows.push({
        id,
        systemId,
        controlId: impl.controlId,
        objectiveId: `${impl.controlId}.${method[0]}`,
        method,
        result: test?.result ?? impl.result,
        comments: test?.comments ?? impl.statement,
        assessor: impl.responsible,
        updatedAt: impl.lastVerified,
      });
    }
  }
  for (const o of persisted) {
    if (!seen.has(o.id)) rows.push(o);
  }
  return rows;
}

const SYSTEM_HOME: Record<string, { orgId: string; programId: string }> = {
  "SYS-AETHER": { orgId: "ORG-MD", programId: "PRG-AETHER" },
  "SYS-ARGUS": { orgId: "ORG-ES", programId: "PRG-ICAM" },
  "SYS-HELIOS": { orgId: "ORG-MD", programId: "PRG-ANLY" },
  "SYS-VANGUARD": { orgId: "ORG-CISO", programId: "PRG-EDR" },
};

export function orgOf(system: SystemRecord): OrganizationRecord | undefined {
  const id = system.extra.orgId ?? SYSTEM_HOME[system.id]?.orgId;
  return ORGANIZATIONS.find((o) => o.id === id);
}

export function programOf(system: SystemRecord): ProgramRecord | undefined {
  const id = system.extra.programId ?? SYSTEM_HOME[system.id]?.programId;
  return PROGRAMS.find((x) => x.id === id);
}

export function fismaMetrics(p: PortfolioSnapshot) {
  const byImpact = { low: 0, moderate: 0, high: 0 };
  const byAto: Record<string, number> = {};
  for (const s of p.systems) {
    byImpact[s.impactLevel] += 1;
    byAto[s.atoStatus] = (byAto[s.atoStatus] ?? 0) + 1;
  }
  const openPoams = p.poams.filter((x) => x.status !== "completed");
  const overdue = openPoams.filter((x) => new Date(x.dueDate).getTime() < new Date("2026-09-18").getTime());
  const openRisks = p.risks.filter((r) => r.status === "open" || r.status === "mitigating");
  const fresh = evidenceFreshness(p.evidence);
  return {
    systems: p.systems.length,
    byImpact,
    byAto,
    openPoams: openPoams.length,
    overduePoams: overdue.length,
    openFindings: p.findings.filter((f) => f.status === "open").length,
    openRisks: openRisks.length,
    criticalRisks: openRisks.filter((r) => r.riskLevel === "critical").length,
    evidenceCurrent: fresh.currentPct,
    authorized: p.systems.filter((s) => s.atoStatus === "authorized" || s.atoStatus === "authorized_with_conditions").length,
  };
}

export function blastRadius(controlId: string, p: PortfolioSnapshot) {
  const provider = COMMON_CONTROL_PROVIDERS.find(
    (c) => c.controls.includes(controlId) || c.controls.includes(controlId.replace(/\([^)]+\)$/, "")),
  );
  const consumers = p.systems.filter((s) => s.id !== provider?.systemId);
  return {
    provider,
    systems: consumers,
    count: consumers.length,
  };
}

export const SEED_RISKS: RiskRecord[] = [
  {
    id: "RSK-01",
    systemId: "SYS-AETHER",
    title: "KEV exploit on privileged ops host",
    threat: "Unauthenticated remote code execution",
    vulnerability: "CVE-2026-44102 on win-ops-12",
    assetId: "AST-05",
    controlId: "SI-2",
    likelihood: "high",
    impact: "high",
    riskLevel: "critical",
    mitigation: "Emergency patch window + EDR contain.",
    residual: "high",
    owner: "ISSO, Aether-C2",
    status: "mitigating",
    acceptanceExpires: null,
  },
  {
    id: "RSK-02",
    systemId: "SYS-AETHER",
    title: "Residual access after termination",
    threat: "Insider / stolen contractor credential",
    vulnerability: "17 terminated accounts still enabled",
    assetId: "AST-06",
    controlId: "AC-2",
    likelihood: "moderate",
    impact: "high",
    riskLevel: "high",
    mitigation: "Disable residual accounts; SCIM contractor connector.",
    residual: "moderate",
    owner: "ICAM + Aether ISSO",
    status: "open",
    acceptanceExpires: null,
  },
  {
    id: "RSK-03",
    systemId: "SYS-AETHER",
    title: "Undocumented STIG deviations",
    threat: "Configuration drift",
    vulnerability: "Nine Windows STIG deviations",
    assetId: "AST-05",
    controlId: "CM-6",
    likelihood: "moderate",
    impact: "moderate",
    riskLevel: "moderate",
    mitigation: "Deviation package + AWS Config overlay.",
    residual: "low",
    owner: "Platform engineering",
    status: "open",
    acceptanceExpires: null,
  },
  {
    id: "RSK-04",
    systemId: "SYS-HELIOS",
    title: "Kafka ACL bypass on CUI bus",
    threat: "Unauthenticated read/write of CUI events",
    vulnerability: "CVE-2026-3310",
    assetId: "AST-09",
    controlId: "AC-3",
    likelihood: "moderate",
    impact: "high",
    riskLevel: "high",
    mitigation: "Isolate broker; patch/replace.",
    residual: "moderate",
    owner: "Helios platform",
    status: "mitigating",
    acceptanceExpires: null,
  },
  {
    id: "RSK-05",
    systemId: "SYS-ARGUS",
    title: "Password SSO on legacy apps",
    threat: "Credential phishing into the IdP",
    vulnerability: "Three apps outside Conditional Access",
    assetId: "AST-06",
    controlId: "CM-6",
    likelihood: "moderate",
    impact: "moderate",
    riskLevel: "moderate",
    mitigation: "Migrate to Entra SSO.",
    residual: "low",
    owner: "ICAM engineering",
    status: "open",
    acceptanceExpires: null,
  },
  {
    id: "RSK-06",
    systemId: "SYS-AETHER",
    title: "Scan coverage gap on bastion and pods",
    threat: "Unknown vulnerabilities on privileged path",
    vulnerability: "Unauthenticated scan holes",
    assetId: "AST-04",
    controlId: "RA-5",
    likelihood: "low",
    impact: "high",
    riskLevel: "moderate",
    mitigation: "Agent on bastion + EKS node scanning.",
    residual: "low",
    owner: "Vuln management",
    status: "open",
    acceptanceExpires: null,
  },
];

export const SEED_TICKETS: TicketRecord[] = [
  { id: "TCK-1001", poamId: "POAM-284", systemId: "SYS-AETHER", source: "ServiceNow", externalId: "CHG007441", title: "Emergency patch win-ops-12 (CVE-2026-44102)", status: "in_progress", assignee: "Windows ops", updatedAt: "2026-09-18" },
  { id: "TCK-1002", poamId: "POAM-291", systemId: "SYS-AETHER", source: "Jira", externalId: "ICAM-2188", title: "Disable 17 residual Entra accounts", status: "open", assignee: "ICAM engineering", updatedAt: "2026-09-17" },
  { id: "TCK-1003", poamId: "POAM-291", systemId: "SYS-AETHER", source: "Jira", externalId: "ICAM-2201", title: "SCIM contractor offboarding connector", status: "open", assignee: "ICAM engineering", updatedAt: "2026-09-16" },
  { id: "TCK-1004", poamId: "POAM-331", systemId: "SYS-HELIOS", source: "ServiceNow", externalId: "INC441902", title: "Isolate Kafka broker ACL bypass", status: "resolved", assignee: "Helios platform", updatedAt: "2026-09-20" },
  { id: "TCK-1005", poamId: "POAM-312", systemId: "SYS-ARGUS", source: "Jira", externalId: "ICAM-1994", title: "Migrate three apps off password SSO", status: "open", assignee: "App owners", updatedAt: "2026-09-14" },
];

export const SEED_CHANGES: ConfigChangeRecord[] = [
  { id: "CHG-01", systemId: "SYS-AETHER", kind: "Firewall rule", summary: "API gateway security group added ephemeral 443 from coalition CIDR.", detectedAt: "2026-09-17T04:12:00Z", controls: ["SC-7", "AC-4", "CM-3", "CM-6"], risk: "May expand inbound path into the boundary.", status: "open" },
  { id: "CHG-02", systemId: "SYS-AETHER", kind: "Image", summary: "EKS node AMI rotated; seccomp profile changed.", detectedAt: "2026-09-15T11:40:00Z", controls: ["CM-2", "CM-6", "SI-2", "SC-39"], risk: "Runtime escape control (SC-39) may need re-test.", status: "reviewed" },
  { id: "CHG-03", systemId: "SYS-AETHER", kind: "Identity", summary: "PIM eligible role added for coalition mission admins.", detectedAt: "2026-09-12T09:00:00Z", controls: ["AC-2", "AC-6", "IA-2"], risk: "Privileged population changed.", status: "reviewed" },
  { id: "CHG-04", systemId: "SYS-HELIOS", kind: "Network", summary: "On-prem Kafka advertised listeners changed.", detectedAt: "2026-09-10T16:22:00Z", controls: ["AC-3", "SC-7", "CM-3"], risk: "Coupled to ACL bypass finding.", status: "open" },
  { id: "CHG-05", systemId: "SYS-ARGUS", kind: "Conditional Access", summary: "Legacy auth blocked except three enterprise apps.", detectedAt: "2026-09-08T08:00:00Z", controls: ["CM-6", "IA-2"], risk: "Known residual on three apps.", status: "accepted" },
];

export const SEED_AUTH_HISTORY: AuthHistoryRecord[] = [
  { id: "AH-01", systemId: "SYS-AETHER", decision: "authorized_with_conditions", actor: "Authorizing Official, Mission Directorate", conditions: "Close SI-2 KEV and AC-2 residual accounts. Monthly ConMon to AO.", expiresAt: "2027-01-23", createdAt: "2026-07-22T00:00:00Z" },
  { id: "AH-02", systemId: "SYS-ARGUS", decision: "authorized", actor: "Authorizing Official, Enterprise Services", conditions: "None. Legacy SSO tracked on POA&M.", expiresAt: "2027-06-11", createdAt: "2026-04-11T00:00:00Z" },
  { id: "AH-03", systemId: "SYS-VANGUARD", decision: "authorized", actor: "Authorizing Official, Enterprise Services", conditions: "FedRAMP inheritance + agency overlay.", expiresAt: "2027-03-01", createdAt: "2026-01-22T00:00:00Z" },
];

export function whatChangedSummary(p: PortfolioSnapshot, systemId: string) {
  const changes = p.configChanges.filter((c) => c.systemId === systemId);
  const vulns = p.vulnerabilities.filter((v) => v.systemId === systemId);
  const impls = p.implementations.filter((i) => i.systemId === systemId && (i.status === "partial" || i.result === "other"));
  const controls = [...new Set(changes.flatMap((c) => c.controls))];
  return {
    infra: changes.filter((c) => /firewall|network|image|ami|listener/i.test(c.kind + c.summary)).length,
    identity: changes.filter((c) => /identity|pim|access/i.test(c.kind + c.summary)).length,
    network: changes.filter((c) => /network|firewall|cidr|listener/i.test(c.kind + c.summary)).length,
    vulnsOpen: vulns.filter((v) => v.status === "open").length,
    vulnsKev: vulns.filter((v) => v.kev).length,
    implChanged: impls.length,
    controls,
    changes,
  };
}

export function methodLabel(method: AssessmentMethod): string {
  return method;
}

export function resultChoices(): { id: AssessmentResult | "not_applicable"; label: string }[] {
  return [
    { id: "satisfied", label: "Satisfied" },
    { id: "other", label: "Other than satisfied" },
    { id: "not_applicable", label: "Not applicable" },
    { id: "not_assessed", label: "Not assessed" },
  ];
}

export { NIST_CATALOG };
