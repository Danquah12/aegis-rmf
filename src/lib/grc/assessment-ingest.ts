import { CONTROL_BY_ID } from "./catalog";
import { deriveObjectives } from "./layer1";
import type { AssessmentMethod, AssessmentResult, PortfolioSnapshot, RiskLevel } from "./types";

export interface IngestObservation {
  controlId: string;
  method: AssessmentMethod;
  result: AssessmentResult;
  comments: string;
  evidenceTitle: string;
  evidenceSummary: string;
  findingTitle?: string;
  findingSeverity?: RiskLevel;
}

const METHODS: AssessmentMethod[] = ["examine", "interview", "test"];
const RESULTS: AssessmentResult[] = ["satisfied", "other", "not_assessed"];

export function normalizeControlId(raw: string): string {
  const t = raw.trim().toUpperCase().replace(/_/g, "-");
  const enh = t.match(/^([A-Z]{2})-(\d+)\.(\d+)$/);
  if (enh) return `${enh[1]}-${enh[2]}(${enh[3]})`;
  const paren = t.match(/^([A-Z]{2})-(\d+)\((\d+)\)$/);
  if (paren) return `${paren[1]}-${paren[2]}(${paren[3]})`;
  const base = t.match(/^([A-Z]{2})-(\d+)$/);
  if (base) return `${base[1]}-${Number(base[2])}`;
  return t;
}

function asMethod(v: unknown): AssessmentMethod {
  const s = String(v ?? "examine").toLowerCase();
  return METHODS.includes(s as AssessmentMethod) ? (s as AssessmentMethod) : "examine";
}

function asResult(v: unknown): AssessmentResult {
  const s = String(v ?? "not_assessed").toLowerCase().replace(/\s+/g, "_");
  if (s === "other_than_satisfied" || s === "ots" || s === "fail" || s === "failed") return "other";
  if (s === "pass" || s === "passed" || s === "sat") return "satisfied";
  return RESULTS.includes(s as AssessmentResult) ? (s as AssessmentResult) : "other";
}

function asSeverity(v: unknown): RiskLevel {
  const s = String(v ?? "high").toLowerCase();
  if (s === "critical" || s === "high" || s === "moderate" || s === "low") return s;
  return "high";
}

export function observationsFor(systemId: string): IngestObservation[] {
  if (systemId === "SYS-HELIOS") {
    return [
      {
        controlId: "AC-3",
        method: "test",
        result: "other",
        comments: "Unauthenticated Kafka ACL bypass (CVE-2026-3310) on kafka-onprem-01. CUI event stream reachable without authorization.",
        evidenceTitle: "C3PAO analog — Kafka ACL test",
        evidenceSummary: "Test procedure AC-3.T against advertised listeners. Bypass confirmed. Broker isolated; patch not complete.",
        findingTitle: "Kafka ACL bypass on CUI bus",
        findingSeverity: "high",
      },
      {
        controlId: "PL-2",
        method: "examine",
        result: "other",
        comments: "SSP remains draft (package 0.9). No AO-approved system security plan.",
        evidenceTitle: "C3PAO analog — SSP examine",
        evidenceSummary: "OSCAL SSP draft EVD-1011 reviewed. Human approval missing. Cannot assert 800-171 3.12 / CMMC L2.",
        findingTitle: "SSP not approved",
        findingSeverity: "high",
      },
      {
        controlId: "SC-28",
        method: "examine",
        result: "other",
        comments: "S3 default encryption is CSP-inherited. Agency CMK policy and bucket ACLs not verified. Inheritance still proposed.",
        evidenceTitle: "C3PAO analog — CUI at rest",
        evidenceSummary: "Customer-responsibility SC-28 not satisfied. Helios SOW §3.1 requires agency-controlled keys.",
        findingTitle: "CUI encryption customer responsibility unverified",
        findingSeverity: "high",
      },
      {
        controlId: "RA-2",
        method: "examine",
        result: "satisfied",
        comments: "FIPS 199 worksheet on file. Moderate / moderate / low. AO categorization pending signature, not a control fail.",
        evidenceTitle: "C3PAO analog — categorization worksheet",
        evidenceSummary: "EVD-1010 examined. Impact levels documented.",
      },
      {
        controlId: "CA-2",
        method: "examine",
        result: "other",
        comments: "Initial authorization assessment in progress. Package not ready for AO.",
        evidenceTitle: "C3PAO analog — assessment completeness",
        evidenceSummary: "SAP/SAR artifacts generated as draft. Independent assessor has not signed.",
        findingTitle: "Assessment package incomplete",
        findingSeverity: "moderate",
      },
    ];
  }
  if (systemId === "SYS-AETHER") {
    return [
      {
        controlId: "AC-2",
        method: "test",
        result: "other",
        comments: "Seventeen terminated identities remain enabled beyond the 24-hour disablement objective.",
        evidenceTitle: "SCA — Entra account test",
        evidenceSummary: "IdP export matched to HR termination feed. Contractor path fails closed only for employees.",
        findingTitle: "Terminated accounts remain enabled",
        findingSeverity: "high",
      },
      {
        controlId: "SI-2",
        method: "test",
        result: "other",
        comments: "CISA KEV CVE-2026-44102 present on win-ops-12. POAM-284 delayed.",
        evidenceTitle: "SCA — KEV retest",
        evidenceSummary: "Authenticated scan confirms KEV. EDR contain is compensating, not closure.",
        findingTitle: "Critical KEV unpatched",
        findingSeverity: "critical",
      },
      {
        controlId: "CM-6",
        method: "examine",
        result: "other",
        comments: "Nine STIG deviations on Windows overlay lack an approved deviation record.",
        evidenceTitle: "SCA — STIG overlay examine",
        evidenceSummary: "AWS Config noncompliant rules without ISSM-approved deviations.",
        findingTitle: "Undocumented STIG deviations",
        findingSeverity: "moderate",
      },
      {
        controlId: "SC-7",
        method: "examine",
        result: "satisfied",
        comments: "Public ingress limited to API gateway. Databases private. TGW/WAF present.",
        evidenceTitle: "SCA — boundary examine",
        evidenceSummary: "Security group and private endpoint inventory matches the authorization boundary.",
      },
      {
        controlId: "IA-2(1)",
        method: "test",
        result: "satisfied",
        comments: "99.4% privileged users phishing-resistant MFA (PIV / FIDO).",
        evidenceTitle: "SCA — privileged MFA test",
        evidenceSummary: "Entra PIV/FIDO enrollment export sampled.",
      },
      {
        controlId: "RA-5",
        method: "examine",
        result: "other",
        comments: "Authenticated scanning 88%. Bastion and twelve ephemeral pods excluded this cycle.",
        evidenceTitle: "SCA — scan coverage examine",
        evidenceSummary: "Coverage map from Tenable. Unscanned privileged and ephemeral assets.",
        findingTitle: "Incomplete authenticated scan coverage",
        findingSeverity: "moderate",
      },
    ];
  }
  if (systemId === "SYS-ARGUS") {
    return [
      {
        controlId: "CM-6",
        method: "examine",
        result: "other",
        comments: "Three enterprise apps still allow password SSO outside Conditional Access.",
        evidenceTitle: "SCA — Conditional Access examine",
        evidenceSummary: "Baseline enforced except three legacy apps.",
        findingTitle: "Legacy password SSO applications",
        findingSeverity: "moderate",
      },
      {
        controlId: "IA-2",
        method: "test",
        result: "satisfied",
        comments: "Workforce MFA 99.1% outside the three excluded apps.",
        evidenceTitle: "SCA — workforce MFA test",
        evidenceSummary: "Entra MFA coverage export.",
      },
    ];
  }
  return [
    {
      controlId: "SI-4",
      method: "examine",
      result: "satisfied",
      comments: "EDR coverage 98.7%. Sensors current. FedRAMP inheritance plus agency overlay.",
      evidenceTitle: "SCA — EDR coverage examine",
      evidenceSummary: "VANGUARD tenant coverage report.",
    },
    {
      controlId: "SI-3",
      method: "examine",
      result: "satisfied",
      comments: "Malicious code protection inherited from FedRAMP High SaaS.",
      evidenceTitle: "SCA — inherited SI-3 examine",
      evidenceSummary: "FedRAMP package + agency overlay verified.",
    },
  ];
}

export function sampleSarJson(systemId: string): string {
  const reviewed = observationsFor(systemId).map((o) => ({
    "control-id": o.controlId.toLowerCase(),
    result: o.result,
    method: o.method,
    remarks: o.comments,
    finding: o.findingTitle ?? null,
    severity: o.findingSeverity ?? null,
    evidence: { title: o.evidenceTitle, description: o.evidenceSummary },
  }));
  const title =
    systemId === "SYS-HELIOS"
      ? "Helios C3PAO analog — draft SAR"
      : systemId === "SYS-AETHER"
        ? "Aether SCA — 800-53A assessment results"
        : "Imported assessment results";
  return JSON.stringify(
    {
      "oscal-version": "1.1.3",
      metadata: {
        title,
        published: "2026-09-19T00:00:00Z",
        remarks: "Unofficial. Does not issue ATO, CMMC certification, or FedRAMP P-ATO.",
      },
      "assessment-results": {
        uuid: `sar-${systemId.toLowerCase()}`,
        "reviewed-controls": reviewed,
      },
    },
    null,
    2,
  );
}

function fromReviewed(row: Record<string, unknown>): IngestObservation | null {
  const controlId = normalizeControlId(String(row["control-id"] ?? row.controlId ?? row.control ?? ""));
  if (!controlId) return null;
  const method = asMethod(row.method ?? row["assessment-method"]);
  const result = asResult(row.result ?? row["finding-status"] ?? row.status);
  const comments = String(row.remarks ?? row.comments ?? row.description ?? row.title ?? "");
  const ev =
    row.evidence && typeof row.evidence === "object"
      ? (row.evidence as Record<string, unknown>)
      : {};
  const findingTitle = row.finding ? String(row.finding) : result === "other" ? `${controlId} other than satisfied` : undefined;
  return {
    controlId,
    method,
    result,
    comments: comments || `${controlId} ${method} ${result}`,
    evidenceTitle: String(ev.title ?? row.title ?? `Imported ${controlId} ${method}`),
    evidenceSummary: String(ev.description ?? ev.summary ?? (comments || "Imported from assessment tool.")),
    findingTitle,
    findingSeverity: row.severity ? asSeverity(row.severity) : result === "other" ? "high" : undefined,
  };
}

export function parseAssessmentPayload(
  raw: string,
): { ok: true; observations: IngestObservation[]; source: string } | { ok: false; error: string } {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Paste OSCAL assessment-results JSON or an 800-53A payload." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Payload is not JSON. Export OSCAL assessment-results from the workbench." };
  }
  const rows: Record<string, unknown>[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const o = node as Record<string, unknown>;
    if (o["control-id"] || o.controlId || o.control) rows.push(o);
    const nested =
      o["reviewed-controls"] ??
      o.observations ??
      o.results ??
      o.findings ??
      o["assessment-results"] ??
      o["implemented-requirements"];
    if (nested) walk(nested);
  };
  walk(parsed);
  const observations = rows.map(fromReviewed).filter((x): x is IngestObservation => Boolean(x));
  if (!observations.length) {
    return { ok: false, error: "No reviewed-controls or observations found. Need control-id + result." };
  }
  const known = observations.filter((o) => CONTROL_BY_ID[o.controlId] || CONTROL_BY_ID[o.controlId.replace(/\([^)]+\)$/, "")]);
  if (!known.length) {
    return { ok: false, error: "Controls in the payload are not in the loaded 800-53 catalog." };
  }
  const source =
    typeof parsed === "object" && parsed && "metadata" in parsed
      ? String((parsed as { metadata?: { title?: string } }).metadata?.title ?? "OSCAL SAR")
      : "Assessment workbench";
  return { ok: true, observations: known, source };
}

export const PIPELINE_STEPS = [
  { id: "collect", label: "Collect", detail: "Connectors write the evidence lake and remap to 800-53A." },
  { id: "link", label: "Link tool", detail: "OSCAL SAR from eMASS, Xacta, C3PAO, or 3PAO." },
  { id: "assess", label: "Assess", detail: "Examine / interview / test. SCA still records." },
  { id: "findings", label: "Findings", detail: "Other-than-satisfied opens a finding and POA&M." },
  { id: "authorize", label: "Authorize", detail: "AO only. Pipeline never issues an ATO." },
] as const;

export type PipelineStepId = (typeof PIPELINE_STEPS)[number]["id"];

export interface PipelineState {
  collected: boolean;
  linked: boolean;
  assessed: boolean;
  findingsReady: boolean;
  authorizeHuman: true;
  evidenceCount: number;
  jobCount: number;
  oscalJobs: number;
  objectiveCount: number;
  assessedCount: number;
  satisfiedCount: number;
  otherCount: number;
  findingsOpen: number;
  poamsOpen: number;
  atoStatus: string;
  sarStatus: string;
  active: PipelineStepId;
}

export function pipelineState(p: PortfolioSnapshot, systemId: string): PipelineState {
  const system = p.systems.find((s) => s.id === systemId);
  const evidence = p.evidence.filter((e) => e.systemId === systemId);
  const jobs = p.collectionJobs.filter((j) => j.systemId === systemId);
  const oscalJobs = jobs.filter((j) => j.connectorId === "oscal").length;
  const imported = p.assessments.some(
    (a) => a.systemId === systemId && /OSCAL|Imported|assessment-results|pipeline/i.test(`${a.kind} ${a.summary}`),
  );
  const objectives = deriveObjectives(p, systemId);
  const assessedRows = objectives.filter((o) => o.result !== "not_assessed");
  const other = objectives.filter((o) => o.result === "other");
  const findingsOpen = p.findings.filter((f) => f.systemId === systemId && f.status === "open").length;
  const poamsOpen = p.poams.filter((x) => x.systemId === systemId && x.status !== "completed").length;
  const sar = p.artifacts.find((a) => a.systemId === systemId && a.kind === "sar");
  const collected = jobs.length > 0 || evidence.length > 0;
  const linked = oscalJobs > 0 || imported;
  const assessed = assessedRows.length > 0;
  const findingsReady = other.length > 0;
  const active: PipelineStepId = !collected
    ? "collect"
    : !linked
      ? "link"
      : !assessed
        ? "assess"
        : findingsReady
          ? "findings"
          : "authorize";
  return {
    collected,
    linked,
    assessed,
    findingsReady,
    authorizeHuman: true,
    evidenceCount: evidence.length,
    jobCount: jobs.length,
    oscalJobs,
    objectiveCount: objectives.length,
    assessedCount: assessedRows.length,
    satisfiedCount: objectives.filter((o) => o.result === "satisfied").length,
    otherCount: other.length,
    findingsOpen,
    poamsOpen,
    atoStatus: system?.atoStatus ?? "in_assessment",
    sarStatus: sar?.status ?? "missing",
    active,
  };
}
