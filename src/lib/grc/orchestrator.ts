import { feedsFor } from "./collection";
import { CONNECTORS } from "./layer1";
import { compareSupportDocs, tailoredControls } from "./support-docs";
import type { PortfolioSnapshot, SystemRecord } from "./types";

export const DOC_SOURCES = [
  { id: "ssp", label: "SSP" },
  { id: "policies", label: "Policies" },
  { id: "procedures", label: "Procedures" },
  { id: "contracts", label: "Contracts" },
  { id: "diagrams", label: "Diagrams" },
  { id: "prior", label: "Prior assessments" },
] as const;

export const SYS_SOURCES = [
  { id: "cmdb", label: "CMDB" },
  { id: "cloud", label: "Cloud" },
  { id: "servers", label: "Servers" },
  { id: "network", label: "Network" },
  { id: "applications", label: "Applications" },
  { id: "databases", label: "Databases" },
] as const;

export const TEL_SOURCES = [
  { id: "siem", label: "SIEM" },
  { id: "edr", label: "EDR" },
  { id: "vuln", label: "Vuln scanners" },
  { id: "iam", label: "IAM" },
  { id: "cspm", label: "CSPM" },
  { id: "cicd", label: "CI/CD" },
] as const;

export const ORCH_STAGES = [
  { id: "normalize", label: "Evidence normalization", detail: "Map documents, inventory, and telemetry onto 800-53 control IDs." },
  { id: "graph", label: "Control knowledge graph", detail: "Assets, controls, findings, and POA&M as one graph." },
  { id: "assess53a", label: "800-53A assessment engine", detail: "Examine / interview / test against the tailored set." },
  { id: "analysis", label: "Multi-stage analysis", detail: "Coverage, other-than-satisfied, inheritance, residual risk." },
  { id: "recommend", label: "Assessment recommendation", detail: "Unofficial. SCA records. Engine does not close a POA&M." },
  { id: "human", label: "Human assessor", detail: "SCA may override a result. Required before an official SAR." },
  { id: "official", label: "Official result", detail: "Only the AO issues an ATO or accepts residual risk." },
] as const;

export type OrchStageId = (typeof ORCH_STAGES)[number]["id"];
export type RecVerdict = "not_ready" | "other_than_satisfied" | "ready_for_sca";

export interface PlaneSource {
  id: string;
  label: string;
  count: number;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: "system" | "asset" | "control" | "vuln" | "finding" | "poam";
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface OrchestratorView {
  document: PlaneSource[];
  system: PlaneSource[];
  telemetry: PlaneSource[];
  documentTotal: number;
  systemTotal: number;
  telemetryTotal: number;
  normalizedControls: number;
  tailored: number;
  coveragePercent: number;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  examine: number;
  interview: number;
  test: number;
  otherCount: number;
  inherited: number;
  hybrid: number;
  systemSpecific: number;
  openPoams: number;
  highPoams: number;
  recommendation: {
    verdict: RecVerdict;
    headline: string;
    summary: string;
    confidence: number;
  };
  humanPending: boolean;
  officialStatus: string;
}

function assetBucket(kind: string): (typeof SYS_SOURCES)[number]["id"] {
  const k = kind.toLowerCase();
  if (/database|aurora|object storage/.test(k)) return "databases";
  if (/kubernetes|k8s|object storage|saas/.test(k)) return "cloud";
  if (/windows|linux|server|jump|bastion|broker/.test(k)) return "servers";
  if (/api|gateway|network/.test(k)) return "network";
  if (/idp|pim/.test(k)) return "applications";
  return "cmdb";
}

function telemetryBucket(id: string, family: string): (typeof TEL_SOURCES)[number]["id"] | null {
  if (id === "oscal" || id === "servicenow" || id === "jira") return null;
  if (id === "splunk" || id === "sentinel") return "siem";
  if (id === "crowdstrike" || id === "defender") return "edr";
  if (id === "tenable" || id === "qualys") return "vuln";
  if (family === "identity") return "iam";
  if (id === "wiz" || id === "prisma") return "cspm";
  if (family === "devsecops") return "cicd";
  if (family === "cloud") return "cspm";
  if (family === "security") return "siem";
  return "cspm";
}

function counts(ids: readonly { id: string; label: string }[], bag: Record<string, number>): PlaneSource[] {
  return ids.map((s) => ({ id: s.id, label: s.label, count: bag[s.id] ?? 0 }));
}

function layout(nodes: Omit<GraphNode, "x" | "y">[]): GraphNode[] {
  const layers: GraphNode["kind"][][] = [
    ["system"],
    ["asset"],
    ["control"],
    ["vuln", "finding"],
    ["poam"],
  ];
  const ys = [36, 110, 190, 280, 360];
  const width = 640;
  const placed: GraphNode[] = [];
  layers.forEach((kinds, li) => {
    const row = nodes.filter((n) => kinds.includes(n.kind));
    const gap = width / (row.length + 1);
    row.forEach((n, i) => {
      placed.push({ ...n, x: Math.round(gap * (i + 1)), y: ys[li] ?? 200 });
    });
  });
  return placed;
}

function recommend(input: {
  system: SystemRecord;
  coverage: number;
  tailored: number;
  otherCount: number;
  highPoams: number;
  openPoams: number;
  docsPercent: number;
}): OrchestratorView["recommendation"] {
  if (input.tailored === 0) {
    return {
      verdict: "not_ready",
      headline: "No tailored control set",
      summary: "Select a baseline before the 800-53A engine can compare evidence. Engine does not authorize.",
      confidence: 40,
    };
  }
  if (input.coverage < 40 || input.docsPercent < 20) {
    return {
      verdict: "not_ready",
      headline: "Insufficient evidence for an official SAR",
      summary: `Coverage ${input.coverage}% of ${input.tailored} tailored controls. Attach supporting documents and collect telemetry, then re-run. SCA should not record a complete SAR. Engine does not authorize.`,
      confidence: 62,
    };
  }
  if (input.otherCount > 0 || input.highPoams > 0) {
    return {
      verdict: "other_than_satisfied",
      headline: "Record other-than-satisfied; stage residual risk",
      summary: `${input.otherCount} other-than-satisfied objective(s) · ${input.highPoams} high/critical POA&M · ${input.openPoams} open POA&M. SCA records the SAR. AO is the only official result. Engine does not close a POA&M or accept residual risk.`,
      confidence: 84,
    };
  }
  return {
    verdict: "ready_for_sca",
    headline: "Assessed set is ready for SCA record",
    summary: `Coverage ${input.coverage}% of the tailored set. Recommendation is unofficial. SCA records the result; AO issues or withholds the ATO. Engine does not authorize.`,
    confidence: 78,
  };
}

export function buildOrchestratorView(p: PortfolioSnapshot, systemId: string): OrchestratorView | null {
  const system = p.systems.find((s) => s.id === systemId);
  if (!system) return null;

  const docs = (p.supportDocuments ?? []).filter((d) => d.systemId === systemId);
  const ssp = p.sspSections.filter((s) => s.systemId === systemId);
  const policies = p.policies ?? [];
  const assessments = p.assessments.filter((a) => a.systemId === systemId);
  const links = p.interconnections.filter((i) => i.systemId === systemId);
  const docBag: Record<string, number> = {
    ssp: ssp.length + docs.filter((d) => d.kind === "ssp").length,
    policies: policies.length + docs.filter((d) => d.kind === "policy").length,
    procedures: docs.filter((d) => d.kind === "procedure").length,
    contracts: links.length,
    diagrams: docs.filter((d) => d.kind === "architecture").length,
    prior: assessments.length + docs.filter((d) => d.kind === "sar" || d.kind === "sap").length,
  };

  const assets = p.assets.filter((a) => a.systemId === systemId);
  const sysBag: Record<string, number> = { cmdb: 0, cloud: 0, servers: 0, network: 0, applications: 0, databases: 0 };
  for (const a of assets) sysBag[assetBucket(a.kind)] += 1;
  sysBag.cmdb += assets.length ? 1 : 0;
  const snow = (p.connectorBindings ?? []).filter((b) => b.systemId === systemId && b.connectorId === "servicenow" && b.status === "enabled");
  if (snow.length) sysBag.cmdb += 1;

  const bindings = (p.connectorBindings ?? []).filter((b) => b.systemId === systemId && b.status === "enabled");
  const feedIds = bindings.length ? bindings.map((b) => b.connectorId) : feedsFor(systemId).map((c) => c.id);
  const telBag: Record<string, number> = { siem: 0, edr: 0, vuln: 0, iam: 0, cspm: 0, cicd: 0 };
  for (const id of feedIds) {
    const def = CONNECTORS.find((c) => c.id === id);
    if (!def) continue;
    const bucket = telemetryBucket(def.id, def.family);
    if (bucket) telBag[bucket] += 1;
  }

  const evidence = p.evidence.filter((e) => e.systemId === systemId);
  const tailored = tailoredControls(p, systemId);
  const tailoredIds = new Set(tailored.map((i) => i.controlId));
  const mapped = new Set(evidence.map((e) => e.controlId).filter((id) => tailoredIds.has(id)));
  for (const d of docs) for (const id of d.controlIds) if (tailoredIds.has(id)) mapped.add(id);
  const coveragePercent = tailoredIds.size ? Math.round((mapped.size / tailoredIds.size) * 100) : 0;

  const tests = p.testResults.filter((t) => t.systemId === systemId);
  const interviews = (p.interviews ?? []).filter((i) => i.systemId === systemId);
  const examine = tests.filter((t) => t.method === "examine").length + docs.length;
  const interview = tests.filter((t) => t.method === "interview").length + interviews.length;
  const test = tests.filter((t) => t.method === "test").length;
  const otherCount = tests.filter((t) => t.result === "other").length + p.findings.filter((f) => f.systemId === systemId && f.status === "open").length;

  const inherited = tailored.filter((i) => i.status === "inherited").length;
  const systemSpecific = tailored.filter((i) => i.status === "implemented").length;
  const hybrid = Math.max(0, tailored.length - inherited - systemSpecific - tailored.filter((i) => i.status === "planned" || i.status === "partial" || i.status === "not_implemented").length);
  const planned = tailored.filter((i) => i.status === "planned" || i.status === "partial" || i.status === "not_implemented").length;

  const poams = p.poams.filter((x) => x.systemId === systemId && x.status !== "completed");
  const highPoams = poams.filter((x) => x.riskLevel === "high" || x.riskLevel === "critical").length;
  const docsCmp = compareSupportDocs(p, systemId);

  const rawNodes: Omit<GraphNode, "x" | "y">[] = [{ id: system.id, label: system.acronym, kind: "system" }];
  for (const a of assets.slice(0, 6)) rawNodes.push({ id: a.id, label: a.name, kind: "asset" });
  const hotControls = [...mapped].slice(0, 8);
  for (const id of hotControls) rawNodes.push({ id: `CTL-${id}`, label: id, kind: "control" });
  const vulns = p.vulnerabilities.filter((v) => v.systemId === systemId).slice(0, 4);
  for (const v of vulns) rawNodes.push({ id: v.id, label: v.cve, kind: "vuln" });
  const findings = p.findings.filter((f) => f.systemId === systemId && f.status === "open").slice(0, 4);
  for (const f of findings) rawNodes.push({ id: f.id, label: f.controlId, kind: "finding" });
  for (const po of poams.slice(0, 4)) rawNodes.push({ id: po.id, label: po.controlId, kind: "poam" });
  const graphNodes = layout(rawNodes);
  const present = new Set(graphNodes.map((n) => n.id));
  const graphEdges: GraphEdge[] = [];
  for (const a of assets.slice(0, 6)) if (present.has(a.id)) graphEdges.push({ from: a.id, to: system.id });
  for (const v of vulns) {
    if (present.has(v.id) && present.has(v.assetId)) graphEdges.push({ from: v.id, to: v.assetId });
    for (const cid of v.controlIds) {
      const nid = `CTL-${cid}`;
      if (present.has(v.id) && present.has(nid)) graphEdges.push({ from: v.id, to: nid });
    }
  }
  for (const f of findings) {
    const nid = `CTL-${f.controlId}`;
    if (present.has(f.id) && present.has(nid)) graphEdges.push({ from: f.id, to: nid });
  }
  for (const po of poams.slice(0, 4)) {
    const nid = `CTL-${po.controlId}`;
    if (present.has(po.id) && present.has(nid)) graphEdges.push({ from: po.id, to: nid });
  }

  const recommendation = recommend({
    system,
    coverage: coveragePercent,
    tailored: tailoredIds.size,
    otherCount,
    highPoams,
    openPoams: poams.length,
    docsPercent: docsCmp.percent,
  });

  const humanPending =
    system.atoStatus === "in_assessment" ||
    system.atoStatus === "not_authorized" ||
    system.atoStatus === "expired";

  return {
    document: counts(DOC_SOURCES, docBag),
    system: counts(SYS_SOURCES, sysBag),
    telemetry: counts(TEL_SOURCES, telBag),
    documentTotal: Object.values(docBag).reduce((s, n) => s + n, 0),
    systemTotal: assets.length,
    telemetryTotal: Object.values(telBag).reduce((s, n) => s + n, 0),
    normalizedControls: mapped.size,
    tailored: tailoredIds.size,
    coveragePercent,
    graphNodes,
    graphEdges,
    examine,
    interview,
    test,
    otherCount,
    inherited,
    hybrid: hybrid + planned,
    systemSpecific,
    openPoams: poams.length,
    highPoams,
    recommendation,
    humanPending,
    officialStatus: system.atoStatus,
  };
}

export function highlightPlanes(runningStep: string | null): Array<"document" | "system" | "telemetry" | "pipeline"> {
  if (!runningStep) return [];
  if (runningStep === "assess") return ["document", "system", "telemetry", "pipeline"];
  if (runningStep === "monitor") return ["telemetry", "pipeline"];
  if (runningStep === "prepare" || runningStep === "implement") return ["system"];
  return ["document"];
}

export function formatOrchSummary(view: OrchestratorView): string {
  return `Orchestrator: ${view.recommendation.verdict} · docs ${view.documentTotal} · inventory ${view.systemTotal} · feeds ${view.telemetryTotal} · ${view.normalizedControls}/${view.tailored} tailored mapped (${view.coveragePercent}%). ${view.recommendation.headline}`;
}
