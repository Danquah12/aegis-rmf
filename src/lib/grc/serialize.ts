import type {
  AgentRunRecord,
  ArtifactRecord,
  AssessmentRecord,
  AssetRecord,
  AuthHistoryRecord,
  ConfigChangeRecord,
  EvidenceRecord,
  FindingRecord,
  ImplementationRecord,
  InterconnectRecord,
  ObjectiveRecord,
  OrganizationRecord,
  PersonnelRecord,
  PoamRecord,
  PrepareTask,
  ProgramRecord,
  RiskRecord,
  RoleAssignment,
  SspSectionRecord,
  SystemRecord,
  TestResultRecord,
  TicketRecord,
  VulnerabilityRecord,
  WorkflowEventRecord,
  CollectionJob,
  ConnectorBinding,
  IncidentRecord,
  PolicyRecord,
  WhatIfRun,
  InterviewRecord,
  InheritanceProposal,
  CatoReview,
  AuditEvent,
  AcademyProgress,
  SupportDocument,
  OrgArtifact,
  OrgArtifactKind,
  OrgRmfBaseline,
} from "./types";

export function rowSystem(r: Record<string, unknown>): SystemRecord {
  return {
    id: String(r.id),
    name: String(r.name),
    acronym: String(r.acronym),
    mission: String(r.mission),
    impactLevel: r.impact_level as SystemRecord["impactLevel"],
    atoStatus: r.ato_status as SystemRecord["atoStatus"],
    atoExpires: r.ato_expires ? String(r.ato_expires) : null,
    hosting: String(r.hosting),
    cloudProvider: r.cloud_provider ? String(r.cloud_provider) : null,
    ownerRole: String(r.owner_role),
    issoRole: String(r.isso_role),
    aoRole: String(r.ao_role),
    authorizationBoundary: String(r.authorization_boundary),
    dataTypes: JSON.parse(String(r.data_types)),
    rmfStep: r.rmf_step as SystemRecord["rmfStep"],
    sspDraft: r.ssp_draft ? String(r.ssp_draft) : null,
    extra: JSON.parse(String(r.extra || "{}")) as SystemRecord["extra"],
  };
}

export function rowImpl(r: Record<string, unknown>): ImplementationRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    controlId: String(r.control_id),
    status: r.status as ImplementationRecord["status"],
    result: r.result as ImplementationRecord["result"],
    statement: String(r.statement),
    confidence: Number(r.confidence),
    lastVerified: String(r.last_verified),
    responsible: String(r.responsible),
  };
}

export function rowEvidence(r: Record<string, unknown>): EvidenceRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    controlId: String(r.control_id),
    title: String(r.title),
    source: String(r.source),
    method: String(r.method),
    collectedAt: String(r.collected_at),
    hash: String(r.hash),
    classification: String(r.classification),
    expiresAt: r.expires_at ? String(r.expires_at) : null,
    summary: String(r.summary),
  };
}

export function rowFinding(r: Record<string, unknown>): FindingRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    controlId: String(r.control_id),
    title: String(r.title),
    severity: r.severity as FindingRecord["severity"],
    status: r.status as FindingRecord["status"],
    description: String(r.description),
    impact: String(r.impact),
  };
}

export function rowPoam(r: Record<string, unknown>): PoamRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    findingId: r.finding_id ? String(r.finding_id) : null,
    controlId: String(r.control_id),
    weakness: String(r.weakness),
    riskLevel: r.risk_level as PoamRecord["riskLevel"],
    owner: String(r.owner),
    dueDate: String(r.due_date),
    status: r.status as PoamRecord["status"],
    milestones: JSON.parse(String(r.milestones)),
    resources: String(r.resources),
    compensating: r.compensating ? String(r.compensating) : null,
    daysOpen: Number(r.days_open),
  };
}

export function rowAssessment(r: Record<string, unknown>): AssessmentRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    kind: String(r.kind),
    status: r.status as AssessmentRecord["status"],
    assessor: String(r.assessor),
    startedAt: String(r.started_at),
    completedAt: r.completed_at ? String(r.completed_at) : null,
    summary: String(r.summary),
  };
}

export function rowAgent(r: Record<string, unknown>): AgentRunRecord {
  return {
    id: String(r.id),
    agent: String(r.agent),
    systemId: r.system_id ? String(r.system_id) : null,
    status: r.status as AgentRunRecord["status"],
    objective: String(r.objective),
    plan: String(r.plan),
    tools: JSON.parse(String(r.tools)),
    evidence: String(r.evidence),
    decision: String(r.decision),
    confidence: Number(r.confidence),
    createdAt: String(r.created_at),
    requiresApproval: Boolean(r.requires_approval),
  };
}

export function rowAsset(r: Record<string, unknown>): AssetRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    name: String(r.name),
    kind: String(r.kind),
    environment: String(r.environment),
    criticality: r.criticality as AssetRecord["criticality"],
    internetExposed: Boolean(r.internet_exposed),
  };
}

export function rowVuln(r: Record<string, unknown>): VulnerabilityRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    assetId: String(r.asset_id),
    cve: String(r.cve),
    title: String(r.title),
    cvss: Number(r.cvss),
    severity: r.severity as VulnerabilityRecord["severity"],
    kev: Boolean(r.kev),
    controlIds: JSON.parse(String(r.control_ids)),
    status: r.status as VulnerabilityRecord["status"],
  };
}

export function rowArtifact(r: Record<string, unknown>): ArtifactRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    kind: r.kind as ArtifactRecord["kind"],
    title: String(r.title),
    status: r.status as ArtifactRecord["status"],
    source: String(r.source),
    updatedAt: String(r.updated_at),
  };
}

export function rowWorkflow(r: Record<string, unknown>): WorkflowEventRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    gate: r.gate as WorkflowEventRecord["gate"],
    actor: String(r.actor),
    action: String(r.action),
    notes: String(r.notes),
    createdAt: String(r.created_at),
  };
}

export function rowTest(r: Record<string, unknown>): TestResultRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    controlId: String(r.control_id),
    method: r.method as TestResultRecord["method"],
    objective: String(r.objective),
    result: r.result as TestResultRecord["result"],
    comments: String(r.comments),
    automated: Boolean(r.automated),
  };
}

export function rowInterconnect(r: Record<string, unknown>): InterconnectRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    partner: String(r.partner),
    kind: String(r.kind),
    agreement: String(r.agreement),
    dataFlow: String(r.data_flow),
    status: String(r.status),
  };
}

export function rowOrg(r: Record<string, unknown>): OrganizationRecord {
  const status = r.status === "draft" ? "draft" : "established";
  return {
    id: String(r.id),
    name: String(r.name),
    acronym: String(r.acronym),
    kind: String(r.kind),
    parentId: r.parent_id ? String(r.parent_id) : null,
    description: r.description ? String(r.description) : "",
    status,
  };
}

export function rowRoleAssignment(r: Record<string, unknown>): RoleAssignment {
  return {
    id: String(r.id),
    personId: String(r.person_id),
    roleId: String(r.role_id),
    orgId: String(r.org_id),
    systemId: r.system_id ? String(r.system_id) : null,
    notes: r.notes ? String(r.notes) : "",
  };
}

export function rowPrepareTask(r: Record<string, unknown>): PrepareTask {
  const status =
    r.status === "draft" ? "draft" : r.status === "missing" ? "missing" : "established";
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    taskId: String(r.task_id),
    title: String(r.title),
    status,
    ownerRole: String(r.owner_role),
    evidence: String(r.evidence),
  };
}

export function rowProgram(r: Record<string, unknown>): ProgramRecord {
  return { id: String(r.id), orgId: String(r.org_id), name: String(r.name), mission: String(r.mission) };
}

export function rowPersonnel(r: Record<string, unknown>): PersonnelRecord {
  return {
    id: String(r.id),
    systemId: r.system_id ? String(r.system_id) : null,
    orgId: String(r.org_id),
    name: String(r.name),
    role: String(r.role),
    title: String(r.title),
  };
}

export function rowRisk(r: Record<string, unknown>): RiskRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    title: String(r.title),
    threat: String(r.threat),
    vulnerability: String(r.vulnerability),
    assetId: r.asset_id ? String(r.asset_id) : null,
    controlId: String(r.control_id),
    likelihood: r.likelihood as RiskRecord["likelihood"],
    impact: r.impact as RiskRecord["impact"],
    riskLevel: r.risk_level as RiskRecord["riskLevel"],
    mitigation: String(r.mitigation),
    residual: r.residual as RiskRecord["residual"],
    owner: String(r.owner),
    status: r.status as RiskRecord["status"],
    acceptanceExpires: r.acceptance_expires ? String(r.acceptance_expires) : null,
  };
}

export function rowTicket(r: Record<string, unknown>): TicketRecord {
  return {
    id: String(r.id),
    poamId: r.poam_id ? String(r.poam_id) : null,
    systemId: String(r.system_id),
    source: String(r.source),
    externalId: String(r.external_id),
    title: String(r.title),
    status: String(r.status),
    assignee: String(r.assignee),
    updatedAt: String(r.updated_at),
  };
}

export function rowSspSection(r: Record<string, unknown>): SspSectionRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    sectionId: String(r.section_id),
    title: String(r.title),
    body: String(r.body),
    source: String(r.source),
    status: r.status as SspSectionRecord["status"],
    updatedAt: String(r.updated_at),
  };
}

export function rowObjective(r: Record<string, unknown>): ObjectiveRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    controlId: String(r.control_id),
    objectiveId: String(r.objective_id),
    method: r.method as ObjectiveRecord["method"],
    result: r.result as ObjectiveRecord["result"],
    comments: String(r.comments),
    assessor: String(r.assessor),
    updatedAt: String(r.updated_at),
  };
}

export function rowChange(r: Record<string, unknown>): ConfigChangeRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    kind: String(r.kind),
    summary: String(r.summary),
    detectedAt: String(r.detected_at),
    controls: JSON.parse(String(r.controls)),
    risk: String(r.risk),
    status: String(r.status),
  };
}

export function rowAuthHistory(r: Record<string, unknown>): AuthHistoryRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    decision: String(r.decision),
    actor: String(r.actor),
    conditions: String(r.conditions),
    expiresAt: r.expires_at ? String(r.expires_at) : null,
    createdAt: String(r.created_at),
  };
}

export function rowBinding(r: Record<string, unknown>): ConnectorBinding {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    connectorId: String(r.connector_id),
    status: r.status === "disabled" ? "disabled" : "enabled",
    runCount: Number(r.run_count ?? 0),
    lastRun: r.last_run ? String(r.last_run) : null,
    nextRun: r.next_run ? String(r.next_run) : null,
    lastSummary: String(r.last_summary ?? ""),
  };
}

export function rowJob(r: Record<string, unknown>): CollectionJob {
  let mappings: CollectionJob["mappings"] = [];
  try {
    mappings = JSON.parse(String(r.mappings || "[]")) as CollectionJob["mappings"];
  } catch {
    mappings = [];
  }
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    connectorId: String(r.connector_id),
    status: r.status === "failed" ? "failed" : "complete",
    startedAt: String(r.started_at),
    finishedAt: String(r.finished_at),
    evidenceCount: Number(r.evidence_count ?? 0),
    changeCount: Number(r.change_count ?? 0),
    findingCount: Number(r.finding_count ?? 0),
    summary: String(r.summary),
    mappings,
  };
}

export function rowIncident(r: Record<string, unknown>): IncidentRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    title: String(r.title),
    severity: r.severity as IncidentRecord["severity"],
    status: r.status as IncidentRecord["status"],
    summary: String(r.summary),
    assetId: r.asset_id ? String(r.asset_id) : null,
    controlIds: String(r.control_ids)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    atoImpact: String(r.ato_impact),
    createdAt: String(r.created_at),
  };
}

export function rowPolicy(r: Record<string, unknown>): PolicyRecord {
  return {
    id: String(r.id),
    title: String(r.title),
    status: r.status as PolicyRecord["status"],
    body: String(r.body),
    controls: String(r.controls)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    source: String(r.source),
    updatedAt: String(r.updated_at),
  };
}

export function rowWhatIf(r: Record<string, unknown>): WhatIfRun {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    scenario: String(r.scenario),
    result: String(r.result),
    atoImpact: String(r.ato_impact),
    createdAt: String(r.created_at),
  };
}

export function rowInterview(r: Record<string, unknown>): InterviewRecord {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    controlId: String(r.control_id),
    question: String(r.question),
    answer: String(r.answer),
    flag: r.flag ? String(r.flag) : null,
    assessor: String(r.assessor),
    updatedAt: String(r.updated_at),
  };
}

export function rowProposal(r: Record<string, unknown>): InheritanceProposal {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    provider: String(r.provider),
    controlId: String(r.control_id),
    rationale: String(r.rationale),
    status: r.status as InheritanceProposal["status"],
  };
}

export function rowCato(r: Record<string, unknown>): CatoReview {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    state: r.state as CatoReview["state"],
    notes: String(r.notes),
    actor: String(r.actor),
    createdAt: String(r.created_at),
  };
}

export function rowAudit(r: Record<string, unknown>): AuditEvent {
  return {
    id: String(r.id),
    actor: String(r.actor),
    action: String(r.action),
    object: String(r.object),
    createdAt: String(r.created_at),
  };
}

export function rowAcademy(r: Record<string, unknown>): AcademyProgress {
  return {
    id: String(r.id),
    labId: String(r.lab_id),
    status: r.status === "complete" ? "complete" : "in_progress",
    updatedAt: String(r.updated_at),
  };
}

export function rowSupportDoc(r: Record<string, unknown>): SupportDocument {
  return {
    id: String(r.id),
    systemId: String(r.system_id),
    rmfStep: r.rmf_step as SupportDocument["rmfStep"],
    kind: String(r.kind),
    title: String(r.title),
    body: String(r.body),
    controlIds: String(r.control_ids)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    source: String(r.source),
    url: r.url ? String(r.url) : null,
    status: r.status === "draft" ? "draft" : "attached",
    updatedAt: String(r.updated_at),
  };
}

export function rowOrgArtifactKind(r: Record<string, unknown>): OrgArtifactKind {
  return {
    id: String(r.id),
    canonicalId: String(r.canonical_id),
    name: String(r.name),
    aliases: String(r.aliases ?? ""),
    required: r.required === true || r.required === 1 || r.required === "1" || r.required === "t",
    nistTask: String(r.nist_task),
    controlIds: String(r.control_ids)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    ownerRole: String(r.owner_role),
    agency: String(r.agency),
    hint: String(r.hint ?? ""),
  };
}

export function rowOrgArtifact(r: Record<string, unknown>): OrgArtifact {
  return {
    id: String(r.id),
    kindId: String(r.kind_id),
    orgId: String(r.org_id),
    title: String(r.title),
    body: String(r.body),
    controlIds: String(r.control_ids)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    source: String(r.source),
    url: r.url ? String(r.url) : null,
    status: r.status === "draft" ? "draft" : "attached",
    updatedAt: String(r.updated_at),
  };
}

export function rowOrgRmfBaseline(r: Record<string, unknown>): OrgRmfBaseline {
  let controlCadence: OrgRmfBaseline["controlCadence"] = {};
  let stages: OrgRmfBaseline["stages"] = [];
  try {
    controlCadence = JSON.parse(String(r.control_cadence || "{}")) as OrgRmfBaseline["controlCadence"];
  } catch {
    controlCadence = {};
  }
  try {
    stages = JSON.parse(String(r.stages || "[]")) as OrgRmfBaseline["stages"];
  } catch {
    stages = [];
  }
  const cadence = String(r.default_cadence);
  const defaultCadence: OrgRmfBaseline["defaultCadence"] =
    cadence === "continuous" ||
    cadence === "daily" ||
    cadence === "weekly" ||
    cadence === "monthly" ||
    cadence === "quarterly"
      ? cadence
      : "annual";
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    orgName: String(r.org_name),
    statement: String(r.statement),
    riskTolerance: String(r.risk_tolerance),
    securityRequirements: String(r.security_requirements)
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean),
    overlays: String(r.overlays)
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean),
    controlIds: String(r.control_ids)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    defaultCadence,
    cadenceAssumed: r.cadence_assumed === true || r.cadence_assumed === 1 || r.cadence_assumed === "1",
    controlCadence,
    methods: String(r.methods)
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is OrgRmfBaseline["methods"][number] => s === "examine" || s === "interview" || s === "test"),
    kevSloDays: r.kev_slo_days == null || r.kev_slo_days === "" ? null : Number(r.kev_slo_days),
    stages,
    status: r.status === "published" ? "published" : "unofficial",
    updatedAt: String(r.updated_at),
  };
}




