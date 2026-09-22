import { CONTROL_BY_ID, NIST_CATALOG, familyOf } from "./catalog";
import { rmfStepForControl } from "./cycle";
import { EVIDENCE_MAPPINGS } from "./mappings";
import type {
  ArtifactKind,
  ArtifactRecord,
  AssessmentMethod,
  AssessmentResult,
  EvidenceRecord,
  ImpactLevel,
  ImplementationRecord,
  ImplementationStatus,
  InterconnectRecord,
  Origination,
  PortfolioSnapshot,
  RmfStep,
  SystemRecord,
  TestResultRecord,
  WorkflowEventRecord,
  WorkflowGateId,
} from "./types";

export const PACKAGE_MODULES = [
  { id: "identification", label: "Identification", emass: "1" },
  { id: "categorization", label: "Categorization", emass: "2" },
  { id: "implementation", label: "Control implementation", emass: "3" },
  { id: "assessment", label: "Assessment", emass: "4" },
  { id: "poam", label: "POA&M", emass: "5" },
  { id: "artifacts", label: "Authorization package", emass: "6" },
  { id: "inheritance", label: "Inheritance", emass: "7" },
  { id: "inventory", label: "Inventory", emass: "8" },
  { id: "interconnect", label: "Interconnections", emass: "9" },
  { id: "authorization", label: "Authorization", emass: "10" },
  { id: "conmon", label: "ConMon", emass: "11" },
] as const;

export type PackageModuleId = (typeof PACKAGE_MODULES)[number]["id"];

export function isPackageModule(value: unknown): value is PackageModuleId {
  return typeof value === "string" && PACKAGE_MODULES.some((m) => m.id === value);
}

export const WORKFLOW_GATES: {
  id: WorkflowGateId;
  actor: string;
  label: string;
  next: WorkflowGateId;
}[] = [
  { id: "isso_implement", actor: "ISSO", label: "Implement", next: "isso_submit" },
  { id: "isso_submit", actor: "ISSO", label: "Submit package", next: "sca_assess" },
  { id: "sca_assess", actor: "SCA", label: "Assess controls", next: "issm_review" },
  { id: "issm_review", actor: "ISSM", label: "Review residual risk", next: "ao_decision" },
  { id: "ao_decision", actor: "AO", label: "Authorization decision", next: "conmon" },
  { id: "conmon", actor: "ISSO", label: "Continuous monitoring", next: "conmon" },
];

export const ARTIFACT_KINDS: {
  id: ArtifactKind;
  label: string;
  required: boolean;
  oscal: string | null;
}[] = [
  { id: "ssp", label: "System Security Plan", required: true, oscal: "system-security-plan" },
  { id: "sap", label: "Security Assessment Plan", required: true, oscal: "assessment-plan" },
  { id: "sar", label: "Security Assessment Report", required: true, oscal: "assessment-results" },
  { id: "poam", label: "Plan of Action and Milestones", required: true, oscal: "plan-of-action-and-milestones" },
  { id: "cpt", label: "Contingency Plan", required: true, oscal: "component-definition" },
  { id: "isa", label: "Interconnection agreements", required: true, oscal: null },
  { id: "pia", label: "Privacy Threshold / PIA", required: true, oscal: null },
  { id: "conmon", label: "Continuous Monitoring Strategy", required: true, oscal: null },
  { id: "ato", label: "Authorization Decision Document", required: true, oscal: null },
  { id: "overlay", label: "Overlay / tailoring record", required: false, oscal: "profile" },
];

export interface CommonControlProvider {
  id: string;
  name: string;
  acronym: string;
  kind: "system" | "enterprise" | "fedramp" | "csp";
  systemId: string | null;
  controls: string[];
  authorization: string;
}

export const COMMON_CONTROL_PROVIDERS: CommonControlProvider[] = [
  {
    id: "CCP-ARGUS",
    name: "Enterprise ICAM",
    acronym: "ARGUS-ID",
    kind: "system",
    systemId: "SYS-ARGUS",
    controls: ["AC-2", "AC-2(1)", "AC-2(3)", "IA-2", "IA-2(1)", "IA-2(2)", "IA-2(8)", "IA-4", "IA-5", "IA-5(1)", "IA-8", "PS-4", "PS-5"],
    authorization: "ATO moderate · expires 2027-06-11",
  },
  {
    id: "CCP-VANGUARD",
    name: "Enterprise endpoint services",
    acronym: "VANGUARD-EDR",
    kind: "fedramp",
    systemId: "SYS-VANGUARD",
    controls: ["SI-3", "SI-4", "IR-4", "IR-5", "PE-1", "PE-2", "PE-3", "PE-6", "MA-1", "MA-2", "MA-4"],
    authorization: "FedRAMP High + agency ATO · expires 2027-03-01",
  },
  {
    id: "CCP-SOC",
    name: "Agency Security Operations",
    acronym: "SOC-CCP",
    kind: "enterprise",
    systemId: null,
    controls: ["AU-2", "AU-3", "AU-6", "AU-12", "IR-6", "SI-4", "SI-5"],
    authorization: "Enterprise common control authorization",
  },
  {
    id: "CCP-AWS",
    name: "AWS GovCloud FedRAMP",
    acronym: "AWS-GC",
    kind: "csp",
    systemId: null,
    controls: ["SC-7", "SC-12", "SC-13", "SC-28", "CM-2", "PE-1", "PE-2", "PE-3"],
    authorization: "FedRAMP High P-ATO (CSP inherited)",
  },
  {
    id: "CCP-PMO",
    name: "Agency program management",
    acronym: "PMO",
    kind: "enterprise",
    systemId: null,
    controls: ["PM-1", "PM-4", "PM-9", "PM-10", "AT-1", "AT-2", "PL-1"],
    authorization: "Organization-level common controls",
  },
];

export interface ControlImplRow {
  controlId: string;
  title: string;
  family: string;
  origination: Origination;
  inheritedFrom: string | null;
  implementation: ImplementationStatus;
  assessment: AssessmentResult;
  methods: AssessmentMethod[];
  evidenceCount: number;
  openFindings: number;
  openPoams: number;
  responsible: string;
  confidence: number;
  lastVerified: string;
  automation: string | null;
  rmfStep: RmfStep;
  statement: string;
  selected: boolean;
  packageAcronym: string;
}

export function impactTrio(system: SystemRecord): {
  confidentiality: ImpactLevel;
  integrity: ImpactLevel;
  availability: ImpactLevel;
} {
  const e = system.extra;
  return {
    confidentiality: e.confidentiality ?? system.impactLevel,
    integrity: e.integrity ?? system.impactLevel,
    availability: e.availability ?? (system.impactLevel === "high" ? "moderate" : system.impactLevel),
  };
}

export function authorizationType(system: SystemRecord): string {
  if (system.extra.authorizationType) return system.extra.authorizationType;
  if (system.atoStatus === "authorized_with_conditions") return "ATO-C";
  if (system.atoStatus === "authorized") return "ATO";
  if (system.atoStatus === "in_assessment") return "Package in assessment";
  return "Not authorized";
}

export function currentGate(system: SystemRecord): WorkflowGateId {
  switch (system.rmfStep) {
    case "prepare":
    case "categorize":
    case "select":
    case "implement":
      return "isso_implement";
    case "assess":
      return "sca_assess";
    case "authorize":
      return "ao_decision";
    case "monitor":
      return "conmon";
    default:
      return "isso_implement";
  }
}

export function ccpKindLabel(kind: CommonControlProvider["kind"]): string {
  switch (kind) {
    case "system":
      return "System provider";
    case "enterprise":
      return "Enterprise";
    case "fedramp":
      return "FedRAMP";
    case "csp":
      return "Cloud service";
  }
}

export function providerForControl(controlId: string, consumerSystemId: string): CommonControlProvider | null {
  const base = controlId.replace(/\([^)]+\)$/, "");
  return (
    COMMON_CONTROL_PROVIDERS.find(
      (p) =>
        p.systemId !== consumerSystemId &&
        (p.controls.includes(controlId) || p.controls.includes(base)),
    ) ?? null
  );
}

export function originationOf(
  impl: ImplementationRecord | undefined,
  consumerSystemId: string,
  controlId: string,
): { type: Origination; from: string | null } {
  if (!impl || impl.status === "not_applicable") {
    return { type: "not_selected", from: null };
  }
  const provider = providerForControl(controlId, consumerSystemId);
  if (impl.status === "inherited") {
    return { type: "inherited", from: provider?.acronym ?? "Common control provider" };
  }
  if (provider && provider.systemId !== consumerSystemId) {
    return { type: "hybrid", from: provider.acronym };
  }
  return { type: "system", from: null };
}

export function automationFor(controlId: string): string | null {
  const hit = EVIDENCE_MAPPINGS.find((m) => m.controls.includes(controlId));
  return hit ? `${hit.source} · ${hit.authority}` : null;
}

export function buildControlRows(
  p: PortfolioSnapshot,
  systemId: string,
): ControlImplRow[] {
  const impls = p.implementations.filter((i) => i.systemId === systemId);
  const byControl = new Map(impls.map((i) => [i.controlId, i]));
  return NIST_CATALOG.map((c) => {
    const impl = byControl.get(c.id);
    const origin = originationOf(impl, systemId, c.id);
    const evidence = p.evidence.filter((e) => e.systemId === systemId && e.controlId === c.id);
    const findings = p.findings.filter(
      (f) => f.systemId === systemId && f.controlId === c.id && f.status === "open",
    );
    const poams = p.poams.filter(
      (x) => x.systemId === systemId && x.controlId === c.id && x.status !== "completed",
    );
    return {
      controlId: c.id,
      title: c.title,
      family: c.family,
      origination: origin.type,
      inheritedFrom: origin.from,
      implementation: impl?.status ?? "not_applicable",
      assessment: impl?.result ?? "not_assessed",
      methods: c.methods,
      evidenceCount: evidence.length,
      openFindings: findings.length,
      openPoams: poams.length,
      responsible: impl?.responsible ?? "—",
      confidence: impl?.confidence ?? 0,
      lastVerified: impl?.lastVerified ?? "—",
      automation: automationFor(c.id),
      rmfStep: rmfStepForControl(c.id),
      statement: impl?.statement ?? c.statement,
      selected: impl ? impl.status !== "not_applicable" : false,
      packageAcronym: p.systems.find((s) => s.id === systemId)?.acronym ?? systemId,
    };
  });
}

export function packageCompleteness(p: PortfolioSnapshot, systemId: string) {
  const system = p.systems.find((s) => s.id === systemId);
  const rows = buildControlRows(p, systemId).filter((r) => r.selected);
  const implemented = rows.filter(
    (r) => r.implementation === "implemented" || r.implementation === "inherited",
  ).length;
  const assessed = rows.filter((r) => r.assessment !== "not_assessed").length;
  const withEvidence = rows.filter((r) => r.evidenceCount > 0).length;
  const artifacts = artifactsFor(p, systemId);
  const required = artifacts.filter((a) => ARTIFACT_KINDS.find((k) => k.id === a.kind)?.required);
  const present = required.filter((a) => a.status !== "missing").length;
  const cia = system ? impactTrio(system) : null;
  const categorized = Boolean(cia);
  const implementation = rows.length ? Math.round((implemented / rows.length) * 100) : 0;
  const assessment = rows.length ? Math.round((assessed / rows.length) * 100) : 0;
  const evidence = rows.length ? Math.round((withEvidence / rows.length) * 100) : 0;
  const documentation = required.length ? Math.round((present / required.length) * 100) : 0;
  const overall = Math.round(
    implementation * 0.3 + assessment * 0.25 + evidence * 0.2 + documentation * 0.25,
  );
  return {
    overall,
    implementation,
    assessment,
    evidence,
    documentation,
    categorized,
    selected: rows.length,
    implemented,
    assessed,
    withEvidence,
    artifactsReady: present,
    artifactsRequired: required.length,
  };
}

export function artifactsFor(p: PortfolioSnapshot, systemId: string): ArtifactRecord[] {
  const persisted = p.artifacts?.filter((a) => a.systemId === systemId) ?? [];
  if (persisted.length) return persisted;
  return deriveArtifacts(p, systemId);
}

export function deriveArtifacts(p: PortfolioSnapshot, systemId: string): ArtifactRecord[] {
  const system = p.systems.find((s) => s.id === systemId);
  const slicePoams = p.poams.filter((x) => x.systemId === systemId);
  const assessments = p.assessments.filter((a) => a.systemId === systemId);
  const hasSsp = Boolean(system?.sspDraft) || system?.atoStatus !== "in_assessment";
  const completeAssessment = assessments.some((a) => a.status === "complete");
  const authorized = system?.atoStatus === "authorized" || system?.atoStatus === "authorized_with_conditions";
  const stamp = "2026-09-18";
  const status = (kind: ArtifactKind): ArtifactRecord["status"] => {
    switch (kind) {
      case "ssp":
        return hasSsp ? (system?.sspDraft ? "draft" : "approved") : "missing";
      case "sap":
        return assessments.length ? "approved" : "missing";
      case "sar":
        return completeAssessment ? "approved" : assessments.length ? "draft" : "missing";
      case "poam":
        return slicePoams.length ? "approved" : "missing";
      case "ato":
        return authorized ? "approved" : "missing";
      case "conmon":
        return system?.rmfStep === "monitor" ? "approved" : "draft";
      case "cpt":
        return authorized ? "approved" : "draft";
      case "isa":
        return "draft";
      case "pia":
        return system?.dataTypes.includes("PII") ? "draft" : "approved";
      case "overlay":
        return "draft";
      default:
        return "missing";
    }
  };
  return ARTIFACT_KINDS.map((k) => ({
    id: `ART-${systemId}-${k.id}`,
    systemId,
    kind: k.id,
    title: k.label,
    status: status(k.id),
    source: status(k.id) === "approved" ? "ISSO package" : "Aegis generator",
    updatedAt: stamp,
  }));
}

export function deriveTestResults(p: PortfolioSnapshot, systemId: string): TestResultRecord[] {
  const persisted = p.testResults?.filter((t) => t.systemId === systemId) ?? [];
  if (persisted.length) return persisted;
  const rows: TestResultRecord[] = [];
  const impls = p.implementations.filter((i) => i.systemId === systemId && i.status !== "not_applicable");
  for (const impl of impls) {
    const control = CONTROL_BY_ID[impl.controlId];
    if (!control) continue;
    const evidence = p.evidence.filter((e) => e.systemId === systemId && e.controlId === impl.controlId);
    for (const method of control.methods) {
      const covered = evidence.some(
        (e) => e.method === method || e.method === "automated" || e.method === "examine",
      );
      rows.push({
        id: `TST-${systemId}-${impl.controlId}-${method}`,
        systemId,
        controlId: impl.controlId,
        method,
        objective: `${method} ${impl.controlId} ${control.title}`,
        result: covered ? impl.result : impl.result === "satisfied" ? "satisfied" : "not_assessed",
        comments: covered
          ? `Evidence bound: ${evidence.map((e) => e.id).join(", ") || "implementation statement"}`
          : "No bound artifact for this method. Collection job queued.",
        automated: evidence.some((e) => e.method === "automated") || Boolean(automationFor(impl.controlId)),
      });
    }
  }
  return rows;
}

export function deriveInterconnects(system: SystemRecord): InterconnectRecord[] {
  const shared: Record<string, InterconnectRecord[]> = {
    "SYS-AETHER": [
      {
        id: "ISA-A1",
        systemId: "SYS-AETHER",
        partner: "ARGUS-ID",
        kind: "Identity federation",
        agreement: "ISA-2025-014",
        dataFlow: "SAML/OIDC assertions inbound",
        status: "approved",
      },
      {
        id: "ISA-A2",
        systemId: "SYS-AETHER",
        partner: "Cross-domain guard (out of boundary)",
        kind: "CDS",
        agreement: "MOU-CDS-09",
        dataFlow: "Mission orders outbound, sanitized",
        status: "approved",
      },
      {
        id: "ISA-A3",
        systemId: "SYS-AETHER",
        partner: "HELIOS-LAKE",
        kind: "Private API",
        agreement: "ISA-2026-003",
        dataFlow: "CUI analytic extracts",
        status: "in_review",
      },
    ],
    "SYS-ARGUS": [
      {
        id: "ISA-B1",
        systemId: "SYS-ARGUS",
        partner: "All agency systems",
        kind: "IdP",
        agreement: "Enterprise ICAM charter",
        dataFlow: "Authentication assertions",
        status: "approved",
      },
    ],
    "SYS-HELIOS": [
      {
        id: "ISA-C1",
        systemId: "SYS-HELIOS",
        partner: "AETHER-C2",
        kind: "Private API",
        agreement: "ISA-2026-003",
        dataFlow: "CUI analytic extracts",
        status: "in_review",
      },
      {
        id: "ISA-C2",
        systemId: "SYS-HELIOS",
        partner: "On-prem Kafka mesh",
        kind: "Internal bus",
        agreement: "Internal interconnection",
        dataFlow: "CUI event streams",
        status: "approved",
      },
    ],
    "SYS-VANGUARD": [
      {
        id: "ISA-D1",
        systemId: "SYS-VANGUARD",
        partner: "Microsoft Sentinel",
        kind: "Telemetry",
        agreement: "SOC data sharing",
        dataFlow: "EDR detections outbound",
        status: "approved",
      },
    ],
  };
  return shared[system.id] ?? [];
}

export function deriveWorkflow(system: SystemRecord): WorkflowEventRecord[] {
  const gate = currentGate(system);
  const base: WorkflowEventRecord[] = [
    {
      id: `WF-${system.id}-1`,
      systemId: system.id,
      gate: "isso_implement",
      actor: system.issoRole,
      action: "Registered system and selected baseline",
      notes: `${system.extra.baseline ?? system.impactLevel} baseline · overlay ${system.extra.overlay ?? "none"}`,
      createdAt: "2026-01-12T00:00:00Z",
    },
    {
      id: `WF-${system.id}-2`,
      systemId: system.id,
      gate: "isso_submit",
      actor: system.issoRole,
      action: "Submitted authorization package",
      notes: "OSCAL SSP, SAP, and inventory included.",
      createdAt: "2026-03-02T00:00:00Z",
    },
  ];
  if (gate === "isso_implement") return base.slice(0, 1);
  if (system.atoStatus === "in_assessment") {
    base.push({
      id: `WF-${system.id}-3`,
      systemId: system.id,
      gate: "sca_assess",
      actor: system.extra.scaRole ?? "Independent assessor",
      action: "Assessment in progress",
      notes: "Categorization complete. Implementation incomplete.",
      createdAt: "2026-08-11T00:00:00Z",
    });
    return base;
  }
  base.push({
    id: `WF-${system.id}-3`,
    systemId: system.id,
    gate: "sca_assess",
    actor: system.extra.scaRole ?? "Independent assessor",
    action: "SAR issued",
    notes: "Examine / interview / test complete for the baseline.",
    createdAt: "2026-07-18T00:00:00Z",
  });
  base.push({
    id: `WF-${system.id}-4`,
    systemId: system.id,
    gate: "issm_review",
    actor: system.extra.issmRole ?? "ISSM, Mission Directorate",
    action: "Residual risk reviewed",
    notes: "Recommended authorization with conditions where POA&M remains open.",
    createdAt: "2026-07-20T00:00:00Z",
  });
  base.push({
    id: `WF-${system.id}-5`,
    systemId: system.id,
    gate: "ao_decision",
    actor: system.aoRole,
    action: authorizationType(system),
    notes: system.atoExpires ? `Expires ${system.atoExpires}` : "No decision on file.",
    createdAt: "2026-07-22T00:00:00Z",
  });
  if (gate === "conmon") {
    base.push({
      id: `WF-${system.id}-6`,
      systemId: system.id,
      gate: "conmon",
      actor: "Aegis Continuous Monitoring Agent",
      action: "ConMon cycle posted",
      notes: "Telemetry remapped to 800-53. Human approval required for authorization-impacting changes.",
      createdAt: "2026-09-18T06:12:00Z",
    });
  }
  return base;
}

export function collectionJobs(evidence: EvidenceRecord[], systemId: string) {
  const bound = new Set(evidence.filter((e) => e.systemId === systemId).map((e) => e.controlId));
  return EVIDENCE_MAPPINGS.map((m) => {
    const covered = m.controls.filter((id) => bound.has(id));
    return {
      source: m.source,
      authority: m.authority,
      confidence: m.confidence,
      controls: m.controls,
      covered: covered.length,
      status: covered.length === m.controls.length ? "complete" : covered.length ? "partial" : "queued",
    };
  });
}

export { familyOf };
