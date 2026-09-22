export const FAMILIES = [
  "AC",
  "AT",
  "AU",
  "CA",
  "CM",
  "CP",
  "IA",
  "IR",
  "MA",
  "MP",
  "PE",
  "PL",
  "PM",
  "PS",
  "PT",
  "RA",
  "SA",
  "SC",
  "SI",
  "SR",
] as const;

export type ControlFamily = (typeof FAMILIES)[number];
export type Baseline = "low" | "moderate" | "high";
export type AssessmentMethod = "examine" | "interview" | "test";
export type ImpactLevel = "low" | "moderate" | "high";
export type ImplementationStatus =
  | "implemented"
  | "partial"
  | "planned"
  | "not_implemented"
  | "not_applicable"
  | "inherited";
export type AssessmentResult = "satisfied" | "other" | "not_assessed";
export type PoamStatus = "open" | "delayed" | "risk_accepted" | "completed";
export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type AtoStatus =
  | "authorized"
  | "authorized_with_conditions"
  | "in_assessment"
  | "not_authorized"
  | "expired";
export type RmfStep =
  | "prepare"
  | "categorize"
  | "select"
  | "implement"
  | "assess"
  | "authorize"
  | "monitor";

export interface NistControl {
  id: string;
  family: ControlFamily;
  title: string;
  statement: string;
  discussion: string;
  baselines: Baseline[];
  related: string[];
  parameters?: string[];
  methods: AssessmentMethod[];
  evidenceHints: string[];
}

export interface FamilyMeta {
  id: ControlFamily;
  name: string;
  summary: string;
}

export interface SystemExtra {
  users: string;
  components: number;
  interfaces: number;
  baseline: string;
  confidentiality?: ImpactLevel;
  integrity?: ImpactLevel;
  availability?: ImpactLevel;
  overlay?: string;
  packageVersion?: string;
  scaRole?: string;
  issmRole?: string;
  authorizationType?: string;
  orgId?: string;
  programId?: string;
  engineCursor?: RmfStep;
  engineAt?: string;
  businessFunction?: string;
  geographicLocations?: string[];
  applications?: string[];
  infrastructure?: string[];
  dependencies?: string[];
  discoverySources?: string[];
  discoveryAt?: string;
}

export interface SystemRecord {
  id: string;
  name: string;
  acronym: string;
  mission: string;
  impactLevel: ImpactLevel;
  atoStatus: AtoStatus;
  atoExpires: string | null;
  hosting: string;
  cloudProvider: string | null;
  ownerRole: string;
  issoRole: string;
  aoRole: string;
  authorizationBoundary: string;
  dataTypes: string[];
  rmfStep: RmfStep;
  sspDraft: string | null;
  extra: SystemExtra;
}

export interface AssetRecord {
  id: string;
  systemId: string;
  name: string;
  kind: string;
  environment: string;
  criticality: RiskLevel;
  internetExposed: boolean;
}

export interface VulnerabilityRecord {
  id: string;
  systemId: string;
  assetId: string;
  cve: string;
  title: string;
  cvss: number;
  severity: RiskLevel;
  kev: boolean;
  controlIds: string[];
  status: "open" | "mitigated" | "accepted";
}

export interface ImplementationRecord {
  id: string;
  systemId: string;
  controlId: string;
  status: ImplementationStatus;
  result: AssessmentResult;
  statement: string;
  confidence: number;
  lastVerified: string;
  responsible: string;
}

export interface EvidenceRecord {
  id: string;
  systemId: string;
  controlId: string;
  title: string;
  source: string;
  method: string;
  collectedAt: string;
  hash: string;
  classification: string;
  expiresAt: string | null;
  summary: string;
}

export interface FindingRecord {
  id: string;
  systemId: string;
  controlId: string;
  title: string;
  severity: RiskLevel;
  status: "open" | "closed";
  description: string;
  impact: string;
}

export interface PoamRecord {
  id: string;
  systemId: string;
  findingId: string | null;
  controlId: string;
  weakness: string;
  riskLevel: RiskLevel;
  owner: string;
  dueDate: string;
  status: PoamStatus;
  milestones: { date: string; label: string; done: boolean }[];
  resources: string;
  compensating: string | null;
  daysOpen: number;
}

export interface AssessmentRecord {
  id: string;
  systemId: string;
  kind: string;
  status: "draft" | "in_progress" | "complete" | "pending_approval";
  assessor: string;
  startedAt: string;
  completedAt: string | null;
  summary: string;
}

export interface AgentRunRecord {
  id: string;
  agent: string;
  systemId: string | null;
  status: "running" | "complete" | "pending_approval" | "rejected";
  objective: string;
  plan: string;
  tools: string[];
  evidence: string;
  decision: string;
  confidence: number;
  createdAt: string;
  requiresApproval: boolean;
}

export interface AskMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ReadinessBreakdown {
  overall: number;
  evidence: number;
  implementation: number;
  highRisks: number;
  poam: number;
  monitoring: number;
  documentation: number;
}

export type Origination = "system" | "inherited" | "hybrid" | "not_selected";
export type ArtifactKind =
  | "ssp"
  | "sap"
  | "sar"
  | "poam"
  | "cpt"
  | "isa"
  | "pia"
  | "conmon"
  | "ato"
  | "overlay";
export type ArtifactStatus = "missing" | "draft" | "generated" | "approved";
export type WorkflowGateId =
  | "isso_implement"
  | "isso_submit"
  | "sca_assess"
  | "issm_review"
  | "ao_decision"
  | "conmon";

export interface ArtifactRecord {
  id: string;
  systemId: string;
  kind: ArtifactKind;
  title: string;
  status: ArtifactStatus;
  source: string;
  updatedAt: string;
}

export interface WorkflowEventRecord {
  id: string;
  systemId: string;
  gate: WorkflowGateId;
  actor: string;
  action: string;
  notes: string;
  createdAt: string;
}

export interface TestResultRecord {
  id: string;
  systemId: string;
  controlId: string;
  method: AssessmentMethod;
  objective: string;
  result: AssessmentResult;
  comments: string;
  automated: boolean;
}

export interface InterconnectRecord {
  id: string;
  systemId: string;
  partner: string;
  kind: string;
  agreement: string;
  dataFlow: string;
  status: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  acronym: string;
  kind: string;
  parentId: string | null;
  description: string;
  status: "draft" | "established";
}

export interface ProgramRecord {
  id: string;
  orgId: string;
  name: string;
  mission: string;
}

export interface PersonnelRecord {
  id: string;
  systemId: string | null;
  orgId: string;
  name: string;
  role: string;
  title: string;
}

export type OrgPrepareStatus = "draft" | "established" | "missing";

export interface RoleAssignment {
  id: string;
  personId: string;
  roleId: string;
  orgId: string;
  systemId: string | null;
  notes: string;
}

export interface PrepareTask {
  id: string;
  orgId: string;
  taskId: string;
  title: string;
  status: OrgPrepareStatus;
  ownerRole: string;
  evidence: string;
}

export type RiskStatus = "open" | "mitigating" | "accepted" | "closed";

export interface RiskRecord {
  id: string;
  systemId: string;
  title: string;
  threat: string;
  vulnerability: string;
  assetId: string | null;
  controlId: string;
  likelihood: ImpactLevel;
  impact: ImpactLevel;
  riskLevel: RiskLevel;
  mitigation: string;
  residual: RiskLevel;
  owner: string;
  status: RiskStatus;
  acceptanceExpires: string | null;
}

export interface TicketRecord {
  id: string;
  poamId: string | null;
  systemId: string;
  source: string;
  externalId: string;
  title: string;
  status: string;
  assignee: string;
  updatedAt: string;
}

export interface SspSectionRecord {
  id: string;
  systemId: string;
  sectionId: string;
  title: string;
  body: string;
  source: string;
  status: ArtifactStatus;
  updatedAt: string;
}

export interface ObjectiveRecord {
  id: string;
  systemId: string;
  controlId: string;
  objectiveId: string;
  method: AssessmentMethod;
  result: AssessmentResult | "not_applicable";
  comments: string;
  assessor: string;
  updatedAt: string;
}

export interface ConfigChangeRecord {
  id: string;
  systemId: string;
  kind: string;
  summary: string;
  detectedAt: string;
  controls: string[];
  risk: string;
  status: string;
}

export interface AuthHistoryRecord {
  id: string;
  systemId: string;
  decision: string;
  actor: string;
  conditions: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface ConnectorBinding {
  id: string;
  systemId: string;
  connectorId: string;
  status: "enabled" | "disabled";
  runCount: number;
  lastRun: string | null;
  nextRun: string | null;
  lastSummary: string;
}

export interface CollectionJob {
  id: string;
  systemId: string;
  connectorId: string;
  status: "complete" | "failed";
  startedAt: string;
  finishedAt: string;
  evidenceCount: number;
  changeCount: number;
  findingCount: number;
  summary: string;
  mappings: {
    controlId: string;
    objective: string;
    method: string;
    result: string;
    sourceRef: string;
  }[];
}

export type IncidentStatus = "investigating" | "contained" | "poam_opened";
export type ProposalStatus = "proposed" | "accepted" | "rejected";
export type PolicyStatus = "draft" | "published" | "gap";
export type CatoReviewState = "review_required" | "stable" | "reassess" | "hold";

export interface IncidentRecord {
  id: string;
  systemId: string;
  title: string;
  severity: "critical" | "high" | "moderate" | "low";
  status: IncidentStatus;
  summary: string;
  assetId: string | null;
  controlIds: string[];
  atoImpact: string;
  createdAt: string;
}

export interface PolicyRecord {
  id: string;
  title: string;
  status: PolicyStatus;
  body: string;
  controls: string[];
  source: string;
  updatedAt: string;
}

export interface WhatIfRun {
  id: string;
  systemId: string;
  scenario: string;
  result: string;
  atoImpact: string;
  createdAt: string;
}

export interface InterviewRecord {
  id: string;
  systemId: string;
  controlId: string;
  question: string;
  answer: string;
  flag: string | null;
  assessor: string;
  updatedAt: string;
}

export interface InheritanceProposal {
  id: string;
  systemId: string;
  provider: string;
  controlId: string;
  rationale: string;
  status: ProposalStatus;
}

export interface CatoReview {
  id: string;
  systemId: string;
  state: CatoReviewState;
  notes: string;
  actor: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  object: string;
  createdAt: string;
}

export interface AcademyProgress {
  id: string;
  labId: string;
  status: "in_progress" | "complete";
  updatedAt: string;
}

export interface SupportDocument {
  id: string;
  systemId: string;
  rmfStep: RmfStep;
  kind: string;
  title: string;
  body: string;
  controlIds: string[];
  source: string;
  url: string | null;
  status: "draft" | "attached";
  updatedAt: string;
}

export interface OrgArtifactKind {
  id: string;
  canonicalId: string;
  name: string;
  aliases: string;
  required: boolean;
  nistTask: string;
  controlIds: string[];
  ownerRole: string;
  agency: string;
  hint: string;
}

export interface OrgArtifact {
  id: string;
  kindId: string;
  orgId: string;
  title: string;
  body: string;
  controlIds: string[];
  source: string;
  url: string | null;
  status: "draft" | "attached";
  updatedAt: string;
}

export type AssessmentCadence = "continuous" | "daily" | "weekly" | "monthly" | "quarterly" | "annual";

export interface OrgBaselineStage {
  id: string;
  label: string;
  detail: string;
  source: string;
}

export interface OrgRmfBaseline {
  id: string;
  orgId: string;
  orgName: string;
  statement: string;
  riskTolerance: string;
  securityRequirements: string[];
  overlays: string[];
  controlIds: string[];
  defaultCadence: AssessmentCadence;
  cadenceAssumed: boolean;
  controlCadence: Record<string, AssessmentCadence>;
  methods: AssessmentMethod[];
  kevSloDays: number | null;
  stages: OrgBaselineStage[];
  status: "unofficial" | "published";
  updatedAt: string;
}

export interface PortfolioSnapshot {
  systems: SystemRecord[];
  implementations: ImplementationRecord[];
  evidence: EvidenceRecord[];
  findings: FindingRecord[];
  poams: PoamRecord[];
  assessments: AssessmentRecord[];
  agentRuns: AgentRunRecord[];
  assets: AssetRecord[];
  vulnerabilities: VulnerabilityRecord[];
  artifacts: ArtifactRecord[];
  workflowEvents: WorkflowEventRecord[];
  testResults: TestResultRecord[];
  interconnections: InterconnectRecord[];
  organizations: OrganizationRecord[];
  programs: ProgramRecord[];
  personnel: PersonnelRecord[];
  roleAssignments: RoleAssignment[];
  prepareTasks: PrepareTask[];
  risks: RiskRecord[];
  tickets: TicketRecord[];
  sspSections: SspSectionRecord[];
  objectives: ObjectiveRecord[];
  configChanges: ConfigChangeRecord[];
  authorizationHistory: AuthHistoryRecord[];
  connectorBindings: ConnectorBinding[];
  collectionJobs: CollectionJob[];
  incidents: IncidentRecord[];
  policies: PolicyRecord[];
  whatIfRuns: WhatIfRun[];
  interviews: InterviewRecord[];
  inheritanceProposals: InheritanceProposal[];
  catoReviews: CatoReview[];
  auditEvents: AuditEvent[];
  academyProgress: AcademyProgress[];
  supportDocuments: SupportDocument[];
  orgArtifactKinds: OrgArtifactKind[];
  orgArtifacts: OrgArtifact[];
  orgRmfBaselines: OrgRmfBaseline[];
}

