import { CONNECTORS, type ConnectorDef } from "./layer1";

/** AegisRMF is the system of record. eMASS, CSAM, and Xacta are not required. */
export const STANDALONE_STATEMENT =
  "AegisRMF is the standalone system of record. It performs the RMF workbench, authorization package, assessment recording, POA&M, ConMon, and FISMA inventory. eMASS, CSAM, and Xacta are optional exchange targets — not dependencies. Scanners attach here. Agents never issue an ATO.";

export const STANDALONE_CAPABILITIES: {
  replaces: string;
  capability: string;
  where: string;
}[] = [
  { replaces: "eMASS", capability: "System registration and authorization boundary", where: "/systems" },
  { replaces: "eMASS", capability: "Control implementation statements", where: "/implementation" },
  { replaces: "eMASS", capability: "Inheritance / common / hybrid / system-specific", where: "/inheritance" },
  { replaces: "eMASS", capability: "Package: SSP, SAP, SAR, POA&M, artifacts", where: "/ato" },
  { replaces: "eMASS", capability: "Workflow gates ISSO → SCA → ISSM → AO", where: "/workflow" },
  { replaces: "eMASS / Xacta", capability: "800-53A examine / interview / test", where: "/assessments" },
  { replaces: "eMASS / Xacta", capability: "Authorization decision and history", where: "/ato" },
  { replaces: "Xacta", capability: "Inventory, overlays, baseline, ConMon", where: "/engine" },
  { replaces: "Xacta", capability: "OSCAL SSP / SAP / SAR / POA&M export", where: "/reports" },
  { replaces: "CSAM", capability: "FISMA inventory, ATO status, POA&M aging", where: "/reports" },
  { replaces: "CSAM", capability: "Agency reporting schema (not one frozen report)", where: "/matrix" },
];

export const ASSESSMENT_TOOL_IDS = [
  "acas",
  "stig",
  "nmap",
  "etec",
  "network-scan",
  "app-scan",
  "oscal",
  "axiom",
  "axiom-sca",
  "axiom-iac",
] as const;
export type AssessmentToolId = (typeof ASSESSMENT_TOOL_IDS)[number];

export function isAssessmentTool(id: string): id is AssessmentToolId {
  return (ASSESSMENT_TOOL_IDS as readonly string[]).includes(id);
}

export function assessmentTools(): ConnectorDef[] {
  return CONNECTORS.filter((c) => c.family === "assessment");
}

export const TOOL_HINTS: Record<AssessmentToolId, string> = {
  acas: "Authenticated vulnerability scan. Maps to RA-5 / SI-2. Paste Nessus/ACAS CSV or JSON when you wire the live collector.",
  stig: "DISA STIG checklist / Evaluate-STIG / SCAP. Maps CAT I–III to CM-6. Attach CKL or XCCDF.",
  nmap: "Host, port, and service discovery. Feeds CM-8 inventory and SC-7 exposure. Attach XML or gnmap.",
  etec: "Your evaluation test engine. Records TEST procedures against assessment objectives. Attach the harness export.",
  "network-scan": "Your network scanner. Boundary, listeners, and unauthorized services.",
  "app-scan": "Your application scanner. SAST/DAST/API findings bound to SA-11 and SI-10.",
  oscal: "Native 800-53A workbench. This is Aegis — not an eMASS import.",
  axiom: "AXIOM DAST v2. Auto-scans the system under assessment. CWE → 800-53. Does not authorize.",
  "axiom-sca": "AXIOM SCA. Auto-scans SBOM / CVE / license on Assess. Maps to RA-5, SI-2, SR-3.",
  "axiom-iac": "AXIOM IaC. Auto-scans Terraform / Checkov / tfsec on Assess. Maps to CM-6, SC-7, AC-3.",
};
