import { rmfStepForControl } from "./cycle";
import type { PortfolioSnapshot, RmfStep, SupportDocument } from "./types";

export const DOC_KINDS = [
  { id: "worksheet", label: "Worksheet" },
  { id: "tailoring", label: "Overlay / tailoring" },
  { id: "policy", label: "Policy" },
  { id: "procedure", label: "Procedure / SOP" },
  { id: "architecture", label: "Architecture" },
  { id: "ssp", label: "SSP excerpt" },
  { id: "sap", label: "SAP / test procedure" },
  { id: "sar", label: "SAR excerpt" },
  { id: "residual", label: "Residual risk" },
  { id: "conmon", label: "ConMon strategy" },
  { id: "other", label: "Other" },
] as const;

export type DocKind = (typeof DOC_KINDS)[number]["id"];

export function isDocKind(value: string): value is DocKind {
  return DOC_KINDS.some((k) => k.id === value);
}

export const STEP_DOC_KIND: Record<RmfStep, DocKind> = {
  prepare: "architecture",
  categorize: "worksheet",
  select: "tailoring",
  implement: "ssp",
  assess: "sap",
  authorize: "residual",
  monitor: "conmon",
};

export const STEP_DOC_HINT: Record<RmfStep, string> = {
  prepare: "Boundary, inventory, risk strategy, stakeholder register.",
  categorize: "FIPS 199 worksheet, SP 800-60 information types, PIA.",
  select: "800-53B baseline, overlay, tailoring justifications, inheritance.",
  implement: "SSP implementation statements, as-built architecture, SOPs.",
  assess: "SAP, 800-53A procedures, SAR excerpts, test evidence.",
  authorize: "Residual risk brief, POA&M, authorization package.",
  monitor: "CA-7 strategy, metrics, ongoing authorization evidence.",
};

export function parseControlIds(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export function tailoredControls(p: PortfolioSnapshot, systemId: string) {
  return p.implementations.filter((i) => i.systemId === systemId && i.status !== "not_applicable");
}

export interface DocCompare {
  step: RmfStep | "all";
  tailored: number;
  covered: number;
  extra: number;
  percent: number;
  coveredIds: string[];
  gapIds: string[];
  extraIds: string[];
  docs: number;
}

export function compareSupportDocs(
  p: PortfolioSnapshot,
  systemId: string,
  step?: RmfStep,
): DocCompare {
  const tailored = tailoredControls(p, systemId).filter(
    (i) => !step || rmfStepForControl(i.controlId) === step,
  );
  const tailoredIds = new Set(tailored.map((i) => i.controlId));
  const docs = (p.supportDocuments ?? []).filter(
    (d) => d.systemId === systemId && (!step || d.rmfStep === step),
  );
  const mapped = new Set(docs.flatMap((d) => d.controlIds));
  const coveredIds = [...tailoredIds].filter((id) => mapped.has(id));
  const gapIds = [...tailoredIds].filter((id) => !mapped.has(id));
  const extraIds = [...mapped].filter((id) => !tailoredIds.has(id));
  const percent = tailoredIds.size ? Math.round((coveredIds.length / tailoredIds.size) * 100) : 0;
  return {
    step: step ?? "all",
    tailored: tailoredIds.size,
    covered: coveredIds.length,
    extra: extraIds.length,
    percent,
    coveredIds,
    gapIds,
    extraIds,
    docs: docs.length,
  };
}

export const SUPPORT_DOC_SEED: SupportDocument[] = [
  {
    id: "DOC-HELIOS-PREPARE",
    systemId: "SYS-HELIOS",
    rmfStep: "prepare",
    kind: "architecture",
    title: "Helios authorization boundary and inventory",
    body: "Hybrid boundary: GovCloud S3/Glue/Athena, on-prem Kafka, restricted analyst workstations, private API to Aether-C2. Inventory is the CMDB extract used for CM-8. Stakeholders: Analytics Program Owner, ISSO Helios, AO Mission Directorate.",
    controlIds: ["CM-8", "PM-9", "RA-3"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-09-12T00:00:00Z",
  },
  {
    id: "DOC-HELIOS-CATEGORIZE",
    systemId: "SYS-HELIOS",
    rmfStep: "categorize",
    kind: "worksheet",
    title: "FIPS 199 categorization worksheet",
    body: "Information types: CUI mission analytics, PII of analysts. Confidentiality moderate, integrity moderate, availability low. High-water mark moderate. Overlay: Privacy + Cloud.",
    controlIds: ["RA-2"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-09-12T00:00:00Z",
  },
  {
    id: "DOC-HELIOS-SELECT",
    systemId: "SYS-HELIOS",
    rmfStep: "select",
    kind: "tailoring",
    title: "Moderate baseline overlay and tailoring record",
    body: "SP 800-53B moderate baseline. Privacy overlay on PII holdings. Cloud overlay for GovCloud customer responsibility. AC-3 tailored for Kafka ACL enforcement. SC-28 hybrid with KMS. Not selected: PE physical (inherited from facility). This is the tailored control set the engine compares against.",
    controlIds: ["PL-2", "AC-2", "AC-3", "SC-7", "SC-28"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-09-14T00:00:00Z",
  },
  {
    id: "DOC-HELIOS-IMPLEMENT",
    systemId: "SYS-HELIOS",
    rmfStep: "implement",
    kind: "ssp",
    title: "SSP draft — architecture and Kafka ACL",
    body: "As-built: Kafka topic ACLs are the access enforcement point for analytic datasets (AC-3). Encryption at rest is KMS plus bucket policy (SC-28 hybrid). Architecture package remains draft (PL-8).",
    controlIds: ["PL-8", "AC-3", "SC-28"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-09-15T00:00:00Z",
  },
  {
    id: "DOC-HELIOS-ASSESS",
    systemId: "SYS-HELIOS",
    rmfStep: "assess",
    kind: "sap",
    title: "SAP — examine / interview / test for Helios CUI",
    body: "Examine: SSP PL-2, Kafka ACL dumps, KMS key policy. Interview: ISSO on CUI handling. Test: collector feeds + sample OSCAL SAR. Engine does not close a POA&M from this SAP.",
    controlIds: ["CA-2", "PL-2", "AC-3"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-09-16T00:00:00Z",
  },
  {
    id: "DOC-HELIOS-AUTHORIZE",
    systemId: "SYS-HELIOS",
    rmfStep: "authorize",
    kind: "residual",
    title: "Residual risk briefing for AO",
    body: "Open High/Critical POA&M remain. Engine stages this package. Only the AO accepts residual risk. Conditions proposed: close High/Critical POA&M, monthly ConMon to AO.",
    controlIds: ["CA-6", "CA-5", "PM-10"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-09-17T00:00:00Z",
  },
  {
    id: "DOC-HELIOS-MONITOR",
    systemId: "SYS-HELIOS",
    rmfStep: "monitor",
    kind: "conmon",
    title: "CA-7 continuous monitoring strategy",
    body: "Collectors remap cloud, SIEM, IAM, and scanner telemetry to 800-53A. Cadence is user-initiated. Authorization is not modified by collection.",
    controlIds: ["CA-7", "SI-4", "RA-5"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-09-18T00:00:00Z",
  },
  {
    id: "DOC-AETHER-SELECT",
    systemId: "SYS-AETHER",
    rmfStep: "select",
    kind: "tailoring",
    title: "High baseline + Privacy/Cloud/Tactical overlays",
    body: "800-53B high. Privacy, Cloud, and Tactical overlays. Coalition federation is a system-specific parameter on IA-2. Inheritance from ARGUS-ID for workforce IAM.",
    controlIds: ["PL-2", "AC-2", "IA-2", "SC-7"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-08-02T00:00:00Z",
  },
];
