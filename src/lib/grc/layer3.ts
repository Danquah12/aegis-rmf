import type {
  EvidenceRecord,
  ImplementationRecord,
  PortfolioSnapshot,
} from "./types";

export const L3_AS_OF = "2026-09-19T14:00:00Z";

export type TwinKind =
  | "app"
  | "server"
  | "container"
  | "network"
  | "database"
  | "cloud"
  | "data"
  | "user"
  | "control"
  | "vuln"
  | "boundary";

export interface TwinNode {
  id: string;
  systemId: string;
  kind: TwinKind;
  label: string;
  detail: string;
  assetId?: string;
  controlIds: string[];
  vulnIds: string[];
  inBoundary: boolean;
  x: number;
  y: number;
}

export interface TwinEdge {
  from: string;
  to: string;
  kind: "flow" | "depends" | "hosts" | "protects" | "exposes";
}

export type AtoImpact = "none" | "condition" | "reopen" | "suspend";

export interface AttackPath {
  id: string;
  systemId: string;
  title: string;
  steps: { label: string; kind: string; ref?: string }[];
  vulnId?: string;
  assetId?: string;
  controlIds: string[];
  poamIds: string[];
  inherited: string[];
  reassessment: string[];
  atoImpact: AtoImpact;
  summary: string;
}

export interface ControlDep {
  id: string;
  dependsOn: string[];
  dependents: string[];
  note: string;
}

export interface WhatIfScenario {
  id: string;
  systemId: string;
  title: string;
  prompt: string;
  affectedControls: string[];
  atoImpact: AtoImpact;
  architecture: string;
  evidence: string;
  poam: string;
  risk: string;
}

export interface ZtPillar {
  id: string;
  name: string;
  summary: string;
  controls: string[];
  coverage: "strong" | "partial" | "gap";
  evidence: string;
}

export interface SbomComponent {
  id: string;
  systemId: string;
  name: string;
  version: string;
  ecosystem: string;
  license: string;
  vulnId?: string;
  controlIds: string[];
  risk: string;
}

export interface VendorRecord {
  id: string;
  name: string;
  product: string;
  service: string;
  data: string;
  systems: string[];
  controls: string[];
  risk: string;
  gap: string;
}

export interface ContractObligation {
  id: string;
  source: string;
  obligation: string;
  controlIds: string[];
  evidence: string;
  systems: string[];
}

export interface RegulatoryChange {
  id: string;
  source: string;
  title: string;
  issued: string;
  controls: string[];
  systems: string[];
  ssp: string;
  policies: string[];
  assessments: string;
}

export interface ControlVersion {
  id: string;
  from: string;
  to: string;
  change: string;
  systemsOnOld: string[];
}

export interface AcademyCourse {
  id: string;
  title: string;
  track: string;
  minutes: number;
  summary: string;
}

export interface AcademyLab {
  id: string;
  title: string;
  scenario: string;
  steps: string[];
  systemId: string;
}

export interface PredictivePattern {
  id: string;
  title: string;
  evidence: string;
  systems: string[];
  controls: string[];
  trend: string;
}

export interface RedBlueSim {
  id: string;
  systemId: string;
  title: string;
  red: string;
  blue: string;
  rmf: string;
  atoNote: string;
}

export interface K8sResource {
  id: string;
  kind: string;
  name: string;
  namespace: string;
  controls: string[];
  finding: string | null;
}

export interface DevsecopsGate {
  id: string;
  name: string;
  tool: string;
  controls: string[];
  status: "passing" | "failing" | "not_wired";
  detail: string;
}

export interface AdminRole {
  id: string;
  name: string;
  persona: string;
  permissions: string[];
  notes: string;
}

export interface CatoStage {
  id: string;
  label: string;
  actor: string;
  summary: string;
}

export type CommandLens = "command" | "ciso" | "ao" | "isso" | "brief";

export function isCommandLens(value: unknown): value is CommandLens {
  return value === "command" || value === "ciso" || value === "ao" || value === "isso" || value === "brief";
}

export const TWIN_NODES: TwinNode[] = [
  { id: "TN-AE-USER", systemId: "SYS-AETHER", kind: "user", label: "Mission users", detail: "2,400 org + 180 coalition", controlIds: ["AC-2", "IA-2", "IA-5"], vulnIds: [], inBoundary: true, x: 48, y: 28 },
  { id: "TN-AE-INET", systemId: "SYS-AETHER", kind: "boundary", label: "Internet edge", detail: "Out of boundary", controlIds: ["SC-7", "AC-4"], vulnIds: [], inBoundary: false, x: 220, y: 28 },
  { id: "TN-AE-API", systemId: "SYS-AETHER", kind: "app", label: "API gateway", detail: "Internet-exposed JWT edge", assetId: "AST-02", controlIds: ["SC-7", "IA-5", "SI-10"], vulnIds: ["VUL-03"], inBoundary: true, x: 48, y: 96 },
  { id: "TN-AE-EKS", systemId: "SYS-AETHER", kind: "cloud", label: "EKS cluster", detail: "aether-eks-prod", assetId: "AST-01", controlIds: ["CM-6", "SC-39", "AC-3"], vulnIds: ["VUL-02"], inBoundary: true, x: 220, y: 96 },
  { id: "TN-AE-POD", systemId: "SYS-AETHER", kind: "container", label: "Mission pods", detail: "COP + order services", controlIds: ["CM-6", "SC-39", "RA-5"], vulnIds: ["VUL-02"], inBoundary: true, x: 390, y: 96 },
  { id: "TN-AE-WIN", systemId: "SYS-AETHER", kind: "server", label: "win-ops-12", detail: "Privileged ops host", assetId: "AST-05", controlIds: ["CM-6", "SI-2", "RA-5"], vulnIds: ["VUL-01"], inBoundary: true, x: 48, y: 168 },
  { id: "TN-AE-NET", systemId: "SYS-AETHER", kind: "network", label: "VPC / NACL / SG", detail: "GovCloud transit", controlIds: ["SC-7", "AC-4", "CM-3"], vulnIds: [], inBoundary: true, x: 220, y: 168 },
  { id: "TN-AE-DB", systemId: "SYS-AETHER", kind: "database", label: "Aurora", detail: "Mission COP store", assetId: "AST-03", controlIds: ["SC-28", "AC-3", "AU-12"], vulnIds: ["VUL-04"], inBoundary: true, x: 390, y: 168 },
  { id: "TN-AE-DATA", systemId: "SYS-AETHER", kind: "data", label: "CUI / PII / COP", detail: "High confidentiality", controlIds: ["SC-28", "AC-3", "PT-2"], vulnIds: [], inBoundary: true, x: 220, y: 236 },
  { id: "TN-AE-CTL", systemId: "SYS-AETHER", kind: "control", label: "Selected baseline", detail: "High + overlays", controlIds: ["AC-2", "IA-2", "SC-7", "SI-2", "CM-6"], vulnIds: [], inBoundary: true, x: 48, y: 236 },
  { id: "TN-AE-VUL", systemId: "SYS-AETHER", kind: "vuln", label: "Open vulns", detail: "KEV on win-ops-12", controlIds: ["SI-2", "RA-5"], vulnIds: ["VUL-01", "VUL-02", "VUL-03"], inBoundary: true, x: 390, y: 236 },

  { id: "TN-AR-USER", systemId: "SYS-ARGUS", kind: "user", label: "Workforce", detail: "18,000 identities", controlIds: ["AC-2", "IA-2"], vulnIds: [], inBoundary: true, x: 80, y: 40 },
  { id: "TN-AR-ENTRA", systemId: "SYS-ARGUS", kind: "cloud", label: "Entra tenant", detail: "IdP control plane", assetId: "AST-06", controlIds: ["AC-2", "IA-2", "IA-5"], vulnIds: [], inBoundary: true, x: 220, y: 40 },
  { id: "TN-AR-PIM", systemId: "SYS-ARGUS", kind: "app", label: "PIM", detail: "Privileged elevation", assetId: "AST-07", controlIds: ["AC-6", "IA-2(1)"], vulnIds: ["VUL-06"], inBoundary: true, x: 360, y: 40 },
  { id: "TN-AR-KV", systemId: "SYS-ARGUS", kind: "data", label: "Key Vault", detail: "Secrets / keys", controlIds: ["SC-12", "SC-13"], vulnIds: [], inBoundary: true, x: 220, y: 140 },
  { id: "TN-AR-NET", systemId: "SYS-ARGUS", kind: "network", label: "App Proxy", detail: "Federation edge", controlIds: ["SC-7", "IA-2"], vulnIds: [], inBoundary: true, x: 80, y: 140 },

  { id: "TN-HE-S3", systemId: "SYS-HELIOS", kind: "data", label: "S3 CUI lake", detail: "Object store", assetId: "AST-08", controlIds: ["SC-28", "AC-3"], vulnIds: [], inBoundary: true, x: 80, y: 48 },
  { id: "TN-HE-KFK", systemId: "SYS-HELIOS", kind: "server", label: "Kafka on-prem", detail: "Legacy broker", assetId: "AST-09", controlIds: ["AC-3", "SC-7"], vulnIds: ["VUL-05"], inBoundary: true, x: 240, y: 48 },
  { id: "TN-HE-GLUE", systemId: "SYS-HELIOS", kind: "app", label: "Glue / Athena", detail: "Analytics jobs", controlIds: ["AC-3", "AU-12"], vulnIds: [], inBoundary: true, x: 160, y: 140 },
  { id: "TN-HE-DATA", systemId: "SYS-HELIOS", kind: "data", label: "CUI datasets", detail: "Mission analytics", controlIds: ["SC-28", "PT-2"], vulnIds: [], inBoundary: true, x: 320, y: 140 },

  { id: "TN-VA-TEN", systemId: "SYS-VANGUARD", kind: "cloud", label: "EDR tenant", detail: "FedRAMP High SaaS", assetId: "AST-10", controlIds: ["SI-3", "SI-4"], vulnIds: [], inBoundary: true, x: 160, y: 60 },
  { id: "TN-VA-FLT", systemId: "SYS-VANGUARD", kind: "user", label: "Agency fleet", detail: "Endpoints out of boundary", controlIds: ["SI-4"], vulnIds: [], inBoundary: false, x: 40, y: 140 },
  { id: "TN-VA-SOC", systemId: "SYS-VANGUARD", kind: "app", label: "Sentinel", detail: "SOC detections", controlIds: ["AU-6", "IR-4"], vulnIds: [], inBoundary: false, x: 280, y: 140 },
];

export const TWIN_EDGES: TwinEdge[] = [
  { from: "TN-AE-USER", to: "TN-AE-API", kind: "flow" },
  { from: "TN-AE-INET", to: "TN-AE-API", kind: "exposes" },
  { from: "TN-AE-API", to: "TN-AE-EKS", kind: "flow" },
  { from: "TN-AE-EKS", to: "TN-AE-POD", kind: "hosts" },
  { from: "TN-AE-EKS", to: "TN-AE-DB", kind: "flow" },
  { from: "TN-AE-WIN", to: "TN-AE-EKS", kind: "depends" },
  { from: "TN-AE-NET", to: "TN-AE-EKS", kind: "protects" },
  { from: "TN-AE-NET", to: "TN-AE-DB", kind: "protects" },
  { from: "TN-AE-DB", to: "TN-AE-DATA", kind: "hosts" },
  { from: "TN-AE-CTL", to: "TN-AE-NET", kind: "protects" },
  { from: "TN-AE-VUL", to: "TN-AE-WIN", kind: "exposes" },
  { from: "TN-AE-VUL", to: "TN-AE-POD", kind: "exposes" },
  { from: "TN-AR-USER", to: "TN-AR-NET", kind: "flow" },
  { from: "TN-AR-NET", to: "TN-AR-ENTRA", kind: "flow" },
  { from: "TN-AR-ENTRA", to: "TN-AR-PIM", kind: "depends" },
  { from: "TN-AR-ENTRA", to: "TN-AR-KV", kind: "hosts" },
  { from: "TN-HE-KFK", to: "TN-HE-S3", kind: "flow" },
  { from: "TN-HE-S3", to: "TN-HE-GLUE", kind: "flow" },
  { from: "TN-HE-GLUE", to: "TN-HE-DATA", kind: "hosts" },
  { from: "TN-VA-FLT", to: "TN-VA-TEN", kind: "flow" },
  { from: "TN-VA-TEN", to: "TN-VA-SOC", kind: "flow" },
];

export const ATTACK_PATHS: AttackPath[] = [
  {
    id: "AP-AE-01",
    systemId: "SYS-AETHER",
    title: "Internet → JWT bypass → EKS → Aurora CUI",
    steps: [
      { label: "Internet", kind: "edge" },
      { label: "API gateway JWT none-alg", kind: "vuln", ref: "CVE-2026-22019" },
      { label: "aether-api-gw", kind: "asset", ref: "AST-02" },
      { label: "EKS workload impersonation", kind: "system" },
      { label: "IA-5 / SC-8 / SI-10", kind: "control" },
      { label: "Aurora CUI store", kind: "data", ref: "AST-03" },
      { label: "ATO-C residual", kind: "ato" },
    ],
    vulnId: "VUL-03",
    assetId: "AST-02",
    controlIds: ["IA-5", "SC-8", "SI-10", "SC-7"],
    poamIds: [],
    inherited: ["SC-7 (AWS-GC)"],
    reassessment: ["IA-5", "SI-10"],
    atoImpact: "reopen",
    summary: "Internet-exposed plugin bypass reaches mission data. Inherited boundary control (SC-7) does not cover application authn. Package would need reassessment of IA-5 and SI-10; AO should not treat this as in-ATO noise.",
  },
  {
    id: "AP-AE-02",
    systemId: "SYS-AETHER",
    title: "KEV spooler on win-ops-12 → lateral to EKS",
    steps: [
      { label: "Privileged ops host", kind: "asset", ref: "AST-05" },
      { label: "CVE-2026-44102 KEV", kind: "vuln", ref: "VUL-01" },
      { label: "SI-2 / RA-5 / CM-6", kind: "control" },
      { label: "POAM-284 delayed", kind: "poam", ref: "POAM-284" },
      { label: "EKS admin path", kind: "system" },
      { label: "ATO-C condition", kind: "ato" },
    ],
    vulnId: "VUL-01",
    assetId: "AST-05",
    controlIds: ["SI-2", "RA-5", "CM-6"],
    poamIds: ["POAM-284"],
    inherited: ["SI-3 / SI-4 (VANGUARD)"],
    reassessment: ["SI-2", "CM-6"],
    atoImpact: "condition",
    summary: "Existing ATO-C already conditions SI-2 closure. Path is contained by EDR inheritance but KEV remaining past due is an authorization-relevant deficiency, not a new ATO by itself.",
  },
  {
    id: "AP-AE-03",
    systemId: "SYS-AETHER",
    title: "Container runtime escape on EKS",
    steps: [
      { label: "Compromised pod", kind: "container" },
      { label: "seccomp escape", kind: "vuln", ref: "CVE-2026-11844" },
      { label: "SC-39 / CM-6 / SI-2", kind: "control" },
      { label: "Node takeover", kind: "asset", ref: "AST-01" },
      { label: "Reassessment of runtime", kind: "ato" },
    ],
    vulnId: "VUL-02",
    assetId: "AST-01",
    controlIds: ["SC-39", "CM-6", "SI-2"],
    poamIds: ["POAM-284"],
    inherited: [],
    reassessment: ["SC-39"],
    atoImpact: "condition",
    summary: "Runtime isolation (SC-39) is system-specific. AMI rotation already on the change bus. Does not by itself suspend ATO-C; SCA should re-test SC-39.",
  },
  {
    id: "AP-HE-01",
    systemId: "SYS-HELIOS",
    title: "Unauthenticated Kafka ACL bypass → CUI lake",
    steps: [
      { label: "On-prem listener", kind: "edge" },
      { label: "CVE-2026-3310", kind: "vuln", ref: "VUL-05" },
      { label: "kafka-onprem-01", kind: "asset", ref: "AST-09" },
      { label: "AC-3 / SC-7", kind: "control" },
      { label: "S3 CUI lake", kind: "data" },
      { label: "No ATO yet", kind: "ato" },
    ],
    vulnId: "VUL-05",
    assetId: "AST-09",
    controlIds: ["AC-3", "SC-7", "SI-2"],
    poamIds: ["POAM-331"],
    inherited: [],
    reassessment: ["AC-3", "SC-7"],
    atoImpact: "suspend",
    summary: "Helios is in assessment. This path is a blocker, not a continuous-authorization event. Do not issue ATO until AC-3 is other-than-satisfied closed or explicitly accepted.",
  },
];

export const CONTROL_DEPS: ControlDep[] = [
  { id: "AC-2", dependsOn: ["IA-2", "IA-5", "AU-2", "AU-6"], dependents: ["AC-3", "AC-6", "PS-4"], note: "Account management is ineffective without identification, authenticator management, and audit of account use." },
  { id: "IA-2", dependsOn: ["IA-5", "IA-4"], dependents: ["IA-2(1)", "IA-2(2)", "AC-2", "AC-6"], note: "Identification is the root of MFA, PIM, and account disablement." },
  { id: "IA-5", dependsOn: ["IA-2", "SC-12"], dependents: ["IA-2(1)", "SC-8", "SI-10"], note: "Authenticator management underpins JWT, PIV, and API keys." },
  { id: "AU-2", dependsOn: ["AU-3", "AU-12"], dependents: ["AU-6", "IR-4"], note: "Event selection must exist before review and incident correlation." },
  { id: "AU-6", dependsOn: ["AU-2", "AU-3", "AU-12"], dependents: ["IR-4", "IR-5", "CA-7"], note: "Review/correlation is the ConMon hinge for identity and boundary events." },
  { id: "SC-7", dependsOn: ["AC-4", "CM-3", "CM-6"], dependents: ["SC-8", "AC-3"], note: "Boundary protection drifts when change control and baseline config fail." },
  { id: "CM-6", dependsOn: ["CM-2", "CM-3"], dependents: ["SI-2", "RA-5", "SC-39"], note: "Secure configuration is the parent of STIG, image, and runtime settings." },
  { id: "SI-2", dependsOn: ["RA-5", "CM-6", "SA-11"], dependents: ["CA-7", "IR-4"], note: "Flaw remediation requires scanning, baselines, and a pipeline that can ship patches." },
  { id: "RA-5", dependsOn: ["CM-8"], dependents: ["SI-2", "CA-7"], note: "Scan coverage is only as good as the inventory." },
  { id: "CA-7", dependsOn: ["AU-6", "RA-5", "CM-3", "SI-4"], dependents: ["CA-6"], note: "Continuous monitoring consumes telemetry; it does not authorize." },
];

export function controlDep(id: string): ControlDep | undefined {
  const base = id.replace(/\([^)]+\)$/, "");
  return CONTROL_DEPS.find((d) => d.id === id) ?? CONTROL_DEPS.find((d) => d.id === base);
}

export const WHATIF_SCENARIOS: WhatIfScenario[] = [
  {
    id: "WF-MFA",
    systemId: "SYS-AETHER",
    title: "Disable MFA",
    prompt: "What if we disable phishing-resistant MFA for coalition mission admins?",
    affectedControls: ["IA-2", "IA-2(1)", "IA-2(2)", "AC-6", "IA-5"],
    atoImpact: "suspend",
    architecture: "PIM eligible roles and API gateway JWT become password-equivalent. Coalition path is in-boundary.",
    evidence: "EVD-1007 (PIV/FIDO enrollment) would immediately stale. Interview statements on IA-2(1) would contradict telemetry.",
    poam: "Would require a new High/Critical POA&M. Existing AC-2 residual becomes uncompensated.",
    risk: "High-impact confidentiality. AO cannot reasonably accept.",
  },
  {
    id: "WF-AZURE",
    systemId: "SYS-AETHER",
    title: "Move Aurora from AWS to Azure",
    prompt: "What if we move this database from AWS GovCloud to Azure Government?",
    affectedControls: ["SC-28", "SC-12", "SC-13", "CM-2", "CM-6", "AU-12", "CA-3"],
    atoImpact: "reopen",
    architecture: "Authorization boundary, interconnects, encryption inheritance (AWS-GC SC-12/13/28), and data-flow diagrams all change. New CSP inheritance must be proposed, not assumed.",
    evidence: "AWS Config and KMS evidence would not apply. Azure Policy / Key Vault evidence would need collection before assessment.",
    poam: "Open POA&M on SC-28 until encryption-at-rest and key custody are re-assessed.",
    risk: "Major change under SP 800-37. Package returns to Assess, not a ConMon delta.",
  },
  {
    id: "WF-API",
    systemId: "SYS-AETHER",
    title: "Expose API to the Internet",
    prompt: "What if we expose the mission API more broadly to the Internet?",
    affectedControls: ["SC-7", "AC-4", "IA-5", "SI-10", "CM-3"],
    atoImpact: "reopen",
    architecture: "Gateway is already internet-adjacent. Broadening CIDR without WAF/mTLS expands AP-AE-01.",
    evidence: "EVD-1005 (SG inventory) would flip to other-than-satisfied on SC-7.",
    poam: "Would open a High POA&M on SC-7 unless compensating WAF + mTLS evidence is attached first.",
    risk: "Matches the JWT attack path. Treat as a significant change.",
  },
  {
    id: "WF-EDR",
    systemId: "SYS-AETHER",
    title: "Replace EDR",
    prompt: "What if we replace CrowdStrike with a new EDR?",
    affectedControls: ["SI-3", "SI-4", "IR-4", "IR-5"],
    atoImpact: "condition",
    architecture: "VANGUARD inheritance of SI-3/SI-4/IR-4/IR-5 would break. New common-control provider must be authorized first.",
    evidence: "EDR detections and contain policy on win-ops-12 (compensating for POAM-284) would expire.",
    poam: "POAM-284 compensating control becomes invalid until the new EDR is assessed.",
    risk: "Do not swap EDR under an ATO-C that relies on inherited contain. Human inheritance review required.",
  },
];

export const DATA_FLOWS: { systemId: string; steps: string[]; data: string; controls: string[] }[] = [
  { systemId: "SYS-AETHER", steps: ["User", "Web / coalition client", "API gateway", "EKS application", "Aurora", "Backup / S3"], data: "CUI, PII, mission COP", controls: ["AC-3", "IA-2", "SC-8", "SC-28", "AU-12", "CP-9"] },
  { systemId: "SYS-ARGUS", steps: ["Workforce", "App Proxy", "Entra", "PIM", "Key Vault"], data: "PII, authentication assertions", controls: ["AC-2", "IA-2", "IA-5", "SC-12"] },
  { systemId: "SYS-HELIOS", steps: ["AETHER API", "S3 lake", "Glue", "Athena", "Analytic cell"], data: "CUI mission datasets", controls: ["AC-3", "SC-28", "AU-12", "CA-3"] },
];

export const INHERITANCE_SEED: {
  id: string;
  systemId: string;
  provider: string;
  controlId: string;
  rationale: string;
  status: "proposed" | "accepted" | "rejected";
}[] = [
  { id: "INH-01", systemId: "SYS-AETHER", provider: "ARGUS-ID", controlId: "IA-2", rationale: "Workforce and coalition authentication is issued by the enterprise IdP. System-specific overlay is phishing-resistant MFA for mission admins.", status: "proposed" },
  { id: "INH-02", systemId: "SYS-AETHER", provider: "ARGUS-ID", controlId: "IA-5", rationale: "Authenticator issuance and recovery live in Entra / PIM, not in AETHER application code.", status: "proposed" },
  { id: "INH-03", systemId: "SYS-AETHER", provider: "SOC-CCP", controlId: "AU-2", rationale: "Event selection for identity and endpoint is defined by the agency SOC use-case catalog.", status: "proposed" },
  { id: "INH-04", systemId: "SYS-HELIOS", provider: "AWS-GC", controlId: "SC-28", rationale: "S3 default encryption and KMS CMK are CSP-inherited under FedRAMP High. Helios still owns key policy and bucket ACLs (hybrid).", status: "proposed" },
];

export const INCIDENT_SEED: {
  id: string;
  systemId: string;
  title: string;
  severity: "critical" | "high" | "moderate";
  status: "investigating" | "contained" | "poam_opened";
  summary: string;
  assetId: string;
  controlIds: string;
  atoImpact: AtoImpact;
  createdAt: string;
}[] = [
  {
    id: "INC-01",
    systemId: "SYS-AETHER",
    title: "Suspected exploitation attempt of CVE-2026-44102 on win-ops-12",
    severity: "critical",
    status: "contained",
    summary: "EDR contain fired on spooler child process. Host isolated. KEV still unpatched. No confirmed data loss. Maps to SI-2 deficiency already on POAM-284 — ISSO may open a linked finding if this is a new deficiency vs. the same weakness.",
    assetId: "AST-05",
    controlIds: "SI-2,RA-5,IR-4,CM-6",
    atoImpact: "condition",
    createdAt: "2026-09-18T22:14:00Z",
  },
  {
    id: "INC-02",
    systemId: "SYS-HELIOS",
    title: "Anonymous ACL probe against Kafka advertised listeners",
    severity: "high",
    status: "investigating",
    summary: "Network telemetry shows unauthenticated ACL probes after listener change CHG-04. No POA&M opened from this incident yet — AC-3 finding FND-207 exists independently.",
    assetId: "AST-09",
    controlIds: "AC-3,SC-7,IR-4",
    atoImpact: "suspend",
    createdAt: "2026-09-19T02:40:00Z",
  },
];

export const POLICY_SEED: {
  id: string;
  title: string;
  status: "draft" | "published" | "gap";
  body: string;
  controls: string;
  source: string;
  updatedAt: string;
}[] = [
  {
    id: "POL-01",
    title: "Identity and access management",
    status: "published",
    body: "Organizational users shall be uniquely identified and authenticated with phishing-resistant authenticators for privileged access. Contractor disablement within 24 hours of termination.",
    controls: "AC-2,IA-2,IA-2(1),IA-5,PS-4",
    source: "Agency ICAM policy v4.2",
    updatedAt: "2026-04-11",
  },
  {
    id: "POL-02",
    title: "Vulnerability and flaw remediation",
    status: "gap",
    body: "Critical findings shall be remediated in 15 days. Does not mention CISA KEV emergency timelines or container base-image SLAs.",
    controls: "SI-2,RA-5,SA-11,SR-6",
    source: "IT SOP-VULN 2024",
    updatedAt: "2024-11-02",
  },
  {
    id: "POL-03",
    title: "Incident response",
    status: "published",
    body: "Incidents are declared in ServiceNow, triaged by SOC, and reported to the ISSO. Does not require an RMF impact determination or POA&M from confirmed deficiencies.",
    controls: "IR-4,IR-6,IR-8,CA-5",
    source: "SOC playbook 2025",
    updatedAt: "2025-09-01",
  },
];

export const REGULATORY_CHANGES: RegulatoryChange[] = [
  { id: "REG-01", source: "NIST", title: "SP 800-53 Rev. 5.2.0 control wording updates", issued: "2025-08", controls: ["AC-2", "IA-2", "SI-2", "RA-5"], systems: ["SYS-AETHER", "SYS-ARGUS", "SYS-HELIOS", "SYS-VANGUARD"], ssp: "Re-issue implementation statements where parameters changed.", policies: ["POL-01", "POL-02"], assessments: "Objectives using old wording should be re-examined, not auto-satisfied." },
  { id: "REG-02", source: "CISA", title: "KEV catalog additions — Windows spooler family", issued: "2026-09", controls: ["SI-2", "RA-5"], systems: ["SYS-AETHER"], ssp: "Flaw remediation narrative must cite KEV SLO.", policies: ["POL-02"], assessments: "SI-2 other-than-satisfied until KEV closed." },
  { id: "REG-03", source: "OMB", title: "M-26-04 Zero Trust implementation progress", issued: "2026-01", controls: ["IA-2", "AC-6", "SC-7", "SI-4"], systems: ["SYS-AETHER", "SYS-ARGUS"], ssp: "Add ZT pillar mapping to SSP §15.", policies: ["POL-01"], assessments: "Does not change ATO by itself." },
  { id: "REG-04", source: "FedRAMP", title: "Rev 5 High inheritance parameter refresh", issued: "2026-06", controls: ["SC-7", "SC-28", "CM-2"], systems: ["SYS-AETHER", "SYS-HELIOS", "SYS-VANGUARD"], ssp: "Re-validate CSP inherited parameters.", policies: [], assessments: "Hybrid controls need customer-responsibility re-test." },
];

export const CONTROL_VERSIONS: ControlVersion[] = [
  { id: "VER-AC-2", from: "Rev. 5", to: "5.2.0", change: "Account management: stronger disablement and shared-account language; organizational parameters tightened.", systemsOnOld: [] },
  { id: "VER-IA-2", from: "5.1.1", to: "5.2.0", change: "Identification and authentication: phishing-resistant authenticator language aligned to 800-63.", systemsOnOld: ["SYS-HELIOS"] },
  { id: "VER-SI-2", from: "Rev. 5", to: "5.2.0", change: "Flaw remediation: explicit prioritization for known exploited vulnerabilities.", systemsOnOld: [] },
];

export const BASELINE_PROFILE = {
  id: "PRF-MD-HIGH-ZT",
  name: "Mission Directorate High + ZT",
  layers: [
    { name: "NIST 800-53B High", controls: 124, note: "Canonical baseline." },
    { name: "Agency overlay", controls: 18, note: "Privacy + ICAM parameters." },
    { name: "Mission overlay", controls: 9, note: "Tactical coalition federation." },
    { name: "Cloud overlay", controls: 22, note: "FedRAMP High customer responsibility." },
    { name: "Zero Trust overlay", controls: 14, note: "CISA pillars → 800-53." },
  ],
  oscal: "profile.json — organization-defined High + overlays. Not an ATO.",
};

export const ZT_PILLARS: ZtPillar[] = [
  { id: "zt-identity", name: "Identity", summary: "Enterprise IdP, PIM, phishing-resistant MFA.", controls: ["IA-2", "IA-2(1)", "IA-5", "AC-2", "AC-6"], coverage: "partial", evidence: "EVD-1007 current; AC-2 residual accounts remain." },
  { id: "zt-devices", name: "Devices", summary: "EDR coverage and compliant device posture.", controls: ["SI-3", "SI-4", "CM-6", "CM-8"], coverage: "partial", evidence: "VANGUARD inheritance; win-ops-12 STIG deviations." },
  { id: "zt-network", name: "Network", summary: "Microseg, private endpoints, filtered ingress.", controls: ["SC-7", "AC-4", "SC-8"], coverage: "strong", evidence: "EVD-1005 — public ingress limited to API gateway." },
  { id: "zt-apps", name: "Applications", summary: "Gateway authn, workload identity, runtime.", controls: ["AC-3", "SI-10", "SC-39", "SA-11"], coverage: "partial", evidence: "JWT plugin CVE open; SC-39 untested after AMI rotate." },
  { id: "zt-data", name: "Data", summary: "CUI encryption, labeling, backup.", controls: ["SC-28", "AC-3", "MP-4", "CP-9"], coverage: "strong", evidence: "Aurora encrypted; Helios SC-28 still hybrid/proposed." },
  { id: "zt-visibility", name: "Visibility", summary: "SIEM correlation and privileged-abuse detections.", controls: ["AU-2", "AU-6", "AU-12", "SI-4", "CA-7"], coverage: "partial", evidence: "12 of 18 privileged-abuse detections active." },
  { id: "zt-automation", name: "Automation", summary: "Collectors, ConMon jobs, policy-as-code.", controls: ["CA-7", "CM-2", "CM-3", "SI-4"], coverage: "partial", evidence: "Collection plane live; cATO review remains human." },
];

export const DEVSECOPS_GATES: DevsecopsGate[] = [
  { id: "gate-sast", name: "SAST", tool: "GitHub Advanced Security", controls: ["SA-11", "SI-2"], status: "passing", detail: "Blocking on critical; last run on aether-api." },
  { id: "gate-dast", name: "DAST", tool: "ZAP in CI", controls: ["SA-11", "SI-10"], status: "not_wired", detail: "Not in the AETHER pipeline. Gap vs. SI-10 JWT finding." },
  { id: "gate-sca", name: "SCA", tool: "Dependabot + SBOM", controls: ["RA-5", "SR-6", "SA-11"], status: "failing", detail: "Base-image supplier assessment stale (SR-6)." },
  { id: "gate-iac", name: "IaC", tool: "Terraform + Checkov", controls: ["CM-2", "CM-6", "SC-7"], status: "passing", detail: "State collected on apply. NACL drift still a ConMon finding." },
  { id: "gate-container", name: "Container scan", tool: "ECR + Wiz", controls: ["RA-5", "SI-2", "SC-39"], status: "failing", detail: "Runtime escape CVE on node AMI." },
  { id: "gate-secrets", name: "Secrets", tool: "GitHub secret scanning", controls: ["IA-5", "SC-12"], status: "passing", detail: "No live secrets in the last 30 days." },
];

export const K8S_RESOURCES: K8sResource[] = [
  { id: "k8s-cluster", kind: "Cluster", name: "aether-eks-prod", namespace: "—", controls: ["CM-6", "AC-3", "AU-12"], finding: null },
  { id: "k8s-ns", kind: "Namespace", name: "mission-cop", namespace: "mission-cop", controls: ["AC-3", "SC-7"], finding: null },
  { id: "k8s-deploy", kind: "Deployment", name: "orders-api", namespace: "mission-cop", controls: ["CM-2", "SA-11"], finding: null },
  { id: "k8s-svc", kind: "Service", name: "orders-api", namespace: "mission-cop", controls: ["SC-7", "AC-4"], finding: "ClusterIP; ingress via gateway only." },
  { id: "k8s-ing", kind: "Ingress", name: "aether-edge", namespace: "edge", controls: ["SC-7", "IA-5"], finding: "Tied to JWT plugin CVE." },
  { id: "k8s-np", kind: "NetworkPolicy", name: "default-deny-egress", namespace: "mission-cop", controls: ["SC-7", "AC-4"], finding: null },
  { id: "k8s-rbac", kind: "RoleBinding", name: "cop-operators", namespace: "mission-cop", controls: ["AC-3", "AC-6"], finding: null },
  { id: "k8s-sec", kind: "Secret", name: "aurora-creds", namespace: "mission-cop", controls: ["IA-5", "SC-12", "SC-28"], finding: null },
  { id: "k8s-adm", kind: "Admission", name: "psa-restricted", namespace: "mission-cop", controls: ["CM-6", "SC-39"], finding: "seccomp profile changed on AMI rotate." },
  { id: "k8s-img", kind: "Image", name: "orders-api:1.18.2", namespace: "mission-cop", controls: ["RA-5", "SI-2", "SR-6"], finding: "SCA failing on base image." },
];

export const SBOM_COMPONENTS: SbomComponent[] = [
  { id: "SBOM-01", systemId: "SYS-AETHER", name: "orders-api", version: "1.18.2", ecosystem: "container", license: "Apache-2.0", vulnId: "VUL-02", controlIds: ["SI-2", "SR-6", "SA-11"], risk: "Runtime + base image." },
  { id: "SBOM-02", systemId: "SYS-AETHER", name: "jsonwebtoken", version: "8.5.1", ecosystem: "npm", license: "MIT", vulnId: "VUL-03", controlIds: ["IA-5", "SI-10"], risk: "JWT none-alg path." },
  { id: "SBOM-03", systemId: "SYS-AETHER", name: "postgresql", version: "15.4", ecosystem: "engine", license: "PostgreSQL", vulnId: "VUL-04", controlIds: ["SI-2", "RA-5"], risk: "Extension privilege." },
  { id: "SBOM-04", systemId: "SYS-HELIOS", name: "kafka", version: "2.8.1", ecosystem: "jvm", license: "Apache-2.0", vulnId: "VUL-05", controlIds: ["AC-3", "SI-2"], risk: "ACL bypass." },
];

export const VENDORS: VendorRecord[] = [
  { id: "VEN-01", name: "Amazon Web Services", product: "GovCloud", service: "IaaS / EKS / Aurora / S3", data: "CUI in customer accounts", systems: ["SYS-AETHER", "SYS-HELIOS"], controls: ["SC-7", "SC-12", "SC-28", "CM-2"], risk: "moderate", gap: "Customer-responsibility encryption and NACL remain hybrid." },
  { id: "VEN-02", name: "CrowdStrike", product: "Falcon", service: "EDR", data: "Endpoint telemetry", systems: ["SYS-AETHER", "SYS-VANGUARD"], controls: ["SI-3", "SI-4", "IR-4"], risk: "low", gap: "Contain is compensating for POAM-284 — not a closure." },
  { id: "VEN-03", name: "Tenable", product: "Nessus / io", service: "Authenticated scan", data: "Vulnerability state", systems: ["SYS-AETHER", "SYS-HELIOS"], controls: ["RA-5", "SI-2"], risk: "moderate", gap: "12 pods + bastion coverage hole." },
  { id: "VEN-04", name: "ServiceNow", product: "ITSM", service: "Tickets / CMDB", data: "Incident and change", systems: ["SYS-AETHER"], controls: ["CM-3", "IR-4", "CA-5"], risk: "low", gap: "Tickets sync; POA&M never auto-closes." },
];

export const CONTRACTS: ContractObligation[] = [
  { id: "CON-01", source: "AETHER PWS §4.2", obligation: "Phishing-resistant MFA for all privileged users.", controlIds: ["IA-2", "IA-2(1)"], evidence: "PIV/FIDO enrollment export", systems: ["SYS-AETHER"] },
  { id: "CON-02", source: "AETHER PWS §4.8", obligation: "Critical KEV remediated within CISA timelines.", controlIds: ["SI-2", "RA-5"], evidence: "Tenable + POA&M", systems: ["SYS-AETHER"] },
  { id: "CON-03", source: "Helios SOW §3.1", obligation: "CUI encrypted at rest with agency-controlled keys.", controlIds: ["SC-28", "SC-12"], evidence: "KMS CMK policy", systems: ["SYS-HELIOS"] },
];

export const PREDICTIVE_PATTERNS: PredictivePattern[] = [
  { id: "PRD-01", title: "SI-2 fails every ConMon cycle on AETHER", evidence: "POAM-284 delayed 73d; KEV still open; EVD-1003 last three Tenable jobs other-than-satisfied. Not a model score — the same control, same host, same CVE family.", systems: ["SYS-AETHER"], controls: ["SI-2"], trend: "Chronic. Likelihood of another authorization condition at renewal is high." },
  { id: "PRD-02", title: "Identity lifecycle residuals recur after HR feeds", evidence: "AC-2 other-than-satisfied; 17 accounts; contractor path called out in EVD-1002. Pattern repeats whenever a contractor surge ends.", systems: ["SYS-AETHER", "SYS-ARGUS"], controls: ["AC-2", "PS-4"], trend: "Recurring. Inheritance of IA-2 will not fix disablement." },
  { id: "PRD-03", title: "Helios package slips each milestone", evidence: "POAM-330 SSP still draft; planned controls in backlog; incident INC-02 during assessment. Time-to-ATO is slipping, not accelerating.", systems: ["SYS-HELIOS"], controls: ["PL-2", "AC-3"], trend: "Increasing risk of operating without authorization." },
];

export const RED_BLUE: RedBlueSim[] = [
  {
    id: "RB-01",
    systemId: "SYS-AETHER",
    title: "Authorized red-team path: JWT → data plane",
    red: "Assume-breach from internet using CVE-2026-22019. Goal: read one CUI row.",
    blue: "WAF + EDR contain + Aurora IAM. Expected: block at SI-10 or SC-28.",
    rmf: "Maps to AP-AE-01. Controls IA-5, SI-10, SC-7. Finding only if the path succeeds or evidence contradicts.",
    atoNote: "Simulation does not change ATO. Results become evidence after human SCA review.",
  },
];

export const ACADEMY_COURSES: AcademyCourse[] = [
  { id: "CRS-01", title: "RMF in seven steps", track: "RMF", minutes: 40, summary: "SP 800-37 Rev. 2 Prepare through Monitor. Humans authorize." },
  { id: "CRS-02", title: "NIST SP 800-53 Rev. 5.2.0", track: "Catalog", minutes: 55, summary: "Families, baselines, overlays, parameters." },
  { id: "CRS-03", title: "800-53A examine / interview / test", track: "Assess", minutes: 35, summary: "Methods, objectives, other-than-satisfied." },
  { id: "CRS-04", title: "OSCAL packages", track: "OSCAL", minutes: 30, summary: "SSP, profile, assessment-plan, assessment-results, POA&M." },
  { id: "CRS-05", title: "SSP Studio", track: "SSP", minutes: 25, summary: "Boundary, data flow, implementation statements." },
  { id: "CRS-06", title: "POA&M and residual risk", track: "Authorize", minutes: 25, summary: "Milestones, tickets, what agents must not close." },
  { id: "CRS-07", title: "ATO decision records", track: "Authorize", minutes: 20, summary: "AO, conditions, time-bound acceptance." },
  { id: "CRS-08", title: "Cloud RMF / FedRAMP", track: "Cloud", minutes: 40, summary: "Customer vs CSP, inheritance, P-ATO." },
  { id: "CRS-09", title: "CMMC Level 2 overlay", track: "CMMC", minutes: 30, summary: "800-171 practices on the same graph." },
  { id: "CRS-10", title: "Zero Trust × 800-53", track: "ZT", minutes: 30, summary: "Seven CISA pillars mapped to controls." },
  { id: "CRS-11", title: "DevSecOps into ConMon", track: "DevSecOps", minutes: 35, summary: "CI gates as 800-53A tests." },
];

export const ACADEMY_LABS: AcademyLab[] = [
  { id: "LAB-AWS", title: "AWS RMF", scenario: "Authorize a High-impact GovCloud mission system.", steps: ["Read boundary", "Select High baseline", "Implement inherited vs system-specific", "Collect Config / IAM / Tenable", "Assess other-than-satisfied", "Open POA&M", "Stage ATO-C — do not auto-sign"], systemId: "SYS-AETHER" },
  { id: "LAB-AZURE", title: "Azure RMF", scenario: "Enterprise ICAM as a common-control provider.", steps: ["Profile Entra tenant", "Map Conditional Access to CM-6", "Collect identity evidence", "Propose inheritance to consumers", "Human accept"], systemId: "SYS-ARGUS" },
  { id: "LAB-K8S", title: "Kubernetes RMF", scenario: "Map cluster objects to 800-53.", steps: ["Inventory cluster", "Admission / PSA", "NetworkPolicy as SC-7", "Image as RA-5", "Record SC-39 retest"], systemId: "SYS-AETHER" },
  { id: "LAB-DOD", title: "DoD RMF", scenario: "Overlay + classified CDS is out of boundary.", steps: ["Mark CDS out of boundary", "Coalition users", "Cross-domain data flow", "Residual risk to AO"], systemId: "SYS-AETHER" },
  { id: "LAB-FR", title: "FedRAMP inheritance", scenario: "Consume a High P-ATO without pretending it is your ATO.", steps: ["List CSP inherited", "Customer responsibility", "Hybrid SC-28", "Agency overlay"], systemId: "SYS-VANGUARD" },
  { id: "LAB-CMMC", title: "CMMC L2", scenario: "Map 800-171 practices onto Helios CUI.", steps: ["Select 800-171 overlay", "CUI data flow", "AC-3 Kafka gap", "Do not issue CMMC assessment decision"], systemId: "SYS-HELIOS" },
];

export const CATO_STAGES: CatoStage[] = [
  { id: "cato-ato", label: "ATO on file", actor: "AO", summary: "Time-bound decision already issued. Engine does not create it." },
  { id: "cato-conmon", label: "ConMon", actor: "Collectors", summary: "Enabled feeds write the evidence lake." },
  { id: "cato-change", label: "Change detection", actor: "Change bus", summary: "Firewall, image, identity, IaC diffs." },
  { id: "cato-impact", label: "Impact analysis", actor: "Aegis", summary: "Unofficial. Affected controls, inheritance, evidence." },
  { id: "cato-eval", label: "Control evaluation", actor: "SCA / ISSO", summary: "800-53A methods. Other-than-satisfied stays other." },
  { id: "cato-risk", label: "Risk analysis", actor: "ISSM", summary: "Residual risk updated. Not accepted by an agent." },
  { id: "cato-human", label: "Human review", actor: "AO / ISSO", summary: "Required before authorization state moves." },
  { id: "cato-reassess", label: "Reassessment if needed", actor: "SCA", summary: "Significant change returns the package to Assess." },
  { id: "cato-state", label: "State recorded", actor: "AO", summary: "Only a human updates authorization history." },
];

export const ADMIN_ROLES: AdminRole[] = [
  { id: "ROL-AO", name: "Authorizing Official", persona: "A. Brennan / D. Morales", permissions: ["Read package", "Record ATO decision", "Accept residual risk", "cATO review"], notes: "Only this role issues or conditions an ATO." },
  { id: "ROL-ISSO", name: "ISSO", persona: "J. Okonkwo / K. Nguyen / T. Ibarra", permissions: ["Implement", "Collect evidence", "Open POA&M", "Submit package", "Run ConMon"], notes: "Daily operator. Cannot accept residual risk." },
  { id: "ROL-ISSM", name: "ISSM", persona: "R. Voss", permissions: ["Review residual risk", "Route to AO", "Policy"], notes: "Does not authorize." },
  { id: "ROL-SCA", name: "Assessor", persona: "L. Hart", permissions: ["Examine / interview / test", "Write SAR", "Assessor copilot"], notes: "Independent. Final assessment decision is human." },
  { id: "ROL-SO", name: "System owner", persona: "M. Calder", permissions: ["Boundary", "Resources", "POA&M owner assignment"], notes: "Mission owner, not AO." },
  { id: "ROL-RE", name: "Risk executive", persona: "H. Adler", permissions: ["Enterprise risk view", "Override routing"], notes: "Function, not a login." },
  { id: "ROL-AUD", name: "Auditor", persona: "IG / internal", permissions: ["Read audit log", "Export OSCAL", "FISMA metrics"], notes: "Immutable read of the record." },
];

export const INTERVIEW_BANK: { controlId: string; question: string; expected: string }[] = [
  { controlId: "AC-2", question: "How are contractor accounts disabled within 24 hours of termination?", expected: "SCIM + HR feed. Evidence currently shows 17 residuals — listen for contradiction." },
  { controlId: "IA-2", question: "Which authenticators are required for coalition mission admins?", expected: "Phishing-resistant. Password-only is other-than-satisfied." },
  { controlId: "SI-2", question: "What is the KEV remediation SLO, and is win-ops-12 inside it?", expected: "CISA KEV timeline. Host is past due. POAM-284 delayed." },
  { controlId: "CM-6", question: "Where are STIG deviations approved, and by whom?", expected: "Nine undocumented deviations. Look for an approved overlay." },
  { controlId: "SC-7", question: "What is internet-exposed, and who owns the WAF rule change?", expected: "API gateway only. CHG-01 coalition CIDR is in the change bus." },
];

export const LAYER3_AGENTS = [
  { id: "twin", name: "Digital Twin Agent", lane: "Twin", rmfStep: "monitor", summary: "Keeps the live graph of apps, hosts, data, users, controls, and vulns." },
  { id: "attack-path", name: "Attack-Path Agent", lane: "Security", rmfStep: "monitor", summary: "Walks vuln → asset → control → POA&M → ATO impact. Never authorizes." },
  { id: "whatif", name: "What-If Simulator", lane: "RMF", rmfStep: "monitor", summary: "Simulates MFA off, cloud move, exposure, EDR swap without changing the record." },
  { id: "assessor-copilot", name: "Assessor Copilot", lane: "Assess", rmfStep: "assess", summary: "Cites evidence against 800-53A objectives. Assessor decides." },
  { id: "interview", name: "Interview Assistant", lane: "Assess", rmfStep: "assess", summary: "Structured interviews; flags contradictions with telemetry." },
  { id: "policy", name: "Policy Agent", lane: "Compliance", rmfStep: "prepare", summary: "Gap analysis and draft policy. Human publishes." },
  { id: "regulatory", name: "Regulatory Change Agent", lane: "Compliance", rmfStep: "select", summary: "NIST / CISA / OMB / FedRAMP deltas onto controls and SSPs." },
  { id: "cato", name: "cATO Engine", lane: "Monitor", rmfStep: "monitor", summary: "ConMon → impact → human review. Does not issue ATO." },
  { id: "k8s", name: "Kubernetes Agent", lane: "Security", rmfStep: "implement", summary: "Cluster objects mapped to 800-53." },
  { id: "supply", name: "Supply-Chain Agent", lane: "Security", rmfStep: "monitor", summary: "SBOM, vendors, C-SCRM, contractual obligations." },
  { id: "zt", name: "Zero Trust Agent", lane: "Security", rmfStep: "select", summary: "Seven CISA pillars onto 800-53." },
  { id: "devsecops", name: "DevSecOps Agent", lane: "Security", rmfStep: "implement", summary: "CI gates as assessment tests." },
];

export const LAYER3_PACKS = [
  { id: "zt-cisa", name: "CISA Zero Trust", authority: "CISA", version: "Maturity 2", installed: true, controls: 7, summary: "Seven pillars mapped to 800-53 High." },
  { id: "oscal-profile-md", name: "Mission Directorate profile", authority: "Agency", version: "2026.3", installed: true, controls: 187, summary: "High + agency + mission + cloud + ZT." },
  { id: "k8s-800-53", name: "Kubernetes overlay", authority: "NSA/CISA", version: "1.2", installed: true, controls: 42, summary: "Admission, NetworkPolicy, PSA, images." },
  { id: "c-scrm", name: "C-SCRM pack", authority: "NIST 800-161", version: "1", installed: false, controls: 36, summary: "Vendor, SBOM, and contract obligations." },
];

export type EvidenceLifecycle = "collected" | "valid" | "expiring" | "expired" | "missing";

export interface EvidenceQuality {
  id: string;
  controlId: string;
  relevance: number;
  freshness: number;
  authenticity: number;
  completeness: number;
  coverage: number;
  integrity: number;
  overall: number;
  lifecycle: EvidenceLifecycle;
}

export function evidenceQuality(e: EvidenceRecord, asOf = L3_AS_OF): EvidenceQuality {
  const now = new Date(asOf).getTime();
  const ageDays = Math.max(0, (now - new Date(e.collectedAt).getTime()) / 86_400_000);
  const expired = e.expiresAt ? new Date(e.expiresAt).getTime() < now : false;
  const expiring = e.expiresAt
    ? new Date(e.expiresAt).getTime() - now < 14 * 86_400_000 && !expired
    : false;
  const freshness = expired ? 0 : ageDays <= 7 ? 100 : ageDays <= 30 ? 70 : 40;
  const authenticity = e.hash ? 90 : 40;
  const completeness = e.summary.length > 80 ? 90 : e.summary.length > 30 ? 70 : 40;
  const relevance = e.controlId && e.title ? 88 : 50;
  const integrity = e.hash.startsWith("sha256:") ? 92 : 55;
  const coverage = 80;
  const overall = Math.round((relevance + freshness + authenticity + completeness + coverage + integrity) / 6);
  const lifecycle: EvidenceLifecycle = expired
    ? "expired"
    : expiring
      ? "expiring"
      : ageDays <= 7
        ? "valid"
        : "collected";
  return {
    id: e.id,
    controlId: e.controlId,
    relevance,
    freshness,
    authenticity,
    completeness,
    coverage,
    integrity,
    overall,
    lifecycle,
  };
}

export interface EvidenceGap {
  controlId: string;
  status: "ok" | "incomplete" | "expired" | "missing";
  detail: string;
}

export function evidenceGaps(
  implementations: ImplementationRecord[],
  evidence: EvidenceRecord[],
  asOf = L3_AS_OF,
): EvidenceGap[] {
  const applicable = implementations.filter((i) => i.status !== "not_applicable");
  return applicable.map((impl) => {
    const rows = evidence.filter((e) => e.controlId === impl.controlId);
    if (rows.length === 0) {
      return { controlId: impl.controlId, status: "missing" as const, detail: "No evidence bound to this control." };
    }
    const qualities = rows.map((e) => evidenceQuality(e, asOf));
    if (qualities.some((q) => q.lifecycle === "expired")) {
      return { controlId: impl.controlId, status: "expired" as const, detail: "At least one artifact is past expires-at. Recollect." };
    }
    if (impl.result === "other" || impl.status === "partial" || impl.status === "not_implemented") {
      return { controlId: impl.controlId, status: "incomplete" as const, detail: "Evidence exists but implementation is not satisfied." };
    }
    return { controlId: impl.controlId, status: "ok" as const, detail: `${rows.length} artifact(s), current enough for ConMon.` };
  });
}

export type CatoHealth = "stable" | "review_required" | "reassess" | "not_authorized";

export function catoHealth(p: PortfolioSnapshot, systemId: string): { state: CatoHealth; reasons: string[] } {
  const system = p.systems.find((s) => s.id === systemId);
  if (!system) return { state: "not_authorized", reasons: ["System not in registry."] };
  if (system.atoStatus === "in_assessment" || system.atoStatus === "not_authorized") {
    return { state: "not_authorized", reasons: ["No ATO on file. Continuous authorization does not apply."] };
  }
  const reasons: string[] = [];
  const openCritical = p.poams.filter(
    (x) => x.systemId === systemId && x.status !== "completed" && (x.riskLevel === "critical" || x.status === "delayed"),
  );
  const unreviewed = p.configChanges.filter((c) => c.systemId === systemId && c.status === "open");
  const kev = p.vulnerabilities.filter((v) => v.systemId === systemId && v.kev && v.status === "open");
  const expiredEv = p.evidence.filter(
    (e) => e.systemId === systemId && e.expiresAt && new Date(e.expiresAt).getTime() < new Date(L3_AS_OF).getTime(),
  );
  if (openCritical.length) reasons.push(`${openCritical.length} delayed or critical POA&M.`);
  if (unreviewed.length) reasons.push(`${unreviewed.length} unreviewed configuration changes.`);
  if (kev.length) reasons.push(`${kev.length} open KEV.`);
  if (expiredEv.length) reasons.push(`${expiredEv.length} expired evidence artifacts.`);
  if (kev.length || openCritical.some((x) => x.riskLevel === "critical" && x.status === "delayed")) {
    return { state: "reassess", reasons };
  }
  if (reasons.length) return { state: "review_required", reasons };
  return { state: "stable", reasons: ["ConMon current. No unreviewed significant change."] };
}

export function dailyBrief(p: PortfolioSnapshot) {
  const changedSystems = new Set(p.configChanges.filter((c) => c.status === "open").map((c) => c.systemId));
  const controls = new Set(p.configChanges.filter((c) => c.status === "open").flatMap((c) => c.controls));
  const highVulns = p.vulnerabilities.filter((v) => v.status === "open" && (v.severity === "high" || v.severity === "critical"));
  const duePoam = p.poams.filter((x) => x.status !== "completed" && x.dueDate <= "2026-09-30");
  const expiredEv = p.evidence.filter((e) => e.expiresAt && e.expiresAt < "2026-09-19");
  const atoAttention = p.systems.filter(
    (s) => s.atoStatus === "authorized_with_conditions" || s.atoStatus === "in_assessment" || s.atoStatus === "expired",
  );
  return {
    systemsChanged: changedSystems.size,
    controlsAffected: controls.size,
    highVulns: highVulns.length,
    poamDue: duePoam.length,
    evidenceExpired: expiredEv.length,
    atoAttention: atoAttention.length,
    lines: [
      `${changedSystems.size} systems with unreviewed change`,
      `${controls.size} controls potentially affected`,
      `${highVulns.length} open high/critical vulnerabilities`,
      `${duePoam.length} POA&M items due by month-end`,
      `${expiredEv.length} evidence packages expired`,
      `${atoAttention.length} authorization packages require attention`,
    ],
  };
}

export function twinFor(systemId: string) {
  return {
    nodes: TWIN_NODES.filter((n) => n.systemId === systemId),
    edges: TWIN_EDGES.filter((e) => {
      const ids = TWIN_NODES.filter((n) => n.systemId === systemId).map((n) => n.id);
      return ids.includes(e.from) && ids.includes(e.to);
    }),
  };
}

export function attackPathsFor(systemId: string) {
  return ATTACK_PATHS.filter((p) => p.systemId === systemId);
}

export function whatIfFor(systemId: string) {
  const rows = WHATIF_SCENARIOS.filter((s) => s.systemId === systemId);
  return rows.length ? rows : WHATIF_SCENARIOS.filter((s) => s.systemId === "SYS-AETHER");
}

export function atoImpactLabel(impact: AtoImpact) {
  switch (impact) {
    case "none":
      return "No authorization impact";
    case "condition":
      return "Stays inside existing conditions";
    case "reopen":
      return "Package would need reassessment";
    case "suspend":
      return "Authorization not supportable";
    default:
      return impact;
  }
}
