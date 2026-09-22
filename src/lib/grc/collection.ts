import { CONNECTORS, type ConnectorDef } from "./layer1";
import { observationsFor } from "./assessment-ingest";
import { axiomControlHits, axiomResult, axiomSeverity, controlsForCwe, type AxiomFinding } from "./axiom";
import { controlHits, suiteResult, suiteSeverity, type SuiteFinding } from "./axiom-suite";
import type {
  AssessmentMethod,
  AssessmentResult,
  AssetRecord,
  ConfigChangeRecord,
  ConnectorBinding,
  EvidenceRecord,
  TestResultRecord,
  TicketRecord,
  VulnerabilityRecord,
} from "./types";

export interface MappingHit {
  controlId: string;
  objective: string;
  method: AssessmentMethod;
  result: AssessmentResult;
  sourceRef: string;
}

export const DEFAULT_FEEDS: Record<string, string[]> = {
  "SYS-AETHER": ["aws", "entra", "tenable", "crowdstrike", "servicenow", "terraform", "oscal", "axiom", "axiom-sca", "axiom-iac"],
  "SYS-ARGUS": ["azure", "entra", "tenable", "servicenow", "oscal", "axiom", "axiom-sca", "axiom-iac"],
  "SYS-HELIOS": ["aws", "tenable", "terraform", "servicenow", "oscal", "acas", "stig", "nmap", "etec", "network-scan", "app-scan", "axiom", "axiom-sca", "axiom-iac"],
  "SYS-VANGUARD": ["crowdstrike", "sentinel", "entra", "oscal", "axiom", "axiom-sca", "axiom-iac"],
};

export function feedsFor(systemId: string): ConnectorDef[] {
  const ids = DEFAULT_FEEDS[systemId] ?? ["aws", "tenable"];
  return ids.map((id) => CONNECTORS.find((c) => c.id === id)).filter((c): c is ConnectorDef => Boolean(c));
}

export function connectorByRef(ref: string): ConnectorDef | undefined {
  const needle = ref.trim().toLowerCase();
  return CONNECTORS.find((c) => c.id === needle || c.name.toLowerCase() === needle);
}

export function cadenceHours(cadence: string): number {
  if (/continuous|hourly/i.test(cadence)) return 1;
  if (/12/.test(cadence)) return 12;
  if (/commit|apply|change/i.test(cadence)) return 24;
  return 24;
}

export function nextRunAt(cadence: string, from = new Date()): string {
  const t = new Date(from.getTime() + cadenceHours(cadence) * 3_600_000);
  return t.toISOString();
}

export function bindingHealth(b: ConnectorBinding, asOf = new Date()): "healthy" | "due" | "stale" | "disabled" {
  if (b.status === "disabled") return "disabled";
  if (!b.lastRun) return "due";
  if (b.nextRun && new Date(b.nextRun).getTime() < asOf.getTime()) return "stale";
  return "healthy";
}

export function seedBindings(): ConnectorBinding[] {
  return Object.entries(DEFAULT_FEEDS).flatMap(([systemId, ids]) =>
    ids.map((connectorId) => ({
      id: `BND-${systemId}-${connectorId}`,
      systemId,
      connectorId,
      status: "enabled" as const,
      runCount: 0,
      lastRun: null,
      nextRun: null,
      lastSummary: "Never collected.",
    })),
  );
}

export interface CollectionPlan {
  evidence: EvidenceRecord[];
  tests: TestResultRecord[];
  changes: ConfigChangeRecord[];
  vulns: VulnerabilityRecord[];
  tickets: TicketRecord[];
  assets: AssetRecord[];
  implControls: string[];
  mappings: MappingHit[];
  summary: string;
}

function evd(
  jobId: string,
  i: number,
  systemId: string,
  controlId: string,
  source: string,
  title: string,
  summary: string,
  now: string,
  hoursValid: number,
): EvidenceRecord {
  const exp = new Date(new Date(now).getTime() + hoursValid * 3_600_000).toISOString();
  const id = `${jobId}-E${i}`;
  return {
    id,
    systemId,
    controlId,
    title,
    source,
    method: "automated",
    collectedAt: now,
    hash: `sha256:${id.slice(-10)}`,
    classification: "CUI",
    expiresAt: exp,
    summary,
  };
}

function test(
  systemId: string,
  controlId: string,
  method: AssessmentMethod,
  result: AssessmentResult,
  comments: string,
): TestResultRecord {
  return {
    id: `TST-LIVE-${systemId}-${controlId}-${method}`,
    systemId,
    controlId,
    method,
    objective: `${controlId}.${method[0]}`,
    result,
    comments,
    automated: true,
  };
}

function hit(
  controlId: string,
  method: AssessmentMethod,
  result: AssessmentResult,
  sourceRef: string,
): MappingHit {
  return {
    controlId,
    objective: `${controlId}.${method[0]}`,
    method,
    result,
    sourceRef,
  };
}

export function planCollection(input: {
  systemId: string;
  connectorId: string;
  generation: number;
  now: string;
  jobId: string;
}): CollectionPlan {
  const def = CONNECTORS.find((c) => c.id === input.connectorId);
  if (!def) {
    return { evidence: [], tests: [], changes: [], vulns: [], tickets: [], assets: [], implControls: [], mappings: [], summary: "Unknown connector." };
  }
  if (input.systemId === "SYS-AETHER") {
    switch (input.connectorId) {
      case "aws":
        return planAwsAether(input, def);
      case "entra":
        return planEntraAether(input, def);
      case "tenable":
        return planTenableAether(input, def);
      case "crowdstrike":
        return planCrowdAether(input, def);
      case "servicenow":
        return planSnowAether(input, def);
      case "terraform":
        return planTfAether(input, def);
      case "oscal":
        return planOscal(input, def);
    }
  }
  if (input.connectorId === "oscal") return planOscal(input, def);
  if (input.connectorId === "acas") return planAcas(input, def);
  if (input.connectorId === "stig") return planStig(input, def);
  if (input.connectorId === "nmap") return planNmap(input, def);
  if (input.connectorId === "etec") return planEtec(input, def);
  if (input.connectorId === "network-scan") return planNetworkScan(input, def);
  if (input.connectorId === "app-scan") return planAppScan(input, def);
  if (input.connectorId === "axiom") return planAxiom(input, def, [], false, "pending live pull");
  if (input.connectorId === "axiom-sca") return planSuite(input, def, [], false, "pending live pull", "AXIOM SCA");
  if (input.connectorId === "axiom-iac") return planSuite(input, def, [], false, "pending live pull", "AXIOM IaC");
  return planGeneric(input, def);
}

function planAwsAether(input: { systemId: string; generation: number; now: string; jobId: string }, def: ConnectorDef): CollectionPlan {
  const g = input.generation;
  const evidence = [
    evd(input.jobId, 1, input.systemId, "CM-6", def.name, "AWS Config — STIG / CIS overlay", "Nine undocumented STIG deviations on win-ops-12. EKS and Amazon Linux rules COMPLIANT.", input.now, 48),
    evd(input.jobId, 2, input.systemId, "SC-7", def.name, "AWS Config — security groups / TGW", "TGW and WAF rules present. Coalition CIDR 443 observed on API gateway SG.", input.now, 48),
    evd(input.jobId, 3, input.systemId, "AC-3", def.name, "IAM resource policies", "Aurora and S3 bucket policies deny non-VPC paths. Bastion SSM-only.", input.now, 48),
    evd(input.jobId, 4, input.systemId, "AU-12", def.name, "CloudTrail + EKS audit", "Org trail active. EKS audit logs to Sentinel. Privileged API correlation still thin.", input.now, 48),
    evd(input.jobId, 5, input.systemId, "CM-2", def.name, "AMI / baseline inventory", "EKS node AMI rotated this cycle. Windows baseline lag on win-ops-12.", input.now, 48),
  ];
  const tests = [
    test(input.systemId, "CM-6", "examine", "other", "AWS Config reports nine STIG deviations without an approved overlay."),
    test(input.systemId, "SC-7", "examine", "satisfied", "Boundary SG and TGW rules match the authorization boundary drawing."),
    test(input.systemId, "CM-2", "examine", "satisfied", "Golden AMI registered; node group uses the current image."),
  ];
  const mappings = [
    hit("CM-6", "examine", "other", "AWS Config: stig-win-ops-12"),
    hit("SC-7", "examine", "satisfied", "AWS Config: sg-aether-api"),
    hit("AC-3", "examine", "satisfied", "IAM: aurora-resource-policy"),
    hit("AU-12", "examine", "satisfied", "CloudTrail: org-trail"),
    hit("CM-2", "examine", "satisfied", "EC2: eks-node-ami"),
  ];
  const changes: ConfigChangeRecord[] = [];
  if (g >= 1) {
    changes.push({
      id: `CHG-${input.jobId}`,
      systemId: input.systemId,
      kind: "Network ACL",
      summary: `Bastion subnet NACL ${4100 + g} added ephemeral 22 from jump CIDR. Not in the prior baseline.`,
      detectedAt: input.now,
      controls: ["SC-7", "AC-4", "CM-3", "CM-6"],
      risk: "Inbound path to the privileged jump host changed. Re-test SC-7.",
      status: "open",
    });
  }
  return {
    evidence,
    tests,
    changes,
    vulns: [],
    tickets: [],
    assets: [],
    implControls: ["CM-6", "SC-7", "AC-3", "AU-12", "CM-2"],
    mappings,
    summary:
      g === 0
        ? "AWS Config: 5 rules evaluated. CM-6 other (STIG deviations). SC-7 satisfied on TGW. No new drift."
        : `AWS Config: 5 rules. New NACL on bastion subnet mapped to SC-7 / CM-3. CM-6 remains other.`,
  };
}

function planEntraAether(input: { systemId: string; generation: number; now: string; jobId: string }, def: ConnectorDef): CollectionPlan {
  const g = input.generation;
  const residual = Math.max(14, 17 - g * 3);
  const evidence = [
    evd(input.jobId, 1, input.systemId, "AC-2", def.name, "Entra account lifecycle", `${residual} terminated identities still enabled past the 24-hour disablement objective (contractors).`, input.now, 4),
    evd(input.jobId, 2, input.systemId, "AC-2(3)", def.name, "Inactivity disablement", "Inactivity policy is 45 days; organizational parameter is 30 days.", input.now, 4),
    evd(input.jobId, 3, input.systemId, "IA-2", def.name, "MFA / Conditional Access", "Workforce MFA enforced. Three coalition admin roles are PIM-eligible.", input.now, 4),
    evd(input.jobId, 4, input.systemId, "PS-4", def.name, "HR-to-IAM offboarding", "Employee feed closes in 4 hours. Contractor SCIM connector still open on POA&M.", input.now, 4),
  ];
  const tests = [
    test(input.systemId, "AC-2", "test", "other", `${residual} residual enabled accounts after termination.`),
    test(input.systemId, "IA-2", "examine", "satisfied", "Conditional Access requires phishing-resistant MFA for org users."),
  ];
  const mappings = [
    hit("AC-2", "test", "other", "Entra: disabled=false AND employeeLeaveDate < now-24h"),
    hit("AC-2(3)", "examine", "other", "Entra: inactivity 45d vs 30d"),
    hit("IA-2", "examine", "satisfied", "CA policy: all-cloud-apps MFA"),
    hit("PS-4", "examine", "other", "SCIM contractor connector missing"),
  ];
  const changes: ConfigChangeRecord[] = [];
  if (g >= 1) {
    changes.push({
      id: `CHG-${input.jobId}`,
      systemId: input.systemId,
      kind: "Identity",
      summary: `PIM + offboarding: ${Math.min(3, g * 3)} contractor accounts disabled this window. ${residual} remain.`,
      detectedAt: input.now,
      controls: ["AC-2", "AC-6", "IA-2", "PS-4"],
      risk: "Privileged population shrinking but AC-2 remains other than satisfied.",
      status: "reviewed",
    });
  }
  return {
    evidence,
    tests,
    changes,
    vulns: [],
    tickets: [],
    assets: [],
    implControls: ["AC-2", "AC-2(3)", "IA-2", "PS-4"],
    mappings,
    summary: `Entra: ${residual} residual accounts. AC-2 other. IA-2 satisfied. Contractor SCIM still open.`,
  };
}

function planTenableAether(input: { systemId: string; generation: number; now: string; jobId: string }, def: ConnectorDef): CollectionPlan {
  const g = input.generation;
  const coverage = Math.min(96, 88 + g * 3);
  const evidence = [
    evd(input.jobId, 1, input.systemId, "RA-5", def.name, "Authenticated scan coverage", `Coverage ${coverage}% of CM-8 inventory. Bastion and ${Math.max(0, 12 - g * 4)} ephemeral pods still unscanned.`, input.now, 36),
    evd(input.jobId, 2, input.systemId, "SI-2", def.name, "Patch / KEV findings", "CVE-2026-44102 (KEV) remains open on win-ops-12. Fourteen High/Critical past SLO.", input.now, 36),
    evd(input.jobId, 3, input.systemId, "CM-8", def.name, "Scan vs inventory", "Scanner asset count vs CMDB: 247 declared, authenticated hits lag on pods.", input.now, 36),
  ];
  const tests = [
    test(input.systemId, "RA-5", "test", "other", `Authenticated coverage ${coverage}% — below the 95% parameter.`),
    test(input.systemId, "SI-2", "test", "other", "CISA KEV CVE-2026-44102 still present on a privileged host."),
  ];
  const mappings = [
    hit("RA-5", "test", "other", `Tenable: coverage ${coverage}%`),
    hit("SI-2", "test", "other", "Tenable: CVE-2026-44102 KEV"),
    hit("CM-8", "examine", "satisfied", "Tenable: asset reconciliation"),
  ];
  const vulns: VulnerabilityRecord[] = [];
  const changes: ConfigChangeRecord[] = [];
  if (g >= 1) {
    vulns.push({
      id: `VUL-${input.jobId}`,
      systemId: input.systemId,
      assetId: "AST-04",
      cve: `CVE-2026-55${200 + g}`,
      title: "OpenSSH privilege issue on bastion (newly in coverage)",
      cvss: 7.8,
      severity: "high",
      kev: false,
      controlIds: ["RA-5", "SI-2", "AC-6"],
      status: "open",
    });
    changes.push({
      id: `CHG-${input.jobId}`,
      systemId: input.systemId,
      kind: "Scan coverage",
      summary: `Authenticated agent landed on bastion. Coverage ${coverage}%. New finding queued to SI-2.`,
      detectedAt: input.now,
      controls: ["RA-5", "SI-2", "CM-8"],
      risk: "Closing a scan hole exposed a High on the privileged path. Do not auto-close POA&M.",
      status: "open",
    });
  }
  return {
    evidence,
    tests,
    changes,
    vulns,
    tickets: [],
    assets: [],
    implControls: ["RA-5", "SI-2", "CM-8"],
    mappings,
    summary: `Tenable: coverage ${coverage}%. KEV still open. SI-2 remains other. No POA&M auto-close.`,
  };
}

function planCrowdAether(input: { systemId: string; generation: number; now: string; jobId: string }, def: ConnectorDef): CollectionPlan {
  const g = input.generation;
  const evidence = [
    evd(input.jobId, 1, input.systemId, "SI-4", def.name, "EDR coverage", "win-ops-12, bastion, and EKS nodes reporting. Containment policy armed.", input.now, 8),
    evd(input.jobId, 2, input.systemId, "SI-3", def.name, "Malware prevention", "Prevent-on-write enabled. No prevent-mode exceptions on privileged hosts.", input.now, 8),
    evd(input.jobId, 3, input.systemId, "IR-4", def.name, "Detection / response", "Incident pipeline to Sentinel. KEV host is contained, not patched.", input.now, 8),
  ];
  const tests = [
    test(input.systemId, "SI-4", "test", "satisfied", "EDR sensors online for in-boundary Windows and Linux nodes."),
    test(input.systemId, "IR-4", "examine", "satisfied", "Containment playbook executed for win-ops-12; human IR still required for eradication."),
  ];
  const mappings = [
    hit("SI-4", "test", "satisfied", "CrowdStrike: sensor-health"),
    hit("SI-3", "examine", "satisfied", "CrowdStrike: prevent-on-write"),
    hit("IR-4", "examine", "satisfied", "CrowdStrike: contain win-ops-12"),
  ];
  const changes: ConfigChangeRecord[] = [];
  if (g >= 1) {
    changes.push({
      id: `CHG-${input.jobId}`,
      systemId: input.systemId,
      kind: "Detection",
      summary: "LSASS access attempt on win-ops-12 blocked and contained. Maps to IR-4 / SI-4. Patch (SI-2) still open.",
      detectedAt: input.now,
      controls: ["IR-4", "SI-4", "SI-2"],
      risk: "Active exploitation attempt against the KEV host. Containment ≠ remediation.",
      status: "open",
    });
  }
  return {
    evidence,
    tests,
    changes,
    vulns: [],
    tickets: [],
    assets: [],
    implControls: ["SI-4", "SI-3", "IR-4"],
    mappings,
    summary:
      g === 0
        ? "CrowdStrike: sensors healthy. win-ops-12 contained. SI-2 (patch) not closed by EDR."
        : "CrowdStrike: LSASS attempt blocked on KEV host. IR-4 evidence refreshed. Humans still eradicate.",
  };
}

function planSnowAether(input: { systemId: string; generation: number; now: string; jobId: string }, def: ConnectorDef): CollectionPlan {
  const g = input.generation;
  const chgStatus = g >= 2 ? "resolved" : "in_progress";
  const evidence = [
    evd(input.jobId, 1, input.systemId, "CA-5", def.name, "POA&M ticket sync", `CHG007441 ${chgStatus}. ICAM-2188 open. Tickets bound to POAM-284 / POAM-291.`, input.now, 24),
    evd(input.jobId, 2, input.systemId, "CM-3", def.name, "Change records", "Emergency patch window for win-ops-12 is on the CAB calendar. Not implemented.", input.now, 24),
  ];
  const tests = [test(input.systemId, "CA-5", "examine", "satisfied", "Open POA&M items have live ITSM tickets.")];
  const mappings = [
    hit("CA-5", "examine", "satisfied", "ServiceNow: CHG007441 ↔ POAM-284"),
    hit("CM-3", "examine", "other", "ServiceNow: emergency change not closed"),
    hit("SI-2", "examine", "other", "ServiceNow: patch ticket still in_progress"),
  ];
  const tickets: TicketRecord[] = [
    {
      id: "TCK-1001",
      poamId: "POAM-284",
      systemId: input.systemId,
      source: "ServiceNow",
      externalId: "CHG007441",
      title: "Emergency patch win-ops-12 (CVE-2026-44102)",
      status: chgStatus,
      assignee: "Windows ops",
      updatedAt: input.now.slice(0, 10),
    },
  ];
  const changes: ConfigChangeRecord[] = [];
  if (g >= 1) {
    changes.push({
      id: `CHG-${input.jobId}`,
      systemId: input.systemId,
      kind: "ITSM",
      summary: `CHG007441 moved to ${chgStatus}. POA&M-284 stays open until ISSO verifies the patch — collectors do not close residual risk.`,
      detectedAt: input.now,
      controls: ["CA-5", "SI-2", "CM-3"],
      risk: "Ticket progress is not authorization. SCA still verifies.",
      status: "reviewed",
    });
  }
  return {
    evidence,
    tests,
    changes,
    vulns: [],
    tickets,
    assets: [],
    implControls: ["CA-5", "CM-3"],
    mappings,
    summary: `ServiceNow: CHG007441 ${chgStatus}. POA&M not auto-closed. CA-5 ticket linkage satisfied.`,
  };
}

function planTfAether(input: { systemId: string; generation: number; now: string; jobId: string }, def: ConnectorDef): CollectionPlan {
  const g = input.generation;
  const evidence = [
    evd(input.jobId, 1, input.systemId, "CM-2", def.name, "Terraform state — baseline", "State lists EKS, Aurora, API GW, bastion. Drift vs Config is the Windows host (not in TF).", input.now, 48),
    evd(input.jobId, 2, input.systemId, "CM-8", def.name, "Terraform inventory", "247 declared components. win-ops-12 is hybrid / out of IaC.", input.now, 48),
    evd(input.jobId, 3, input.systemId, "SC-7", def.name, "Terraform security groups", "SG and NACL resources match the boundary designer except the new bastion rule.", input.now, 48),
  ];
  const tests = [
    test(input.systemId, "CM-8", "examine", "satisfied", "Terraform state reconciles cloud components. Hybrid Windows host tracked as an exception."),
  ];
  const mappings = [
    hit("CM-2", "examine", "satisfied", "terraform state: aws_eks_node_group"),
    hit("CM-8", "examine", "satisfied", "terraform state: resource count"),
    hit("SC-7", "examine", "satisfied", "terraform state: aws_security_group"),
  ];
  const assets: AssetRecord[] = [];
  const changes: ConfigChangeRecord[] = [];
  if (g >= 1) {
    assets.push({
      id: `AST-TF-${g}`,
      systemId: input.systemId,
      name: `aether-eks-ng-${g}`,
      kind: "Kubernetes node group",
      environment: "GovCloud",
      criticality: "high",
      internetExposed: false,
    });
    changes.push({
      id: `CHG-${input.jobId}`,
      systemId: input.systemId,
      kind: "Image",
      summary: `Terraform apply added EKS node group aether-eks-ng-${g}. CM-2 / CM-3 / SC-39 may need re-test.`,
      detectedAt: input.now,
      controls: ["CM-2", "CM-3", "CM-8", "SC-39"],
      risk: "Runtime baseline changed. Seccomp/SC-39 from the last SAR may be stale.",
      status: "open",
    });
  }
  return {
    evidence,
    tests,
    changes,
    vulns: [],
    tickets: [],
    assets,
    implControls: ["CM-2", "CM-8", "SC-7"],
    mappings,
    summary:
      g === 0
        ? "Terraform: inventory reconciled. Hybrid win-ops-12 is the IaC exception."
        : `Terraform: new node group aether-eks-ng-${g}. Boundary inventory updated. SC-39 re-test queued.`,
  };
}

function planAcas(
  input: { systemId: string; generation: number; now: string; jobId: string },
  def: ConnectorDef,
): CollectionPlan {
  const evidence = [
    evd(input.jobId, 1, input.systemId, "RA-5", def.name, "ACAS authenticated scan", "Plugin hits on CUI hosts. Scan coverage vs CM-8 inventory is the first TEST.", input.now, 48),
    evd(input.jobId, 2, input.systemId, "SI-2", def.name, "ACAS flaw remediation", "Critical/high findings older than the org KEV SLO. Patch tickets not closed by this collector.", input.now, 48),
  ];
  const vulns: VulnerabilityRecord[] = [
    {
      id: `VUL-${input.jobId}-1`,
      systemId: input.systemId,
      assetId: input.systemId === "SYS-HELIOS" ? "AST-09" : "AST-01",
      cve: "CVE-2026-3310",
      title: "ACAS — unauthenticated service on CUI path",
      cvss: 8.6,
      severity: "high",
      kev: false,
      controlIds: ["RA-5", "SI-2", "AC-3"],
      status: "open",
    },
  ];
  const tests = [
    test(input.systemId, "RA-5", "test", "other", "ACAS: scan complete. Open high findings. Not a SAR."),
    test(input.systemId, "CM-8", "test", "satisfied", "ACAS asset list matches discovered inventory for scanned enclaves."),
  ];
  return {
    evidence,
    tests,
    changes: [],
    vulns,
    tickets: [],
    assets: [],
    implControls: ["RA-5", "SI-2", "CM-8"],
    mappings: [hit("RA-5", "test", "other", "ACAS:plugin"), hit("SI-2", "test", "other", "ACAS:age")],
    summary: "ACAS: authenticated scan ingested. Findings open. ATO unchanged. Engine does not close a POA&M.",
  };
}

function planStig(
  input: { systemId: string; generation: number; now: string; jobId: string },
  def: ConnectorDef,
): CollectionPlan {
  const evidence = [
    evd(input.jobId, 1, input.systemId, "CM-6", def.name, "STIG checklist", "CAT I open items require an overlay or a POA&M. CAT II tracked. Collector does not accept residual risk.", input.now, 24 * 30),
    evd(input.jobId, 2, input.systemId, "CM-2", def.name, "STIG baseline", "Gold image vs running config. Drift is a CM-2 finding, not an ATO.", input.now, 24 * 30),
  ];
  const tests = [
    test(input.systemId, "CM-6", "test", "other", "STIG: CAT I not closed. Overlay or POA&M required. Unofficial."),
    test(input.systemId, "CM-2", "examine", "other", "STIG: running config diverges from the documented baseline."),
  ];
  return {
    evidence,
    tests,
    changes: [],
    vulns: [],
    tickets: [],
    assets: [],
    implControls: ["CM-6", "CM-2"],
    mappings: [hit("CM-6", "test", "other", "STIG:CAT-I"), hit("CM-2", "examine", "other", "STIG:drift")],
    summary: "STIG/SCAP: checklist ingested. CAT I remains other-than-satisfied. ATO unchanged.",
  };
}

function planNmap(
  input: { systemId: string; generation: number; now: string; jobId: string },
  def: ConnectorDef,
): CollectionPlan {
  const evidence = [
    evd(input.jobId, 1, input.systemId, "CM-8", def.name, "Nmap host discovery", "Live hosts compared to the authorization-boundary inventory. Orphans are CM-8 gaps.", input.now, 72),
    evd(input.jobId, 2, input.systemId, "SC-7", def.name, "Nmap listeners", "Unexpected 443/22 on the partner path. Confirm ISA or close the listener.", input.now, 72),
  ];
  const tests = [
    test(input.systemId, "SC-7", "test", "other", "Nmap: listener outside the documented boundary. Investigate before SAR."),
    test(input.systemId, "CM-8", "test", "satisfied", "Nmap: scanned set covers the registered CIs in this enclave."),
  ];
  const assets: AssetRecord[] = [
    {
      id: `AST-NMAP-${input.jobId.slice(-4)}`,
      systemId: input.systemId,
      name: "nmap-discovered-listener",
      kind: "Network listener",
      environment: "Hybrid",
      criticality: "moderate",
      internetExposed: true,
    },
  ];
  return {
    evidence,
    tests,
    changes: [],
    vulns: [],
    tickets: [],
    assets,
    implControls: ["CM-8", "SC-7"],
    mappings: [hit("SC-7", "test", "other", "nmap:443"), hit("CM-8", "test", "satisfied", "nmap:hosts")],
    summary: "Nmap: discovery complete. Exposure finding staged. Inventory updated. ATO unchanged.",
  };
}

function planEtec(
  input: { systemId: string; generation: number; now: string; jobId: string },
  def: ConnectorDef,
): CollectionPlan {
  const evidence = [
    evd(input.jobId, 1, input.systemId, "CA-2", def.name, "ETEC procedure run", "Evaluation test engine executed the SAP TEST procedures. Results are unofficial until the SCA records them.", input.now, 24 * 14),
    evd(input.jobId, 2, input.systemId, "SA-11", def.name, "ETEC application tests", "Harness covered auth, input validation, and session. Failures bound to SA-11 / SI-10.", input.now, 24 * 14),
  ];
  const tests = [
    test(input.systemId, "CA-2", "test", "not_assessed", "ETEC ran. SCA has not recorded the official determination."),
    test(input.systemId, "SA-11", "test", "other", "ETEC: application test failures. Finding opened. Not a SAR."),
  ];
  return {
    evidence,
    tests,
    changes: [],
    vulns: [],
    tickets: [],
    assets: [],
    implControls: ["CA-2", "SA-11", "SI-6"],
    mappings: [hit("CA-2", "test", "not_assessed", "ETEC:sap"), hit("SA-11", "test", "other", "ETEC:app")],
    summary: "ETEC: test harness results ingested. SCA still records the official result. ATO unchanged.",
  };
}

function planNetworkScan(
  input: { systemId: string; generation: number; now: string; jobId: string },
  def: ConnectorDef,
): CollectionPlan {
  const evidence = [
    evd(input.jobId, 1, input.systemId, "SC-7", def.name, "Network scanner — boundary", "Your network scanner attached. Listeners and routes compared to the authorization boundary.", input.now, 72),
    evd(input.jobId, 2, input.systemId, "CM-8", def.name, "Network scanner — inventory", "Discovered devices merged into CM-8. Human confirms orphans.", input.now, 72),
  ];
  const tests = [test(input.systemId, "SC-7", "test", "satisfied", "Network scanner: no new internet listeners in this pass.")];
  return {
    evidence,
    tests,
    changes: [],
    vulns: [],
    tickets: [],
    assets: [],
    implControls: ["SC-7", "CM-8"],
    mappings: [hit("SC-7", "test", "satisfied", "netscan:boundary")],
    summary: "Network scanner attached. Boundary TEST recorded. ATO unchanged.",
  };
}

function planAppScan(
  input: { systemId: string; generation: number; now: string; jobId: string },
  def: ConnectorDef,
): CollectionPlan {
  const evidence = [
    evd(input.jobId, 1, input.systemId, "SA-11", def.name, "Application scanner — DAST/SAST", "Your application scanner attached. Findings bound to SA-11. Developer tickets do not close the POA&M.", input.now, 72),
    evd(input.jobId, 2, input.systemId, "SI-10", def.name, "Application scanner — input validation", "Injection and session findings mapped to SI-10 / SC-8.", input.now, 72),
  ];
  const tests = [test(input.systemId, "SA-11", "test", "other", "Application scanner: open findings. SCA reviews before SAR.")];
  const vulns: VulnerabilityRecord[] = [
    {
      id: `VUL-${input.jobId}-APP`,
      systemId: input.systemId,
      assetId: input.systemId === "SYS-HELIOS" ? "AST-08" : "AST-02",
      cve: "APP-FINDING-01",
      title: "Application scanner — unvalidated input on CUI API",
      cvss: 7.5,
      severity: "high",
      kev: false,
      controlIds: ["SA-11", "SI-10"],
      status: "open",
    },
  ];
  return {
    evidence,
    tests,
    changes: [],
    vulns,
    tickets: [],
    assets: [],
    implControls: ["SA-11", "SI-10"],
    mappings: [hit("SA-11", "test", "other", "appscan:dast")],
    summary: "Application scanner attached. SA-11 other-than-satisfied staged. ATO unchanged.",
  };
}

export function planAxiom(
  input: { systemId: string; generation: number; now: string; jobId: string },
  def: ConnectorDef,
  findings: AxiomFinding[],
  live: boolean,
  source: string,
): CollectionPlan {
  const hits = axiomControlHits(findings);
  const evidence = [
    evd(
      input.jobId,
      1,
      input.systemId,
      "SA-11",
      def.name,
      "AXIOM DAST catalog",
      `${live ? "Live" : "Cached"} pull from ${source}. ${findings.length} confirmed findings. Portal ${"https://11-dast-security-platform.vercel.app/app/?standalone=1"}. Unofficial until SCA records.`,
      input.now,
      72,
    ),
  ];
  const tests = [...hits.entries()].map(([controlId, list]) => {
    const worst = list.some((f) => axiomResult(f) === "other") ? "other" : "satisfied";
    const titles = list
      .slice(0, 3)
      .map((f) => f.id)
      .join(", ");
    return test(input.systemId, controlId, "test", worst, `AXIOM ${controlId}: ${list.length} findings (${titles}). Live=${live}.`);
  });
  const mappings = tests.map((t) => hit(t.controlId, "test", t.result, `axiom:${t.controlId}`));
  const vulns: VulnerabilityRecord[] = findings.map((f) => ({
    id: `VUL-AXIOM-${input.jobId.slice(-6)}-${f.id}`,
    systemId: input.systemId,
    assetId: input.systemId === "SYS-HELIOS" ? "AST-08" : "AST-02",
    cve: f.cweId,
    title: `AXIOM ${f.id} — ${f.title}`,
    cvss: f.severity === "Critical" ? 9.8 : f.severity === "High" ? 7.5 : 5.3,
    severity: axiomSeverity(f.severity),
    kev: false,
    controlIds: controlsForCwe(f.cweId),
    status: "open" as const,
  }));
  const crit = findings.filter((f) => f.severity === "Critical").length;
  const high = findings.filter((f) => f.severity === "High").length;
  return {
    evidence,
    tests,
    changes: [],
    vulns,
    tickets: [],
    assets: [],
    implControls: [...hits.keys()],
    mappings,
    summary: `AXIOM DAST: ${findings.length} findings (${crit} critical / ${high} high) · ${live ? "live catalog" : "cached"} · SA-11 other-than-satisfied. ATO unchanged.`,
  };
}

export function planSuite(
  input: { systemId: string; generation: number; now: string; jobId: string },
  def: ConnectorDef,
  findings: SuiteFinding[],
  live: boolean,
  source: string,
  label: string,
): CollectionPlan {
  const hits = controlHits(findings);
  const evidence = [
    evd(
      input.jobId,
      1,
      input.systemId,
      findings[0]?.controls[0] ?? "CA-2",
      def.name,
      `${label} catalog`,
      `${live ? "Live" : "Cached"} pull from ${source}. ${findings.length} findings against this authorization boundary. Auto-scan on Assess. Unofficial until SCA records.`,
      input.now,
      72,
    ),
  ];
  const tests = [...hits.entries()].map(([controlId, list]) => {
    const worst = list.some((f) => suiteResult(f) === "other") ? "other" : "satisfied";
    return test(
      input.systemId,
      controlId,
      "test",
      worst,
      `${label} ${controlId}: ${list.length} findings (${list
        .slice(0, 3)
        .map((f) => f.id)
        .join(", ")}). Live=${live}.`,
    );
  });
  const mappings = tests.map((t) => hit(t.controlId, "test", t.result, `${def.id}:${t.controlId}`));
  const vulns: VulnerabilityRecord[] = findings.map((f) => ({
    id: `VUL-${def.id}-${input.jobId.slice(-6)}-${f.id}`,
    systemId: input.systemId,
    assetId: input.systemId === "SYS-HELIOS" ? "AST-08" : "AST-02",
    cve: f.cve ?? f.id,
    title: `${label} ${f.id} — ${f.title}`,
    cvss: f.severity === "Critical" ? 9.8 : f.severity === "High" ? 7.5 : 5.3,
    severity: suiteSeverity(f.severity),
    kev: Boolean(f.cve?.includes("2021-44228") || f.cve?.includes("2022-22965")),
    controlIds: f.controls,
    status: "open" as const,
  }));
  const crit = findings.filter((f) => f.severity === "Critical").length;
  const high = findings.filter((f) => f.severity === "High").length;
  return {
    evidence,
    tests,
    changes: [],
    vulns,
    tickets: [],
    assets: [],
    implControls: [...hits.keys()],
    mappings,
    summary: `${label}: ${findings.length} findings (${crit} critical / ${high} high) · ${live ? "live catalog" : "cached"} · auto-scan. ATO unchanged.`,
  };
}

function planOscal(
  input: { systemId: string; generation: number; now: string; jobId: string },
  def: ConnectorDef,
): CollectionPlan {
  const observations = observationsFor(input.systemId);
  const evidence = observations.map((o, i) =>
    evd(input.jobId, i + 1, input.systemId, o.controlId, def.name, o.evidenceTitle, o.evidenceSummary, input.now, 24 * 30),
  );
  const tests = observations.map((o) => test(input.systemId, o.controlId, o.method, o.result, o.comments));
  const mappings = observations.map((o) => hit(o.controlId, o.method, o.result, `${def.name}:${o.controlId}`));
  const other = observations.filter((o) => o.result === "other").length;
  return {
    evidence,
    tests,
    changes: [],
    vulns: [],
    tickets: [],
    assets: [],
    implControls: observations.map((o) => o.controlId),
    mappings,
    summary: `${def.name}: ${observations.length} objectives ingested · ${other} other-than-satisfied. ATO unchanged.`,
  };
}

function planGeneric(input: { systemId: string; generation: number; now: string; jobId: string }, def: ConnectorDef): CollectionPlan {
  const evidence = def.controls.map((controlId, i) =>
    evd(
      input.jobId,
      i + 1,
      input.systemId,
      controlId,
      def.name,
      `${def.name} — ${controlId}`,
      `${def.authority}. Normalized and bound to ${controlId}. Generation ${input.generation}.`,
      input.now,
      cadenceHours(def.cadence) * 2,
    ),
  );
  const mappings = def.controls.map((c) => hit(c, "examine", "satisfied", `${def.name}:${c}`));
  const tests = def.controls.slice(0, 2).map((c) => test(input.systemId, c, "examine", "satisfied", `${def.name} automated examine of ${c}.`));
  const changes: ConfigChangeRecord[] = [];
  if (input.generation >= 1) {
    changes.push({
      id: `CHG-${input.jobId}`,
      systemId: input.systemId,
      kind: def.family,
      summary: `${def.name} reported drift on ${def.controls[0]}. Staged for ISSO review.`,
      detectedAt: input.now,
      controls: def.controls.slice(0, 3),
      risk: "Live telemetry changed. Assessment results may be stale.",
      status: "open",
    });
  }
  return {
    evidence,
    tests,
    changes,
    vulns: [],
    tickets: [],
    assets: [],
    implControls: def.controls,
    mappings,
    summary: `${def.name}: ${evidence.length} controls mapped from ${def.authority}.`,
  };
}
