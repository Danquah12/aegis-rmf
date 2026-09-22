import { NIST_CATALOG } from "./catalog";
import type {
  AgentRunRecord,
  AssessmentRecord,
  AssetRecord,
  EvidenceRecord,
  FindingRecord,
  ImplementationRecord,
  ImplementationStatus,
  PoamRecord,
  SystemRecord,
  VulnerabilityRecord,
} from "./types";

const TODAY = "2026-09-18";

export const SEED_SYSTEMS: SystemRecord[] = [
  {
    id: "SYS-AETHER",
    name: "Aether Command Platform",
    acronym: "AETHER-C2",
    mission: "Tactical mission command, common operational picture, and order dissemination for field units.",
    impactLevel: "high",
    atoStatus: "authorized_with_conditions",
    atoExpires: "2027-01-23",
    hosting: "Cloud",
    cloudProvider: "AWS GovCloud",
    ownerRole: "Mission Owner, Aether Program",
    issoRole: "ISSO, Aether-C2",
    aoRole: "Authorizing Official, Mission Directorate",
    authorizationBoundary:
      "GovCloud VPC, EKS cluster, Aurora, S3 mission stores, transit gateway to the classified cross-domain guard (out of boundary), and Entra-federated users.",
    dataTypes: ["CUI", "PII", "Mission operational data"],
    rmfStep: "monitor",
    sspDraft: null,
    extra: {
      users: "2,400 organizational + 180 coalition partners",
      components: 247,
      interfaces: 31,
      baseline: "high",
      confidentiality: "high",
      integrity: "high",
      availability: "moderate",
      overlay: "Privacy + Cloud + Tactical",
      packageVersion: "3.2",
      scaRole: "Independent assessor (3PAO analog)",
      issmRole: "ISSM, Mission Directorate",
      authorizationType: "ATO-C",
      orgId: "ORG-MD",
      programId: "PRG-AETHER",
    },
  },
  {
    id: "SYS-ARGUS",
    name: "Argus Identity Broker",
    acronym: "ARGUS-ID",
    mission: "Enterprise identity, credential, and access management for internal systems and federation.",
    impactLevel: "moderate",
    atoStatus: "authorized",
    atoExpires: "2027-06-11",
    hosting: "Cloud",
    cloudProvider: "Azure Government",
    ownerRole: "ICAM Program Owner",
    issoRole: "ISSO, Argus-ID",
    aoRole: "Authorizing Official, Enterprise Services",
    authorizationBoundary:
      "Entra ID tenant, Privileged Identity Management, Application Proxy, Key Vault, and hybrid domain controllers in the enterprise enclave.",
    dataTypes: ["PII", "Authentication assertions"],
    rmfStep: "monitor",
    sspDraft: null,
    extra: {
      users: "18,000",
      components: 64,
      interfaces: 22,
      baseline: "moderate",
      confidentiality: "moderate",
      integrity: "high",
      availability: "moderate",
      overlay: "Privacy + ICAM",
      packageVersion: "5.1",
      scaRole: "Enterprise assessor",
      issmRole: "ISSM, Enterprise Services",
      authorizationType: "ATO",
      orgId: "ORG-ES",
      programId: "PRG-ICAM",
    },
  },
  {
    id: "SYS-HELIOS",
    name: "Helios CUI Analytics Lake",
    acronym: "HELIOS-LAKE",
    mission: "Ingest, catalog, and analyze CUI mission datasets for analytic cells.",
    impactLevel: "moderate",
    atoStatus: "in_assessment",
    atoExpires: null,
    hosting: "Hybrid",
    cloudProvider: "AWS GovCloud + on-prem",
    ownerRole: "Analytics Program Owner",
    issoRole: "ISSO, Helios",
    aoRole: "Authorizing Official, Mission Directorate",
    authorizationBoundary:
      "S3 data lake, Glue/Athena, on-prem Kafka, restricted analyst workstations, and a private API to Aether-C2.",
    dataTypes: ["CUI", "PII"],
    rmfStep: "assess",
    sspDraft: null,
    extra: {
      users: "320",
      components: 118,
      interfaces: 14,
      baseline: "moderate",
      confidentiality: "moderate",
      integrity: "moderate",
      availability: "low",
      overlay: "Privacy + Cloud",
      packageVersion: "0.9-draft",
      scaRole: "Aegis Assessment Agent + ISSO",
      issmRole: "ISSM, Mission Directorate",
      authorizationType: "Package in assessment",
      orgId: "ORG-MD",
      programId: "PRG-ANLY",
    },
  },
  {
    id: "SYS-VANGUARD",
    name: "Vanguard Endpoint Detection",
    acronym: "VANGUARD-EDR",
    mission: "Enterprise endpoint detection, response, and telemetry for the agency fleet.",
    impactLevel: "low",
    atoStatus: "authorized",
    atoExpires: "2027-03-01",
    hosting: "SaaS",
    cloudProvider: "FedRAMP High authorized SaaS",
    ownerRole: "CISO Operations",
    issoRole: "ISSO, Endpoint Services",
    aoRole: "Authorizing Official, Enterprise Services",
    authorizationBoundary:
      "SaaS tenant plus agency-managed sensor configuration, log forwarding to Sentinel, and admin workstations.",
    dataTypes: ["Endpoint telemetry", "CUI (limited)"],
    rmfStep: "monitor",
    sspDraft: null,
    extra: {
      users: "SOC analysts + fleet",
      components: 12,
      interfaces: 8,
      baseline: "low",
      confidentiality: "low",
      integrity: "moderate",
      availability: "low",
      overlay: "FedRAMP High inheritance",
      packageVersion: "2.0",
      scaRole: "Enterprise assessor",
      issmRole: "ISSM, Enterprise Services",
      authorizationType: "ATO",
      orgId: "ORG-CISO",
      programId: "PRG-EDR",
    },
  },
];

export const SEED_ASSETS: AssetRecord[] = [
  { id: "AST-01", systemId: "SYS-AETHER", name: "aether-eks-prod", kind: "Kubernetes", environment: "GovCloud", criticality: "critical", internetExposed: false },
  { id: "AST-02", systemId: "SYS-AETHER", name: "aether-api-gw", kind: "API Gateway", environment: "GovCloud", criticality: "high", internetExposed: true },
  { id: "AST-03", systemId: "SYS-AETHER", name: "aether-aurora", kind: "Database", environment: "GovCloud", criticality: "critical", internetExposed: false },
  { id: "AST-04", systemId: "SYS-AETHER", name: "aether-bastion", kind: "Jump host", environment: "GovCloud", criticality: "high", internetExposed: false },
  { id: "AST-05", systemId: "SYS-AETHER", name: "win-ops-12", kind: "Windows Server", environment: "Hybrid", criticality: "high", internetExposed: false },
  { id: "AST-06", systemId: "SYS-ARGUS", name: "entra-tenant", kind: "IdP", environment: "AzureGov", criticality: "critical", internetExposed: true },
  { id: "AST-07", systemId: "SYS-ARGUS", name: "pim-control-plane", kind: "PIM", environment: "AzureGov", criticality: "high", internetExposed: false },
  { id: "AST-08", systemId: "SYS-HELIOS", name: "helios-s3-cui", kind: "Object storage", environment: "GovCloud", criticality: "high", internetExposed: false },
  { id: "AST-09", systemId: "SYS-HELIOS", name: "kafka-onprem-01", kind: "Broker", environment: "On-prem", criticality: "high", internetExposed: false },
  { id: "AST-10", systemId: "SYS-VANGUARD", name: "vanguard-tenant", kind: "SaaS", environment: "FedRAMP", criticality: "moderate", internetExposed: true },
];

export const SEED_VULNS: VulnerabilityRecord[] = [
  { id: "VUL-01", systemId: "SYS-AETHER", assetId: "AST-05", cve: "CVE-2026-44102", title: "Remote code execution in privileged Windows print spooler component", cvss: 9.8, severity: "critical", kev: true, controlIds: ["SI-2", "RA-5", "CM-6"], status: "open" },
  { id: "VUL-02", systemId: "SYS-AETHER", assetId: "AST-01", cve: "CVE-2026-11844", title: "Container runtime escape via crafted seccomp profile", cvss: 8.5, severity: "high", kev: false, controlIds: ["SI-2", "SC-39", "CM-6"], status: "open" },
  { id: "VUL-03", systemId: "SYS-AETHER", assetId: "AST-02", cve: "CVE-2026-22019", title: "JWT none-algorithm bypass in API gateway plugin", cvss: 8.1, severity: "high", kev: false, controlIds: ["IA-5", "SC-8", "SI-10"], status: "open" },
  { id: "VUL-04", systemId: "SYS-AETHER", assetId: "AST-03", cve: "CVE-2025-9901", title: "Outdated PostgreSQL extension with known privilege escalation", cvss: 7.4, severity: "high", kev: false, controlIds: ["SI-2", "RA-5"], status: "open" },
  { id: "VUL-05", systemId: "SYS-HELIOS", assetId: "AST-09", cve: "CVE-2026-3310", title: "Unauthenticated Kafka ACL bypass on legacy broker", cvss: 8.6, severity: "high", kev: false, controlIds: ["AC-3", "SC-7", "SI-2"], status: "open" },
  { id: "VUL-06", systemId: "SYS-ARGUS", assetId: "AST-07", cve: "CVE-2026-1022", title: "PIM elevation race in legacy connector", cvss: 6.4, severity: "moderate", kev: false, controlIds: ["AC-6", "IA-2(1)"], status: "open" },
];

type Issue = {
  status: ImplementationStatus;
  result: "satisfied" | "other" | "not_assessed";
  statement: string;
  confidence: number;
};

const AETHER_ISSUES: Record<string, Issue> = {
  "AC-2": {
    status: "partial",
    result: "other",
    statement: "Account provisioning is automated through Entra, but 17 terminated identities remain enabled beyond the 24-hour disablement objective.",
    confidence: 94,
  },
  "AC-2(3)": {
    status: "partial",
    result: "other",
    statement: "Inactivity disablement is configured at 45 days; organizational parameter is 30 days. Orphaned service accounts are not fully covered.",
    confidence: 88,
  },
  "PS-4": {
    status: "partial",
    result: "other",
    statement: "Termination checklist exists; HR-to-IAM feed fails closed only for employees, not contractors.",
    confidence: 86,
  },
  "CM-6": {
    status: "partial",
    result: "other",
    statement: "EKS and Amazon Linux baselines are enforced; nine STIG deviations on win-ops-12 remain undocumented.",
    confidence: 81,
  },
  "SI-2": {
    status: "not_implemented",
    result: "other",
    statement: "Fourteen High/Critical findings exceed patch SLO, including one CISA KEV item on win-ops-12.",
    confidence: 97,
  },
  "RA-5": {
    status: "partial",
    result: "other",
    statement: "Authenticated scanning covers 88% of inventory; twelve ephemeral pods and the bastion are unscanned this cycle.",
    confidence: 84,
  },
  "AU-6": {
    status: "partial",
    result: "other",
    statement: "Sentinel ingests CloudTrail and EKS audit; correlation use cases for privileged API abuse are incomplete.",
    confidence: 79,
  },
  "CP-4": {
    status: "partial",
    result: "other",
    statement: "Last full failover test is 11 months old; tabletop completed this quarter.",
    confidence: 76,
  },
  "SR-6": {
    status: "partial",
    result: "other",
    statement: "Critical container base-image supplier assessment is 14 months old.",
    confidence: 72,
  },
};

const ARGUS_ISSUES: Record<string, Issue> = {
  "CM-6": {
    status: "partial",
    result: "other",
    statement: "Conditional Access baselines are enforced; three legacy enterprise apps still allow password SSO.",
    confidence: 90,
  },
  "AU-6": {
    status: "partial",
    result: "other",
    statement: "Sign-in risk detections fire; weekly human review of PIM activations is behind by two cycles.",
    confidence: 82,
  },
};

const HELIOS_PLANNED = new Set([
  "CA-6",
  "CA-8",
  "CP-4",
  "IR-8",
  "SA-11",
  "SI-7",
  "SR-6",
  "SC-28",
  "PL-8",
]);

function defaultImpl(system: SystemRecord, controlId: string): Issue {
  if (system.id === "SYS-AETHER" && AETHER_ISSUES[controlId]) return AETHER_ISSUES[controlId];
  if (system.id === "SYS-ARGUS" && ARGUS_ISSUES[controlId]) return ARGUS_ISSUES[controlId];
  if (system.id === "SYS-HELIOS") {
    if (HELIOS_PLANNED.has(controlId)) {
      return {
        status: "planned",
        result: "not_assessed",
        statement: "Control is in the Helios implementation backlog for the current assessment cycle.",
        confidence: 54,
      };
    }
    if (controlId.startsWith("PL-") || controlId === "RA-2") {
      return {
        status: "partial",
        result: "other",
        statement: "Categorization complete; SSP and architecture package are in draft.",
        confidence: 70,
      };
    }
  }
  if (system.id === "SYS-VANGUARD") {
    return {
      status: controlId.startsWith("PE-") || controlId.startsWith("MA-") ? "inherited" : "implemented",
      result: "satisfied",
      statement:
        controlId.startsWith("PE-") || controlId.startsWith("MA-")
          ? "Inherited from the FedRAMP High authorized SaaS authorization package."
          : "Implemented in the agency tenant overlay and verified by the last ConMon cycle.",
      confidence: 93,
    };
  }
  const inBaseline = NIST_CATALOG.find((c) => c.id === controlId)?.baselines.includes(system.impactLevel);
  if (!inBaseline) {
    return {
      status: "not_applicable",
      result: "not_assessed",
      statement: "Not selected for this system's baseline.",
      confidence: 99,
    };
  }
  return {
    status: "implemented",
    result: "satisfied",
    statement: `Implemented for ${system.acronym} in accordance with the ${system.impactLevel} baseline and verified against available evidence.`,
    confidence: system.id === "SYS-HELIOS" ? 68 : 91,
  };
}

export function buildImplementations(): ImplementationRecord[] {
  const rows: ImplementationRecord[] = [];
  for (const system of SEED_SYSTEMS) {
    for (const control of NIST_CATALOG) {
      const issue = defaultImpl(system, control.id);
      rows.push({
        id: `IMP-${system.id}-${control.id}`,
        systemId: system.id,
        controlId: control.id,
        status: issue.status,
        result: issue.result,
        statement: issue.statement,
        confidence: issue.confidence,
        lastVerified: TODAY,
        responsible: system.issoRole,
      });
    }
  }
  return rows;
}

export const SEED_EVIDENCE: EvidenceRecord[] = [
  { id: "EVD-1001", systemId: "SYS-AETHER", controlId: "AC-2", title: "Entra ID account export", source: "Entra ID", method: "automated", collectedAt: "2026-09-18T08:12:00Z", hash: "sha256:a91c…e4b2", classification: "CUI", expiresAt: "2026-10-18", summary: "Full account inventory with last sign-in and enabled state. Flags 17 terminated users still enabled." },
  { id: "EVD-1002", systemId: "SYS-AETHER", controlId: "AC-2", title: "HR termination feed exception report", source: "ServiceNow", method: "automated", collectedAt: "2026-09-17T21:04:00Z", hash: "sha256:bb12…91aa", classification: "CUI", expiresAt: "2026-10-17", summary: "Contractor offboarding tickets not consistently closing IAM tasks within 24 hours." },
  { id: "EVD-1003", systemId: "SYS-AETHER", controlId: "SI-2", title: "Tenable scan — production", source: "Tenable", method: "automated", collectedAt: "2026-09-18T03:40:00Z", hash: "sha256:cc77…12f0", classification: "CUI", expiresAt: "2026-10-02", summary: "14 High/Critical remaining; CVE-2026-44102 present on win-ops-12 (CISA KEV)." },
  { id: "EVD-1004", systemId: "SYS-AETHER", controlId: "CM-6", title: "AWS Config conformance pack", source: "AWS Config", method: "automated", collectedAt: "2026-09-18T06:00:00Z", hash: "sha256:d0aa…88e1", classification: "CUI", expiresAt: "2026-10-18", summary: "Nine noncompliant rules on Windows STIG overlay." },
  { id: "EVD-1005", systemId: "SYS-AETHER", controlId: "SC-7", title: "Security group and private endpoint inventory", source: "AWS Config", method: "automated", collectedAt: "2026-09-18T06:01:00Z", hash: "sha256:e19f…44c2", classification: "CUI", expiresAt: "2026-10-18", summary: "Public ingress limited to API gateway; databases private." },
  { id: "EVD-1006", systemId: "SYS-AETHER", controlId: "RA-5", title: "Scan coverage map", source: "Tenable", method: "automated", collectedAt: "2026-09-18T03:41:00Z", hash: "sha256:f3c1…09ab", classification: "CUI", expiresAt: "2026-10-02", summary: "88% authenticated coverage; bastion and 12 pods excluded." },
  { id: "EVD-1007", systemId: "SYS-AETHER", controlId: "IA-2(1)", title: "PIV / FIDO enrollment", source: "Entra ID", method: "automated", collectedAt: "2026-09-16T12:00:00Z", hash: "sha256:aa01…77d3", classification: "CUI", expiresAt: "2026-10-16", summary: "99.4% privileged users phishing-resistant MFA." },
  { id: "EVD-1008", systemId: "SYS-ARGUS", controlId: "IA-2(2)", title: "MFA coverage for workforce", source: "Entra ID", method: "automated", collectedAt: "2026-09-18T01:10:00Z", hash: "sha256:ab33…c190", classification: "CUI", expiresAt: "2026-10-18", summary: "Workforce MFA 99.1%. Three legacy apps excluded." },
  { id: "EVD-1009", systemId: "SYS-ARGUS", controlId: "CM-6", title: "Conditional Access baseline", source: "Azure Policy", method: "automated", collectedAt: "2026-09-17T18:22:00Z", hash: "sha256:b81e…dd09", classification: "CUI", expiresAt: "2026-10-17", summary: "Baseline enforced; password SSO still enabled on three enterprise apps." },
  { id: "EVD-1010", systemId: "SYS-HELIOS", controlId: "RA-2", title: "FIPS 199 categorization worksheet", source: "OSCAL", method: "examine", collectedAt: "2026-08-29T15:00:00Z", hash: "sha256:c45d…1100", classification: "CUI", expiresAt: null, summary: "Moderate confidentiality, moderate integrity, low availability. AO pending." },
  { id: "EVD-1011", systemId: "SYS-HELIOS", controlId: "PL-2", title: "Draft OSCAL SSP", source: "Aegis SSP Agent", method: "automated", collectedAt: "2026-09-12T10:18:00Z", hash: "sha256:d77a…54ef", classification: "CUI", expiresAt: null, summary: "Draft SSP generated from inventory; human review required." },
  { id: "EVD-1012", systemId: "SYS-VANGUARD", controlId: "SI-4", title: "EDR coverage report", source: "CrowdStrike", method: "automated", collectedAt: "2026-09-18T05:00:00Z", hash: "sha256:ee09…9012", classification: "CUI", expiresAt: "2026-10-18", summary: "98.7% fleet coverage; sensors current." },
  { id: "EVD-1013", systemId: "SYS-AETHER", controlId: "AU-6", title: "Sentinel use-case catalog", source: "Microsoft Sentinel", method: "examine", collectedAt: "2026-09-10T09:00:00Z", hash: "sha256:ff21…ab78", classification: "CUI", expiresAt: "2026-12-10", summary: "12 of 18 planned privileged-abuse detections active." },
  { id: "EVD-1014", systemId: "SYS-AETHER", controlId: "IR-4", title: "Incident playbook pack", source: "ServiceNow", method: "examine", collectedAt: "2026-08-02T00:00:00Z", hash: "sha256:909a…3311", classification: "CUI", expiresAt: "2027-08-02", summary: "Playbooks for ransomware, identity takeover, and data-exfil tested in tabletop." },
];

export const SEED_FINDINGS: FindingRecord[] = [
  { id: "FND-201", systemId: "SYS-AETHER", controlId: "AC-2", title: "Terminated accounts remain enabled", severity: "high", status: "open", description: "Seventeen accounts associated with terminated personnel are still enabled in Entra ID.", impact: "Unauthorized residual access to a High-impact mission system." },
  { id: "FND-202", systemId: "SYS-AETHER", controlId: "SI-2", title: "Critical KEV vulnerability unpatched", severity: "critical", status: "open", description: "CVE-2026-44102 (CISA KEV) is present on win-ops-12. Fourteen additional High findings exceed SLO.", impact: "Direct exploit path on a privileged operations host inside the boundary." },
  { id: "FND-203", systemId: "SYS-AETHER", controlId: "CM-6", title: "Undocumented STIG deviations", severity: "moderate", status: "open", description: "Nine configuration deviations on Windows STIG overlay lack an approved deviation record.", impact: "Configuration drift weakens the High baseline." },
  { id: "FND-204", systemId: "SYS-AETHER", controlId: "RA-5", title: "Incomplete authenticated scan coverage", severity: "moderate", status: "open", description: "Bastion and twelve ephemeral pods were not authenticated-scanned this cycle.", impact: "Unknown vulnerabilities on internet-adjacent and privileged assets." },
  { id: "FND-205", systemId: "SYS-ARGUS", controlId: "CM-6", title: "Legacy password SSO applications", severity: "moderate", status: "open", description: "Three enterprise applications still permit password-based SSO outside Conditional Access.", impact: "Phishing path into the identity broker." },
  { id: "FND-206", systemId: "SYS-HELIOS", controlId: "PL-2", title: "SSP not approved", severity: "high", status: "open", description: "Helios remains in assessment with a draft SSP and no AO authorization decision.", impact: "System cannot be authorized until the package is complete." },
  { id: "FND-207", systemId: "SYS-HELIOS", controlId: "AC-3", title: "Kafka ACL bypass", severity: "high", status: "open", description: "Legacy on-prem broker allows an unauthenticated ACL bypass (CVE-2026-3310).", impact: "CUI analytics pipeline confidentiality and integrity." },
];

export const SEED_POAMS: PoamRecord[] = [
  { id: "POAM-284", systemId: "SYS-AETHER", findingId: "FND-202", controlId: "SI-2", weakness: "Critical and High vulnerabilities exceed flaw-remediation SLO, including CISA KEV CVE-2026-44102 on win-ops-12.", riskLevel: "critical", owner: "ISSO, Aether-C2", dueDate: "2026-08-31", status: "delayed", milestones: [{ date: "2026-08-20", label: "Emergency change window", done: false }, { date: "2026-09-05", label: "Re-scan and close", done: false }], resources: "Windows ops + vendor patch", compensating: "EDR contain policy on win-ops-12", daysOpen: 73 },
  { id: "POAM-291", systemId: "SYS-AETHER", findingId: "FND-201", controlId: "AC-2", weakness: "Identity lifecycle does not disable contractor accounts within 24 hours of termination.", riskLevel: "high", owner: "ICAM + Aether ISSO", dueDate: "2026-09-30", status: "open", milestones: [{ date: "2026-09-22", label: "Disable 17 residual accounts", done: false }, { date: "2026-10-15", label: "SCIM contractor connector", done: false }], resources: "Entra lifecycle workflow", compensating: "Weekly orphan-account report", daysOpen: 41 },
  { id: "POAM-298", systemId: "SYS-AETHER", findingId: "FND-203", controlId: "CM-6", weakness: "Nine STIG deviations lack an approved deviation and compensating control.", riskLevel: "moderate", owner: "Platform engineering", dueDate: "2026-10-12", status: "open", milestones: [{ date: "2026-09-25", label: "Deviation package", done: false }], resources: "STIG overlay + AWS Config", compensating: null, daysOpen: 28 },
  { id: "POAM-305", systemId: "SYS-AETHER", findingId: "FND-204", controlId: "RA-5", weakness: "Authenticated vulnerability scanning does not cover bastion or ephemeral workloads.", riskLevel: "moderate", owner: "Vuln management", dueDate: "2026-10-01", status: "open", milestones: [{ date: "2026-09-21", label: "Agent on bastion", done: true }, { date: "2026-09-28", label: "EKS node scanning", done: false }], resources: "Tenable + Wiz", compensating: null, daysOpen: 19 },
  { id: "POAM-312", systemId: "SYS-ARGUS", findingId: "FND-205", controlId: "CM-6", weakness: "Three legacy apps remain on password SSO.", riskLevel: "moderate", owner: "ICAM engineering", dueDate: "2026-11-01", status: "open", milestones: [{ date: "2026-10-15", label: "Migrate to Entra SSO", done: false }], resources: "App owners", compensating: "Conditional Access block legacy auth for all other apps", daysOpen: 12 },
  { id: "POAM-330", systemId: "SYS-HELIOS", findingId: "FND-206", controlId: "PL-2", weakness: "Authorization package incomplete; SSP still draft.", riskLevel: "high", owner: "ISSO, Helios", dueDate: "2026-10-20", status: "open", milestones: [{ date: "2026-09-30", label: "Complete SSP", done: false }, { date: "2026-10-15", label: "SAR", done: false }], resources: "Aegis SSP Agent + ISSO", compensating: null, daysOpen: 22 },
  { id: "POAM-331", systemId: "SYS-HELIOS", findingId: "FND-207", controlId: "AC-3", weakness: "On-prem Kafka broker vulnerable to unauthenticated ACL bypass.", riskLevel: "high", owner: "Helios platform", dueDate: "2026-09-25", status: "open", milestones: [{ date: "2026-09-20", label: "Isolate broker", done: true }, { date: "2026-09-25", label: "Patch / replace", done: false }], resources: "Network + broker upgrade", compensating: "Network ACL restricting broker to glue jobs", daysOpen: 9 },
];

export const SEED_ASSESSMENTS: AssessmentRecord[] = [
  { id: "ASM-70", systemId: "SYS-AETHER", kind: "Annual assessment + ConMon", status: "complete", assessor: "Independent assessor (3PAO analog)", startedAt: "2026-06-02T00:00:00Z", completedAt: "2026-07-18T00:00:00Z", summary: "Authorized with conditions. Residual High risk accepted by AO pending SI-2 and AC-2 closure." },
  { id: "ASM-71", systemId: "SYS-AETHER", kind: "Continuous monitoring cycle", status: "in_progress", assessor: "Aegis Assessment Agent", startedAt: "2026-09-01T00:00:00Z", completedAt: null, summary: "Live telemetry reassessment of High-baseline controls. Three families below threshold: SI, CM, AC." },
  { id: "ASM-80", systemId: "SYS-ARGUS", kind: "Annual assessment", status: "complete", assessor: "Enterprise assessor", startedAt: "2026-03-04T00:00:00Z", completedAt: "2026-04-09T00:00:00Z", summary: "Authorized. Moderate residual risk on legacy SSO applications." },
  { id: "ASM-90", systemId: "SYS-HELIOS", kind: "Initial authorization assessment", status: "in_progress", assessor: "Aegis Assessment Agent + ISSO", startedAt: "2026-08-11T00:00:00Z", completedAt: null, summary: "Categorization complete. Implementation incomplete. Package not ready for AO." },
  { id: "ASM-95", systemId: "SYS-VANGUARD", kind: "Inherited FedRAMP + agency overlay", status: "complete", assessor: "Enterprise assessor", startedAt: "2026-01-08T00:00:00Z", completedAt: "2026-01-22T00:00:00Z", summary: "Agency ATO issued on FedRAMP inheritance with overlay controls verified." },
];

export const SEED_AGENT_RUNS: AgentRunRecord[] = [
  { id: "RUN-9001", agent: "monitor", systemId: "SYS-AETHER", status: "complete", objective: "Refresh control health from live telemetry", plan: "Pull AWS Config, Tenable, Entra, Sentinel → map to 800-53 → update control status.", tools: ["aws.get_config_rules", "tenable.get_vulnerabilities", "azure.get_policy_results"], evidence: "EVD-1001, EVD-1003, EVD-1004", decision: "SI-2 remains other-than-satisfied. AC-2 partial. SC-7 satisfied.", confidence: 93, createdAt: "2026-09-18T06:12:00Z", requiresApproval: false },
  { id: "RUN-9002", agent: "vuln", systemId: "SYS-AETHER", status: "pending_approval", objective: "Map new KEV to mission risk and draft POA&M update", plan: "Correlate CVE-2026-44102 to win-ops-12, SI-2, mission COP availability, and existing POAM-284.", tools: ["tenable.get_vulnerabilities", "splunk.search"], evidence: "EVD-1003", decision: "Recommend emergency change. Residual risk remains Critical until patched.", confidence: 96, createdAt: "2026-09-18T06:18:00Z", requiresApproval: true },
  { id: "RUN-9003", agent: "ssp", systemId: "SYS-HELIOS", status: "pending_approval", objective: "Generate draft OSCAL SSP from inventory", plan: "Ingest architecture, data types, CMDB, and selected baseline. Produce SSP sections for ISSO review.", tools: ["terraform.get_state", "aws.get_resources"], evidence: "EVD-1011", decision: "Draft SSP ready. Human approval required before package use.", confidence: 81, createdAt: "2026-09-12T10:18:00Z", requiresApproval: true },
  { id: "RUN-9004", agent: "evidence", systemId: "SYS-ARGUS", status: "complete", objective: "Collect identity lifecycle evidence for AC-2 / IA-2", plan: "Export Entra users, PIM activations, Conditional Access.", tools: ["azure.get_policy_results"], evidence: "EVD-1008, EVD-1009", decision: "Evidence current. CM-6 deviation on three apps remains.", confidence: 91, createdAt: "2026-09-18T01:14:00Z", requiresApproval: false },
];
