import type {
  ImplementationRecord,
  PoamRecord,
  ReadinessBreakdown,
  EvidenceRecord,
  FindingRecord,
  ImplementationStatus,
} from "./types";

const STATUS_LABELS: Record<string, string> = {
  implemented: "Implemented",
  inherited: "Inherited",
  partial: "Partial",
  planned: "Planned",
  not_implemented: "Not implemented",
  not_applicable: "Not applicable",
  satisfied: "Satisfied",
  other: "Other than satisfied",
  not_assessed: "Not assessed",
  authorized: "Authorized",
  authorized_with_conditions: "ATO with conditions",
  in_assessment: "In assessment",
  not_authorized: "Not authorized",
  expired: "Expired",
  completed: "Completed",
  complete: "Complete",
  delayed: "Delayed",
  open: "Open",
  risk_accepted: "Risk accepted",
  system: "System-specific",
  hybrid: "Hybrid",
  not_selected: "Not selected",
  missing: "Missing",
  draft: "Draft",
  attached: "Attached",
  unofficial: "Unofficial",
  generated: "Generated",
  approved: "Approved",
  pending: "Pending",
  queued: "Queued",
  isso_implement: "ISSO implement",
  isso_submit: "ISSO submit",
  sca_assess: "SCA assess",
  issm_review: "ISSM review",
  ao_decision: "AO decision",
  conmon: "ConMon",
  examine: "Examine",
  interview: "Interview",
  test: "Test",
  automated: "Automated",
  accepted: "Accepted",
  mitigating: "Mitigating",
  closed: "Closed",
  active: "Active",
  in_progress: "In progress",
  resolved: "Resolved",
  reviewed: "Reviewed",
  overdue: "Overdue",
  installed: "Installed",
  available: "Available",
  KEV: "KEV",
  enabled: "Enabled",
  disabled: "Disabled",
  healthy: "Healthy",
  stale: "Stale",
  due: "Due",
  degraded: "Degraded",
  never: "Never collected",
  proposed: "Proposed",
  rejected: "Rejected",
  investigating: "Investigating",
  contained: "Contained",
  poam_opened: "POA&M opened",
  collected: "Collected",
  valid: "Valid",
  expiring: "Expiring soon",
  published: "Published",
  blocked: "Awaiting human",
  official: "Official",
  connected: "Connected",
  empty: "Empty",
  unavailable: "Not bound",
  review_required: "Review required",
  reassess: "Reassessment",
  hold: "Hold",
  stable: "Stable",
  passing: "Passing",
  failing: "Failing",
  not_wired: "Not wired",
  strong: "Strong",
  suspend: "Not supportable",
  reopen: "Reassess package",
  condition: "Inside conditions",
  none: "No ATO impact",
};

export function statusTone(
  status: ImplementationStatus | string,
): "satisfied" | "partial" | "other" | "info" | "default" {
  switch (status) {
    case "implemented":
    case "inherited":
    case "satisfied":
    case "authorized":
    case "completed":
    case "complete":
    case "approved":
    case "accepted":
    case "installed":
    case "resolved":
    case "healthy":
    case "enabled":
    case "contained":
    case "valid":
    case "published":
    case "stable":
    case "passing":
    case "strong":
    case "established":
    case "official":
    case "attached":
    case "connected":
      return "satisfied";
    case "partial":
    case "planned":
    case "authorized_with_conditions":
    case "in_assessment":
    case "delayed":
    case "hybrid":
    case "draft":
    case "generated":
    case "queued":
    case "pending":
    case "unofficial":
    case "empty":
    case "mitigating":
    case "in_progress":
    case "reviewed":
    case "stale":
    case "degraded":
    case "proposed":
    case "investigating":
    case "expiring":
    case "review_required":
    case "condition":
    case "reopen":
    case "blocked":
      return "partial";
    case "not_implemented":
    case "other":
    case "open":
    case "not_authorized":
    case "expired":
    case "critical":
    case "high":
    case "missing":
    case "overdue":
    case "KEV":
    case "due":
    case "gap":
    case "failing":
    case "suspend":
    case "reassess":
    case "hold":
    case "rejected":
    case "unavailable":
      return "other";
    case "system":
    case "not_selected":
    case "not_assessed":
    case "not_applicable":
      return "info";
    default:
      return "info";
  }
}

export function labelStatus(status: string): string {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function implementationScore(status: ImplementationStatus): number {
  switch (status) {
    case "implemented":
    case "inherited":
      return 1;
    case "partial":
      return 0.55;
    case "planned":
      return 0.25;
    case "not_applicable":
      return 1;
    default:
      return 0;
  }
}

export function computeReadiness(input: {
  implementations: ImplementationRecord[];
  evidence: EvidenceRecord[];
  poams: PoamRecord[];
  findings: FindingRecord[];
  hasSsp: boolean;
}): ReadinessBreakdown {
  const impls = input.implementations.filter((i) => i.status !== "not_applicable");
  const implementation =
    impls.length === 0
      ? 0
      : (impls.reduce((s, i) => s + implementationScore(i.status), 0) / impls.length) *
        100;

  const withEvidence = new Set(input.evidence.map((e) => e.controlId));
  const evidence =
    impls.length === 0
      ? 0
      : (impls.filter((i) => withEvidence.has(i.controlId)).length / impls.length) * 100;

  const openHigh = input.poams.filter(
    (p) =>
      p.status !== "completed" &&
      (p.riskLevel === "high" || p.riskLevel === "critical"),
  );
  const highRisks = Math.max(0, 100 - openHigh.length * 14);

  const open = input.poams.filter((p) => p.status !== "completed");
  const overdue = open.filter((p) => new Date(p.dueDate).getTime() < Date.now());
  const poam =
    input.poams.length === 0
      ? 90
      : Math.max(
          20,
          100 -
            open.length * 6 -
            overdue.length * 8 -
            open.filter((p) => p.status === "delayed").length * 6,
        );

  const recentEvidence = input.evidence.filter((e) => {
    const age = Date.now() - new Date(e.collectedAt).getTime();
    return age < 1000 * 60 * 60 * 24 * 45;
  });
  const monitoring =
    input.evidence.length === 0
      ? 40
      : (recentEvidence.length / Math.max(input.evidence.length, 1)) * 100;

  const documentation = input.hasSsp ? 86 : 48;

  const overall =
    evidence * 0.2 +
    implementation * 0.25 +
    highRisks * 0.25 +
    poam * 0.15 +
    monitoring * 0.1 +
    documentation * 0.05;

  return {
    overall: clamp(overall),
    evidence: clamp(evidence),
    implementation: clamp(implementation),
    highRisks: clamp(highRisks),
    poam: clamp(poam),
    monitoring: clamp(monitoring),
    documentation: clamp(documentation),
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
