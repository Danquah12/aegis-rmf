import { NIST_CATALOG, familyOf } from "./catalog";
import { AGENTS } from "./mappings";
import { implementationScore } from "./scoring";
import type { PortfolioSnapshot, RmfStep } from "./types";

export const RMF_STEPS: RmfStep[] = [
  "prepare",
  "categorize",
  "select",
  "implement",
  "assess",
  "authorize",
  "monitor",
];

export function isRmfStep(value: unknown): value is RmfStep {
  return typeof value === "string" && (RMF_STEPS as string[]).includes(value);
}

export interface RmfStepMeta {
  id: RmfStep;
  index: number;
  name: string;
  short: string;
  purpose: string;
  tasks: string;
  outputs: string[];
  roles: string;
}

export const RMF_STEP_META: Record<RmfStep, RmfStepMeta> = {
  prepare: {
    id: "prepare",
    index: 0,
    name: "Prepare",
    short: "Context",
    purpose:
      "Carry out essential activities at the organization, mission, and system levels to manage security and privacy risk.",
    tasks: "SP 800-37 Rev. 2 Tasks P-1 through P-18",
    outputs: [
      "Risk management strategy",
      "Authorization boundary",
      "Stakeholder register",
      "System inventory",
    ],
    roles: "Head of agency, risk executive, CIO, CISO, system owner",
  },
  categorize: {
    id: "categorize",
    index: 1,
    name: "Categorize",
    short: "FIPS 199",
    purpose:
      "Categorize the system and the information processed, stored, and transmitted based on an impact analysis.",
    tasks: "SP 800-37 Rev. 2 Tasks C-1 through C-3 · FIPS 199 · SP 800-60",
    outputs: ["Security categorization", "Impact level", "Information types"],
    roles: "System owner, ISSO, privacy officer, authorizing official",
  },
  select: {
    id: "select",
    index: 2,
    name: "Select",
    short: "Baseline",
    purpose:
      "Select, tailor, and allocate the controls necessary to protect the system and its environment of operation.",
    tasks: "SP 800-37 Rev. 2 Tasks S-1 through S-5 · SP 800-53B",
    outputs: ["Control baseline", "Overlays and tailoring", "SSP control selection"],
    roles: "ISSO, system owner, security architect",
  },
  implement: {
    id: "implement",
    index: 3,
    name: "Implement",
    short: "Build",
    purpose:
      "Implement the controls and describe how they are employed within the system and its environment of operation.",
    tasks: "SP 800-37 Rev. 2 Tasks I-1 through I-2",
    outputs: ["Implemented controls", "SSP implementation statements", "As-built architecture"],
    roles: "System owner, ISSO, engineers, common-control providers",
  },
  assess: {
    id: "assess",
    index: 4,
    name: "Assess",
    short: "800-53A",
    purpose:
      "Determine if the controls are implemented correctly, operating as intended, and producing the desired outcome.",
    tasks: "SP 800-37 Rev. 2 Tasks A-1 through A-6 · SP 800-53A",
    outputs: ["Security assessment plan", "Assessment report", "Findings"],
    roles: "Independent assessor, ISSO, evidence owners",
  },
  authorize: {
    id: "authorize",
    index: 5,
    name: "Authorize",
    short: "ATO",
    purpose:
      "Provide accountability by requiring a senior official to determine if the residual risk is acceptable.",
    tasks: "SP 800-37 Rev. 2 Tasks R-1 through R-5",
    outputs: ["Risk determination", "POA&M", "Authorization decision"],
    roles: "Authorizing official, AO designated representative, ISSO",
  },
  monitor: {
    id: "monitor",
    index: 6,
    name: "Monitor",
    short: "ConMon",
    purpose:
      "Maintain ongoing awareness of the security and privacy posture and residual risk — the cycle never stops.",
    tasks: "SP 800-37 Rev. 2 Tasks M-1 through M-7 · CA-7",
    outputs: [
      "Continuous monitoring strategy",
      "Updated control status",
      "Ongoing authorization",
    ],
    roles: "ISSO, SOC, vuln management, authorizing official",
  },
};

export type CycleKind =
  | "system"
  | "control"
  | "implementation"
  | "evidence"
  | "finding"
  | "poam"
  | "assessment"
  | "vulnerability"
  | "asset"
  | "agent"
  | "agent-run";

export const CYCLE_KINDS: CycleKind[] = [
  "system",
  "control",
  "implementation",
  "asset",
  "evidence",
  "finding",
  "poam",
  "assessment",
  "vulnerability",
  "agent",
  "agent-run",
];

export const CYCLE_KIND_META: Record<CycleKind, { label: string; plural: string }> = {
  system: { label: "System", plural: "Systems" },
  control: { label: "Control", plural: "Controls" },
  implementation: { label: "Implementation gap", plural: "Implementation gaps" },
  evidence: { label: "Evidence", plural: "Evidence" },
  finding: { label: "Finding", plural: "Findings" },
  poam: { label: "POA&M", plural: "POA&M" },
  assessment: { label: "Assessment", plural: "Assessments" },
  vulnerability: { label: "Vulnerability", plural: "Vulnerabilities" },
  asset: { label: "Asset", plural: "Assets" },
  agent: { label: "Agent", plural: "Agents" },
  "agent-run": { label: "Agent run", plural: "Agent runs" },
};

const CONTROL_OVERRIDES: Record<string, RmfStep> = {
  "RA-2": "categorize",
  "RA-5": "monitor",
  "RA-5(2)": "monitor",
  "RA-3": "prepare",
  "RA-7": "authorize",
  "RA-9": "prepare",
  "PL-2": "select",
  "PL-8": "implement",
  "PM-4": "authorize",
  "PM-9": "prepare",
  "PM-10": "authorize",
  "CA-2": "assess",
  "CA-3": "implement",
  "CA-5": "authorize",
  "CA-6": "authorize",
  "CA-7": "monitor",
  "CA-8": "assess",
  "CM-8": "prepare",
  "AU-6": "monitor",
  "SI-2": "monitor",
  "SI-4": "monitor",
  "SI-5": "monitor",
  "PE-6": "monitor",
  "IR-4": "monitor",
  "IR-5": "monitor",
  "IR-6": "monitor",
  "SR-2": "prepare",
};

const FAMILY_DEFAULT: Partial<Record<string, RmfStep>> = {
  PM: "prepare",
  PS: "prepare",
  AT: "prepare",
  PL: "prepare",
  RA: "prepare",
  SA: "select",
  CA: "assess",
  IR: "monitor",
  PT: "implement",
  SR: "implement",
};

const AGENT_STEP: Record<string, RmfStep> = {
  "rmf-orchestrator": "prepare",
  categorize: "categorize",
  ssp: "select",
  assessment: "assess",
  evidence: "assess",
  poam: "authorize",
  audit: "authorize",
  vuln: "monitor",
  monitor: "monitor",
  siem: "monitor",
  cloud: "implement",
  config: "implement",
  twin: "monitor",
  "attack-path": "monitor",
  whatif: "monitor",
  "assessor-copilot": "assess",
  interview: "assess",
  policy: "prepare",
  regulatory: "select",
  cato: "monitor",
  k8s: "implement",
  supply: "monitor",
  zt: "select",
  devsecops: "implement",
};

export function rmfStepForControl(controlId: string): RmfStep {
  if (CONTROL_OVERRIDES[controlId]) return CONTROL_OVERRIDES[controlId];
  const base = controlId.replace(/\([^)]+\)$/, "");
  if (CONTROL_OVERRIDES[base]) return CONTROL_OVERRIDES[base];
  if (/^[A-Z]{2}-1$/.test(base)) return "prepare";
  const family = familyOf(controlId);
  return FAMILY_DEFAULT[family] ?? "implement";
}

export function rmfStepForAgent(agentId: string): RmfStep {
  return AGENT_STEP[agentId] ?? "prepare";
}

export function rmfStepForAssessment(kind: string): RmfStep {
  const k = kind.toLowerCase();
  if (/conmon|continuous|monitor/.test(k)) return "monitor";
  if (/categoriz/.test(k)) return "categorize";
  if (/fedramp|inherited|authorization package/.test(k)) return "authorize";
  if (/initial authorization/.test(k)) return "assess";
  return "assess";
}

export function rmfStepForPoam(controlId: string, status: string): RmfStep {
  if (status === "risk_accepted") return "authorize";
  return rmfStepForControl(controlId);
}

export function rmfStepForImplementation(controlId: string, status: string): RmfStep {
  if (status === "not_applicable") return "select";
  if (status === "planned") return "implement";
  return rmfStepForControl(controlId);
}

export interface CycleItem {
  id: string;
  kind: CycleKind;
  step: RmfStep;
  title: string;
  subtitle: string;
  status: string;
  systemId?: string;
  controlId?: string;
}

export interface CycleBoard {
  items: CycleItem[];
  byStep: Record<RmfStep, CycleItem[]>;
  counts: Record<RmfStep, number>;
  kindCounts: Record<RmfStep, Partial<Record<CycleKind, number>>>;
  health: Record<RmfStep, number>;
  work: Record<RmfStep, number>;
  systemsInStep: Record<RmfStep, { id: string; acronym: string }[]>;
}

function emptyStepMap<T>(factory: () => T): Record<RmfStep, T> {
  return {
    prepare: factory(),
    categorize: factory(),
    select: factory(),
    implement: factory(),
    assess: factory(),
    authorize: factory(),
    monitor: factory(),
  };
}

export function categorizePortfolio(p: PortfolioSnapshot): CycleBoard {
  const items: CycleItem[] = [];

  for (const s of p.systems) {
    items.push({
      id: s.id,
      kind: "system",
      step: s.rmfStep,
      title: s.acronym,
      subtitle: `${s.name} · ${s.atoStatus.replaceAll("_", " ")}`,
      status: s.rmfStep,
      systemId: s.id,
    });
  }

  for (const c of NIST_CATALOG) {
    items.push({
      id: c.id,
      kind: "control",
      step: rmfStepForControl(c.id),
      title: `${c.id}  ${c.title}`,
      subtitle: c.statement,
      status: c.family,
      controlId: c.id,
    });
  }

  for (const i of p.implementations) {
    const isGap =
      i.status === "partial" ||
      i.status === "planned" ||
      i.status === "not_implemented" ||
      i.result === "other";
    if (!isGap) continue;
    const sys = p.systems.find((s) => s.id === i.systemId);
    items.push({
      id: i.id,
      kind: "implementation",
      step: rmfStepForImplementation(i.controlId, i.status),
      title: `${i.controlId} · ${sys?.acronym ?? i.systemId}`,
      subtitle: i.statement,
      status: i.status,
      systemId: i.systemId,
      controlId: i.controlId,
    });
  }

  for (const a of p.assets) {
    const sys = p.systems.find((s) => s.id === a.systemId);
    items.push({
      id: a.id,
      kind: "asset",
      step: "prepare",
      title: a.name,
      subtitle: `${sys?.acronym ?? a.systemId} · ${a.kind} · ${a.environment}`,
      status: a.criticality,
      systemId: a.systemId,
    });
  }

  for (const e of p.evidence) {
    const sys = p.systems.find((s) => s.id === e.systemId);
    items.push({
      id: e.id,
      kind: "evidence",
      step: rmfStepForControl(e.controlId),
      title: e.title,
      subtitle: `${sys?.acronym ?? e.systemId} · ${e.source} · ${e.controlId}`,
      status: e.method,
      systemId: e.systemId,
      controlId: e.controlId,
    });
  }

  for (const f of p.findings) {
    const sys = p.systems.find((s) => s.id === f.systemId);
    items.push({
      id: f.id,
      kind: "finding",
      step: rmfStepForControl(f.controlId),
      title: f.title,
      subtitle: `${sys?.acronym ?? f.systemId} · ${f.controlId} · ${f.impact}`,
      status: f.status === "open" ? f.severity : f.status,
      systemId: f.systemId,
      controlId: f.controlId,
    });
  }

  for (const x of p.poams) {
    const sys = p.systems.find((s) => s.id === x.systemId);
    items.push({
      id: x.id,
      kind: "poam",
      step: rmfStepForPoam(x.controlId, x.status),
      title: x.id,
      subtitle: `${sys?.acronym ?? x.systemId} · ${x.controlId} · ${x.weakness}`,
      status: x.status,
      systemId: x.systemId,
      controlId: x.controlId,
    });
  }

  for (const a of p.assessments) {
    const sys = p.systems.find((s) => s.id === a.systemId);
    items.push({
      id: a.id,
      kind: "assessment",
      step: rmfStepForAssessment(a.kind),
      title: a.kind,
      subtitle: `${sys?.acronym ?? a.systemId} · ${a.assessor}`,
      status: a.status,
      systemId: a.systemId,
    });
  }

  for (const v of p.vulnerabilities) {
    const sys = p.systems.find((s) => s.id === v.systemId);
    items.push({
      id: v.id,
      kind: "vulnerability",
      step: "monitor",
      title: `${v.cve}  ${v.title}`,
      subtitle: `${sys?.acronym ?? v.systemId} · CVSS ${v.cvss}${v.kev ? " · KEV" : ""}`,
      status: v.status === "open" ? v.severity : v.status,
      systemId: v.systemId,
    });
  }

  for (const agent of AGENTS) {
    items.push({
      id: `agent-${agent.id}`,
      kind: "agent",
      step: rmfStepForAgent(agent.id),
      title: agent.name,
      subtitle: agent.summary,
      status: agent.lane,
    });
  }

  for (const r of p.agentRuns) {
    items.push({
      id: r.id,
      kind: "agent-run",
      step: rmfStepForAgent(r.agent),
      title: `${r.agent} · ${r.objective}`,
      subtitle: r.decision,
      status: r.status,
      systemId: r.systemId ?? undefined,
    });
  }

  const byStep = emptyStepMap<CycleItem[]>(() => []);
  const kindCounts = emptyStepMap<Partial<Record<CycleKind, number>>>(() => ({}));
  for (const item of items) {
    byStep[item.step].push(item);
    kindCounts[item.step][item.kind] = (kindCounts[item.step][item.kind] ?? 0) + 1;
  }

  const counts = emptyStepMap(() => 0);
  const work = emptyStepMap(() => 0);
  for (const step of RMF_STEPS) {
    counts[step] = byStep[step].length;
    work[step] = byStep[step].filter((item) => isWorkItem(item)).length;
  }

  const health = stepHealth(p);
  const systemsInStep = emptyStepMap<{ id: string; acronym: string }[]>(() => []);
  for (const s of p.systems) {
    systemsInStep[s.rmfStep].push({ id: s.id, acronym: s.acronym });
  }

  return { items, byStep, counts, kindCounts, health, work, systemsInStep };
}

function isWorkItem(item: CycleItem): boolean {
  if (item.kind === "control" || item.kind === "agent" || item.kind === "asset") {
    return false;
  }
  if (item.kind === "system") return true;
  const closed = new Set([
    "completed",
    "closed",
    "satisfied",
    "authorized",
    "mitigated",
    "accepted",
  ]);
  if (closed.has(item.status)) return false;
  return (
    item.kind === "implementation" ||
    item.kind === "finding" ||
    item.kind === "poam" ||
    item.kind === "vulnerability" ||
    item.kind === "assessment" ||
    item.kind === "agent-run"
  );
}

function stepHealth(p: PortfolioSnapshot): Record<RmfStep, number> {
  const health = emptyStepMap(() => 0);
  for (const step of RMF_STEPS) {
    const impls = p.implementations.filter(
      (i) =>
        i.status !== "not_applicable" &&
        rmfStepForImplementation(i.controlId, i.status) === step,
    );
    const implScore =
      impls.length === 0
        ? 80
        : (impls.reduce((s, i) => s + implementationScore(i.status), 0) / impls.length) *
          100;
    const openPoams = p.poams.filter(
      (x) => x.status !== "completed" && rmfStepForPoam(x.controlId, x.status) === step,
    );
    const openHigh = openPoams.filter(
      (x) => x.riskLevel === "high" || x.riskLevel === "critical",
    );
    const openFindings = p.findings.filter(
      (f) => f.status === "open" && rmfStepForControl(f.controlId) === step,
    );
    const penalty = openHigh.length * 12 + openFindings.length * 6 + openPoams.length * 3;
    health[step] = Math.max(0, Math.min(100, Math.round(implScore - penalty)));
  }
  return health;
}
