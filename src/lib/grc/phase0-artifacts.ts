import type {
  AssessmentCadence,
  OrgArtifact,
  OrgArtifactKind,
  OrgRmfBaseline,
  PortfolioSnapshot,
} from "./types";

export const PHASE0_CATALOG: OrgArtifactKind[] = [
  {
    id: "ispp",
    canonicalId: "ispp",
    name: "Information Security Program Plan",
    aliases: "ISPP, ISPP, NIST 800-18 program plan",
    required: true,
    nistTask: "P-1",
    controlIds: ["PM-1", "PM-2", "PM-3"],
    ownerRole: "saiso",
    agency: "NIST",
    hint: "Program scope, resources, and how the security program is managed.",
  },
  {
    id: "isp",
    canonicalId: "isp",
    name: "Information Security Policy",
    aliases: "ISP, organizational security policy, AC-1 policy",
    required: true,
    nistTask: "P-1",
    controlIds: ["AC-1", "PM-1"],
    ownerRole: "saiso",
    agency: "NIST",
    hint: "Organization-wide information security policy. Family -1 policies may inherit from this.",
  },
  {
    id: "rms",
    canonicalId: "rms",
    name: "Risk Management Strategy",
    aliases: "RMS, risk appetite, risk tolerance",
    required: true,
    nistTask: "P-2",
    controlIds: ["PM-9", "RA-3"],
    ownerRole: "risk_executive",
    agency: "NIST",
    hint: "How the organization assesses, responds to, and monitors risk. Residual risk is never agent-accepted.",
  },
  {
    id: "ora",
    canonicalId: "ora",
    name: "Risk Assessment",
    aliases: "organizational risk assessment, ORA, enterprise RA",
    required: true,
    nistTask: "P-3",
    controlIds: ["RA-3", "PM-9"],
    ownerRole: "risk_executive",
    agency: "NIST",
    hint: "Organization-level assessment that feeds system categorization.",
  },
  {
    id: "css",
    canonicalId: "css",
    name: "Cybersecurity Strategy",
    aliases: "CSS, cyber strategy, ZT strategy",
    required: true,
    nistTask: "P-2",
    controlIds: ["PM-9", "PM-11"],
    ownerRole: "saiso",
    agency: "NIST",
    hint: "Direction of the cybersecurity program, including Zero Trust intent.",
  },
  {
    id: "ppp",
    canonicalId: "ppp",
    name: "Privacy Program Plan",
    aliases: "PPP, privacy plan, SAOP plan",
    required: true,
    nistTask: "P-1",
    controlIds: ["PM-18", "PT-1", "PT-2"],
    ownerRole: "privacy_officer",
    agency: "NIST",
    hint: "Privacy program managed by the Senior Agency Official for Privacy.",
  },
  {
    id: "ea",
    canonicalId: "ea",
    name: "Enterprise Architecture",
    aliases: "EA, enterprise architecture package",
    required: true,
    nistTask: "P-16",
    controlIds: ["PM-7", "PL-8"],
    ownerRole: "enterprise_architect",
    agency: "NIST",
    hint: "How systems align to the enterprise architecture.",
  },
  {
    id: "sa",
    canonicalId: "sa",
    name: "Security Architecture",
    aliases: "security architecture, reference architecture",
    required: true,
    nistTask: "P-16",
    controlIds: ["PL-8", "SC-7"],
    ownerRole: "security_architect",
    agency: "NIST",
    hint: "Control allocation to architecture layers and common providers.",
  },
  {
    id: "cmp",
    canonicalId: "cmp",
    name: "Configuration Management Plan",
    aliases: "CMP, CM plan",
    required: true,
    nistTask: "P-18",
    controlIds: ["CM-9", "CM-2", "CM-3"],
    ownerRole: "saiso",
    agency: "NIST",
    hint: "Baselines, change control, and inventory for the organization.",
  },
  {
    id: "irp",
    canonicalId: "irp",
    name: "Incident Response Plan",
    aliases: "IRP, incident response plan, IR playbook",
    required: true,
    nistTask: "P-7",
    controlIds: ["IR-8", "IR-4", "IR-6"],
    ownerRole: "saiso",
    agency: "NIST",
    hint: "How incidents are declared, triaged, and reported. Does not close a POA&M.",
  },
  {
    id: "cpp",
    canonicalId: "cpp",
    name: "Contingency Planning Policy",
    aliases: "CP policy, COOP, disaster recovery policy",
    required: true,
    nistTask: "P-7",
    controlIds: ["CP-1", "CP-2"],
    ownerRole: "saiso",
    agency: "NIST",
    hint: "Organization contingency policy. System CP plans inherit from this.",
  },
  {
    id: "cms",
    canonicalId: "cms",
    name: "Continuous Monitoring Strategy",
    aliases: "ISCM, CA-7 strategy, ConMon strategy, ongoing authorization strategy",
    required: true,
    nistTask: "P-7",
    controlIds: ["CA-7", "PM-31"],
    ownerRole: "saiso",
    agency: "NIST",
    hint: "Org ISCM cadence and metrics. Strategy is not an ATO.",
  },
  {
    id: "scrm",
    canonicalId: "scrm",
    name: "Supply Chain Risk Management Strategy",
    aliases: "SCRM, C-SCRM, SR-1 strategy",
    required: true,
    nistTask: "P-17",
    controlIds: ["SR-1", "SR-2", "SR-3"],
    ownerRole: "saiso",
    agency: "NIST",
    hint: "How the organization manages supplier and product risk.",
  },
];

export const PHASE0_AGENCY_KIND: OrgArtifactKind = {
  id: "anma-cdip",
  canonicalId: "css",
  name: "ANMA Cybersecurity Discipline Implementation Plan",
  aliases: "CDIP, CSIP",
  required: false,
  nistTask: "P-2",
  controlIds: ["PM-9", "PM-11"],
  ownerRole: "saiso",
  agency: "ANMA",
  hint: "Agency-specific title that maps to the NIST Cybersecurity Strategy artifact.",
};

export const PHASE0_KIND_SEED: OrgArtifactKind[] = [...PHASE0_CATALOG, PHASE0_AGENCY_KIND];

export const PHASE0_ARTIFACT_SEED: OrgArtifact[] = [
  {
    id: "OA-ISPP",
    kindId: "ispp",
    orgId: "ORG-SEC",
    title: "ANMA Information Security Program Plan",
    body: "SAISO-owned program. Covers PM-family governance, common-control strategy, and resource plan. Does not authorize systems.",
    controlIds: ["PM-1", "PM-2", "PM-3"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "OA-ISP",
    kindId: "isp",
    orgId: "ORG-GOV",
    title: "ANMA Information Security Policy",
    body: "Organization-wide policy. Family -1 policies inherit from this document. Governance publishes; the engine does not.",
    controlIds: ["AC-1", "PM-1"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "OA-RMS",
    kindId: "rms",
    orgId: "ORG-RE",
    title: "ANMA Risk Management Strategy",
    body: "High-impact mission systems require AO-C or full ATO. Residual risk is never agent-accepted. Appetite set by the risk executive function.",
    controlIds: ["PM-9", "RA-3"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "OA-ORA",
    kindId: "ora",
    orgId: "ORG-RE",
    title: "ANMA organizational risk assessment",
    body: "Mission, CUI, and identity risk recorded at the organization. Feeds FIPS 199 high-water marks for Aether, Helios, Argus, and Vanguard.",
    controlIds: ["RA-3", "PM-9"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-04-02T00:00:00Z",
  },
  {
    id: "OA-CSS",
    kindId: "css",
    orgId: "ORG-SEC",
    title: "ANMA cybersecurity strategy",
    body: "Zero Trust intent, phishing-resistant authenticators for privileged access, and inheritance from Argus ICAM / Vanguard EDR.",
    controlIds: ["PM-9", "PM-11"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-03-18T00:00:00Z",
  },
  {
    id: "OA-PPP",
    kindId: "ppp",
    orgId: "ORG-PRIV",
    title: "ANMA Privacy Program Plan",
    body: "SAOP-owned. PIA / SORN coordination. Privacy overlay applied at Select for systems that process PII.",
    controlIds: ["PM-18", "PT-1", "PT-2"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-02-28T00:00:00Z",
  },
  {
    id: "OA-EA",
    kindId: "ea",
    orgId: "ORG-GOV",
    title: "ANMA enterprise architecture",
    body: "Systems register under a component. Shared services (ICAM, EDR) are common-control providers. Hybrid GovCloud plus on-prem Kafka is an approved pattern.",
    controlIds: ["PM-7", "PL-8"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-01-11T00:00:00Z",
  },
  {
    id: "OA-SA",
    kindId: "sa",
    orgId: "ORG-GOV",
    title: "ANMA security architecture",
    body: "Control allocation: Argus inherits IA/AC workforce, Vanguard inherits SI-4 endpoint, facility PE is inherited. Customer-responsibility matrix is published.",
    controlIds: ["PL-8", "SC-7"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-01-11T00:00:00Z",
  },
  {
    id: "OA-CMP",
    kindId: "cmp",
    orgId: "ORG-SEC",
    title: "ANMA configuration management plan",
    body: "CMDB is the inventory of record (CM-8). Change tickets flow through ServiceNow. Baselines are reviewed quarterly.",
    controlIds: ["CM-9", "CM-2", "CM-3"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-05-01T00:00:00Z",
  },
  {
    id: "OA-IRP",
    kindId: "irp",
    orgId: "ORG-CISO",
    title: "ANMA incident response plan",
    body: "Incidents declared in ServiceNow, triaged by SOC, reported to the ISSO. Confirmed deficiencies open a POA&M — the engine does not close one.",
    controlIds: ["IR-8", "IR-4", "IR-6"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2025-09-01T00:00:00Z",
  },
  {
    id: "OA-CMS",
    kindId: "cms",
    orgId: "ORG-SEC",
    title: "ANMA continuous monitoring strategy",
    body: "High-impact systems require quarterly independent assessment of CA-2, RA-5, SI-2, AC-2, and IA-2. Identity (Argus) and endpoint (Vanguard) telemetry is continuous. KEV SLO is 15 days. Org ISCM cadence and cATO review path. Collectors never modify authorization status. Strategy is not an ATO.",
    controlIds: ["CA-7", "PM-31"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-03-12T00:00:00Z",
  },
  {
    id: "OA-CDIP",
    kindId: "anma-cdip",
    orgId: "ORG-SEC",
    title: "ANMA CDIP — agency overlay of the cybersecurity strategy",
    body: "Agency-specific title. Maps to the NIST Cybersecurity Strategy artifact so the engine can compare either name.",
    controlIds: ["PM-9", "PM-11"],
    source: "pasted",
    url: null,
    status: "attached",
    updatedAt: "2026-03-18T00:00:00Z",
  },
];

export const PHASE0_AI_ACTIVITIES = [
  {
    id: "baseline",
    label: "Build org RMF baseline",
    summary: "Organization → policies → governance → risk tolerance → requirements → control baseline → assessment methodology.",
  },
  {
    id: "classify",
    label: "Classify artifact",
    summary: "Map a pasted title to a catalog kind, including agency-specific aliases.",
  },
  {
    id: "extract",
    label: "Extract control IDs",
    summary: "Pull 800-53 IDs the artifact implements at the organization.",
  },
  {
    id: "gap",
    label: "Gap the catalog",
    summary: "Required kinds with no attached document, including agency-required names.",
  },
  {
    id: "draft",
    label: "Draft a missing artifact",
    summary: "Fill an outline for the first gap. Human publishes — not official.",
  },
  {
    id: "freshness",
    label: "Check review cycle",
    summary: "Flag org artifacts older than 12 months.",
  },
] as const;

export type Phase0AiId = (typeof PHASE0_AI_ACTIVITIES)[number]["id"];

export function isPhase0AiId(value: string): value is Phase0AiId {
  return PHASE0_AI_ACTIVITIES.some((a) => a.id === value);
}

export interface Phase0ArtifactView {
  kinds: OrgArtifactKind[];
  artifacts: OrgArtifact[];
  required: number;
  covered: number;
  percent: number;
  gaps: OrgArtifactKind[];
  stale: OrgArtifact[];
}

function kindsOf(p: PortfolioSnapshot): OrgArtifactKind[] {
  return p.orgArtifactKinds?.length ? p.orgArtifactKinds : PHASE0_KIND_SEED;
}

function artifactsOf(p: PortfolioSnapshot): OrgArtifact[] {
  return p.orgArtifacts ?? [];
}

export function canonicalOf(kind: OrgArtifactKind): string {
  return kind.canonicalId || kind.id;
}

export function coversKind(kinds: OrgArtifactKind[], artifacts: OrgArtifact[], kind: OrgArtifactKind): boolean {
  const canon = canonicalOf(kind);
  return artifacts.some((a) => {
    if (a.status !== "attached") return false;
    if (a.kindId === kind.id) return true;
    const src = kinds.find((k) => k.id === a.kindId);
    return src ? canonicalOf(src) === canon : false;
  });
}

export function comparePhase0Artifacts(p: PortfolioSnapshot): Phase0ArtifactView {
  const kinds = kindsOf(p);
  const artifacts = artifactsOf(p);
  const required = kinds.filter((k) => k.required);
  const gaps = required.filter((k) => !coversKind(kinds, artifacts, k));
  const covered = required.length - gaps.length;
  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const stale = artifacts.filter((a) => new Date(a.updatedAt).getTime() < cutoff);
  return {
    kinds,
    artifacts,
    required: required.length,
    covered,
    percent: required.length ? Math.round((covered / required.length) * 100) : 0,
    gaps,
    stale,
  };
}

export function extractOrgControlIds(text: string, fallback: string[] = []): string[] {
  const fromScan = text.toUpperCase().match(/\b[A-Z]{2,4}-\d+(?:\([^)]+\))?\b/g) ?? [];
  return [...new Set([...fromScan, ...fallback])];
}

export function classifyOrgArtifact(
  kinds: OrgArtifactKind[],
  title: string,
  body: string,
): OrgArtifactKind | undefined {
  const hay = `${title} ${body}`.toLowerCase();
  let best: OrgArtifactKind | undefined;
  let score = 0;
  for (const k of kinds) {
    let s = 0;
    if (hay.includes(k.name.toLowerCase())) s += 4;
    for (const alias of k.aliases.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean)) {
      if (alias.length > 2 && hay.includes(alias)) s += 3;
    }
    if (hay.includes(k.id)) s += 2;
    if (s > score) {
      score = s;
      best = k;
    }
  }
  return score > 0 ? best : undefined;
}

export function draftOrgArtifact(kind: OrgArtifactKind): { title: string; body: string; controlIds: string } {
  return {
    title: `${kind.name} — draft`,
    body: `${kind.hint} NIST task ${kind.nistTask}. Mapped controls ${kind.controlIds.join(", ")}. This is a DRAFT generated by the Phase 0 engine. A human publishes. The engine does not issue an ATO.`,
    controlIds: kind.controlIds.join(", "),
  };
}

export interface Phase0AiResult {
  activity: Phase0AiId;
  summary: string;
  kindId?: string;
  controlIds?: string[];
  title?: string;
  body?: string;
  unofficial: true;
}

export function runPhase0Ai(
  p: PortfolioSnapshot,
  activity: Phase0AiId,
  input: { title?: string; body?: string; kindId?: string },
): Phase0AiResult {
  const view = comparePhase0Artifacts(p);
  if (activity === "baseline") {
    const bl = buildOrgRmfBaseline(p);
    return { activity, summary: bl.statement, controlIds: bl.controlIds, unofficial: true };
  }
  if (activity === "classify") {
    const kind = classifyOrgArtifact(view.kinds, input.title ?? "", input.body ?? "");
    return {
      activity,
      summary: kind
        ? `Classified as ${kind.name}${kind.agency !== "NIST" ? ` (${kind.agency} alias of ${kind.canonicalId})` : ""}. Unofficial.`
        : "No catalog match. Add an agency-specific requirement or pick a kind.",
      kindId: kind?.id,
      controlIds: kind?.controlIds,
      unofficial: true,
    };
  }
  if (activity === "extract") {
    const kind = view.kinds.find((k) => k.id === input.kindId);
    const ids = extractOrgControlIds(`${input.title ?? ""} ${input.body ?? ""}`, kind?.controlIds);
    return {
      activity,
      summary: ids.length ? `Extracted ${ids.join(", ")}. Unofficial.` : "No control IDs found in the text.",
      controlIds: ids,
      unofficial: true,
    };
  }
  if (activity === "gap") {
    const names = view.gaps.map((g) => g.name);
    return {
      activity,
      summary: names.length
        ? `Gaps ${view.gaps.length}/${view.required}: ${names.join("; ")}. Engine does not open a POA&M.`
        : `All ${view.required} required artifacts are attached.`,
      unofficial: true,
    };
  }
  if (activity === "draft") {
    const gap = view.gaps[0] ?? view.kinds.find((k) => k.id === input.kindId) ?? view.kinds[0];
    const draft = draftOrgArtifact(gap);
    return {
      activity,
      summary: `Drafted ${gap.name}. Human publishes — not official.`,
      kindId: gap.id,
      title: draft.title,
      body: draft.body,
      controlIds: gap.controlIds,
      unofficial: true,
    };
  }
  const titles = view.stale.map((a) => a.title);
  return {
    activity,
    summary: titles.length
      ? `Stale (${titles.length}): ${titles.join("; ")}. Review cycle is 12 months.`
      : "No attached artifact is older than 12 months.",
    unofficial: true,
  };
}

export const ORG_BASELINE_STAGES = [
  { id: "organization", label: "Organization" },
  { id: "policies", label: "Policies" },
  { id: "governance", label: "Governance" },
  { id: "risk", label: "Risk tolerance" },
  { id: "requirements", label: "Security requirements" },
  { id: "baseline", label: "Control baseline" },
  { id: "methodology", label: "Assessment methodology" },
] as const;

const CADENCE_WORDS: AssessmentCadence[] = [
  "continuous",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
];

export function cadenceMaxDays(cadence: AssessmentCadence): number {
  switch (cadence) {
    case "continuous":
      return 2;
    case "daily":
      return 2;
    case "weekly":
      return 8;
    case "monthly":
      return 35;
    case "quarterly":
      return 95;
    case "annual":
      return 400;
  }
}

function normalizeCadence(raw: string): AssessmentCadence | null {
  const t = raw.toLowerCase();
  if (t.startsWith("annual")) return "annual";
  return CADENCE_WORDS.find((c) => t.startsWith(c)) ?? null;
}

function parseCadenceMap(text: string): Record<string, AssessmentCadence> {
  const map: Record<string, AssessmentCadence> = {};
  const sentenceRe =
    /(continuous|daily|weekly|monthly|quarterly|annually|annual)[^.]*?(?:assessment|review|test|examine|monitoring|telemetry)[^.]*\./gi;
  let m: RegExpExecArray | null;
  while ((m = sentenceRe.exec(text))) {
    const cadence = normalizeCadence(m[1]);
    if (!cadence) continue;
    for (const id of extractOrgControlIds(m[0])) map[id] = cadence;
  }
  if (/telemetry is continuous/i.test(text)) {
    for (const id of ["SI-4", "AU-6", "AU-12", "CA-7", "IR-4"]) {
      if (!map[id]) map[id] = "continuous";
    }
  }
  return map;
}

function artifactByCanon(
  kinds: OrgArtifactKind[],
  artifacts: OrgArtifact[],
  canon: string,
): OrgArtifact | undefined {
  return artifacts.find((a) => {
    if (a.status !== "attached") return false;
    if (a.kindId === canon) return true;
    const k = kinds.find((x) => x.id === a.kindId);
    return k ? canonicalOf(k) === canon : false;
  });
}

export function buildOrgRmfBaseline(
  p: Pick<PortfolioSnapshot, "organizations" | "orgArtifacts" | "orgArtifactKinds" | "policies">,
): OrgRmfBaseline {
  const kinds = p.orgArtifactKinds?.length ? p.orgArtifactKinds : PHASE0_KIND_SEED;
  const artifacts = (p.orgArtifacts ?? []).filter((a) => a.status === "attached");
  const org = p.organizations.find((o) => o.kind === "organization") ?? p.organizations[0];
  const orgName = org?.acronym ?? org?.name ?? "Organization";
  const orgId = org?.id ?? "ORG-ROOT";
  const gov = p.organizations.find((o) => o.kind === "governance");
  const cms = artifactByCanon(kinds, artifacts, "cms");
  const rms = artifactByCanon(kinds, artifacts, "rms");
  const isp = artifactByCanon(kinds, artifacts, "isp");
  const ispp = artifactByCanon(kinds, artifacts, "ispp");
  const css = artifactByCanon(kinds, artifacts, "css");
  const ppp = artifactByCanon(kinds, artifacts, "ppp");
  const ea = artifactByCanon(kinds, artifacts, "ea");
  const sa = artifactByCanon(kinds, artifacts, "sa");
  const ora = artifactByCanon(kinds, artifacts, "ora");
  const corpus = [cms, rms, isp, ispp, css, ppp, ea, sa, ora, ...artifacts]
    .filter(Boolean)
    .map((a) => a!.body)
    .join("\n");

  const controlCadence = parseCadenceMap(corpus);
  const cadenceAssumed = !cms;
  const defaultCadence: AssessmentCadence = cadenceAssumed
    ? "annual"
    : (Object.values(controlCadence).find((c) => c !== "continuous") ?? "quarterly");

  const overlays: string[] = [];
  const blob = corpus.toLowerCase();
  if (/zero trust|\bzt\b/.test(blob)) overlays.push("Zero Trust");
  if (/privacy overlay|pia|sorn/.test(blob)) overlays.push("Privacy");
  if (/fedramp/.test(blob)) overlays.push("FedRAMP High customer-responsibility");
  if (/agency overlay|cdip|icam/.test(blob)) overlays.push("Agency ICAM");
  if (/mission overlay|tactical|coalition/.test(blob)) overlays.push("Mission");
  if (/cloud overlay|govcloud/.test(blob)) overlays.push("Cloud");

  const policyTitles = [
    ...artifacts
      .filter((a) => {
        const k = kinds.find((x) => x.id === a.kindId);
        return k ? ["isp", "ispp"].includes(canonicalOf(k)) : a.kindId === "isp";
      })
      .map((a) => a.title),
    ...(p.policies ?? []).filter((pol) => pol.status === "published").map((pol) => pol.title),
  ];

  const requirements: string[] = [];
  if (/phishing-resistant/.test(blob) || (p.policies ?? []).some((pol) => /phishing-resistant/.test(pol.body))) {
    requirements.push("Phishing-resistant authenticators for privileged access");
  }
  if (/residual risk is never agent-accepted/.test(blob)) {
    requirements.push("Residual risk is never agent-accepted");
  }
  if (/kev/.test(blob)) {
    requirements.push("CISA KEV timelines apply to flaw remediation");
  }
  if (/customer-responsibility/.test(blob)) {
    requirements.push("Customer-responsibility controls stay with the system owner");
  }
  if (/high-impact mission systems require/.test(blob)) {
    requirements.push("High-impact mission systems require AO-C or full ATO");
  }

  const kevMatch = corpus.match(/KEV SLO(?: is)? (\d+)\s*days/i);
  const kevSloDays = kevMatch ? Number(kevMatch[1]) : null;

  const controlIds = [
    ...new Set([
      ...artifacts.flatMap((a) => a.controlIds),
      ...Object.keys(controlCadence),
      ...(p.policies ?? []).flatMap((pol) => pol.controls),
    ]),
  ].sort();

  const riskTolerance =
    rms?.body ??
    "Risk tolerance is not on file. Do not assume residual risk may be accepted by the engine.";

  const independent = Object.entries(controlCadence)
    .filter(([, c]) => c !== "continuous")
    .map(([id]) => id);
  const continuous = Object.entries(controlCadence)
    .filter(([, c]) => c === "continuous")
    .map(([id]) => id);

  let statement: string;
  if (!cms) {
    statement = `${orgName} has no ConMon strategy on file. Do not assume a shared assessment schedule. Attach a Continuous Monitoring Strategy. Unofficial.`;
  } else if (independent.length) {
    statement = `${orgName} requires ${defaultCadence} assessment of ${independent.join(", ")}${
      continuous.length ? `. Telemetry is continuous for ${continuous.join(", ")}` : ""
    }${kevSloDays ? `. KEV SLO ${kevSloDays} days` : ""}. Residual risk is never agent-accepted. Unofficial until published.`;
  } else {
    statement = `${orgName} ConMon strategy is attached but does not name an independent-assessment cadence. Do not assume annual. Unofficial.`;
  }

  const stages = [
    {
      id: "organization",
      label: "Organization",
      detail: org ? `${org.name} (${org.acronym})` : "Organization not established.",
      source: org?.id ?? "",
    },
    {
      id: "policies",
      label: "Policies",
      detail: policyTitles.length ? policyTitles.join(" · ") : "No published org policy.",
      source: isp?.id ?? "",
    },
    {
      id: "governance",
      label: "Governance",
      detail: gov?.description || "Governance publishes policy; it does not issue ATOs.",
      source: gov?.id ?? "",
    },
    {
      id: "risk",
      label: "Risk tolerance",
      detail: riskTolerance,
      source: rms?.id ?? "",
    },
    {
      id: "requirements",
      label: "Security requirements",
      detail: requirements.length ? requirements.join(" · ") : "No org requirements extracted.",
      source: css?.id ?? isp?.id ?? "",
    },
    {
      id: "baseline",
      label: "Control baseline",
      detail: overlays.length
        ? `800-53B + ${overlays.join(" + ")} · ${controlIds.length} org-mapped controls`
        : `${controlIds.length} org-mapped controls. No overlay language extracted.`,
      source: ea?.id ?? sa?.id ?? "",
    },
    {
      id: "methodology",
      label: "Assessment methodology",
      detail: cadenceAssumed
        ? "Assumed annual — CMS missing. Do not treat as this organization's schedule."
        : `Independent ${defaultCadence}. Examine / interview / test. ${
            continuous.length ? "Telemetry continuous." : ""
          }`,
      source: cms?.id ?? "",
    },
  ];

  return {
    id: `ORB-${orgId}`,
    orgId,
    orgName,
    statement,
    riskTolerance,
    securityRequirements: requirements,
    overlays,
    controlIds,
    defaultCadence,
    cadenceAssumed,
    controlCadence,
    methods: ["examine", "interview", "test"],
    kevSloDays,
    stages,
    status: "unofficial",
    updatedAt: new Date().toISOString(),
  };
}

export function activeOrgBaseline(p: PortfolioSnapshot): OrgRmfBaseline {
  const saved = (p.orgRmfBaselines ?? []).slice().sort((a, b) => {
    if (a.status === "published" && b.status !== "published") return -1;
    if (b.status === "published" && a.status !== "published") return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  return saved[0] ?? buildOrgRmfBaseline(p);
}

export function formatOrgBaseline(bl: OrgRmfBaseline): string {
  return bl.statement;
}

export function cadenceChecks(
  p: PortfolioSnapshot,
  systemId: string,
  bl: OrgRmfBaseline,
): { controlId: string; cadence: AssessmentCadence; days: number | null; overdue: boolean }[] {
  const now = Date.now();
  return Object.entries(bl.controlCadence).map(([controlId, cadence]) => {
    const latest = p.evidence
      .filter((e) => e.systemId === systemId && e.controlId === controlId)
      .map((e) => new Date(e.collectedAt).getTime())
      .sort((a, b) => b - a)[0];
    const days = latest ? Math.floor((now - latest) / 86_400_000) : null;
    const overdue = days === null || days > cadenceMaxDays(cadence);
    return { controlId, cadence, days, overdue };
  });
}

