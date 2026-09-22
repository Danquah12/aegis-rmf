import type {
  OrganizationRecord,
  PersonnelRecord,
  PortfolioSnapshot,
  PrepareTask,
  RoleAssignment,
} from "./types";

export const ORG_UNIT_KINDS = [
  "organization",
  "agency",
  "department",
  "component",
  "mission",
  "business_function",
  "risk_executive",
  "security_program",
  "privacy_program",
  "governance",
] as const;

export type OrgUnitKind = (typeof ORG_UNIT_KINDS)[number];

export const ORG_KIND_LABEL: Record<OrgUnitKind, string> = {
  organization: "Organization",
  agency: "Agency",
  department: "Department",
  component: "Component",
  mission: "Mission",
  business_function: "Business Functions",
  risk_executive: "Risk Executive",
  security_program: "Security Program",
  privacy_program: "Privacy Program",
  governance: "Governance",
};

export function isOrgUnitKind(value: unknown): value is OrgUnitKind {
  return typeof value === "string" && (ORG_UNIT_KINDS as readonly string[]).includes(value);
}

export const ORG_UNITS: OrganizationRecord[] = [
  {
    id: "ORG-ROOT",
    name: "Aegis National Mission Agency",
    acronym: "ANMA",
    kind: "organization",
    parentId: null,
    description: "Legal entity that owns the RMF program. SP 800-37 Rev. 2 organization-level Prepare starts here.",
    status: "established",
  },
  {
    id: "ORG-AGENCY",
    name: "Agency — National Mission Systems",
    acronym: "NMS",
    kind: "agency",
    parentId: "ORG-ROOT",
    description: "Head of agency. Sets risk tolerance with the risk executive function and funds the security and privacy programs.",
    status: "established",
  },
  {
    id: "ORG-DEP",
    name: "Department of Cyber and Mission Operations",
    acronym: "DCMO",
    kind: "department",
    parentId: "ORG-AGENCY",
    description: "Line department that hosts mission, enterprise, and CISO components.",
    status: "established",
  },
  {
    id: "ORG-MD",
    name: "Mission Directorate",
    acronym: "MD",
    kind: "component",
    parentId: "ORG-DEP",
    description: "Tactical command and analytics component. Home of Aether and Helios.",
    status: "established",
  },
  {
    id: "ORG-ES",
    name: "Enterprise Services",
    acronym: "ES",
    kind: "component",
    parentId: "ORG-DEP",
    description: "Shared ICAM and common-control provider. Home of Argus.",
    status: "established",
  },
  {
    id: "ORG-CISO",
    name: "Office of the CISO",
    acronym: "CISO",
    kind: "component",
    parentId: "ORG-DEP",
    description: "Security operations component. Home of Vanguard endpoint services.",
    status: "established",
  },
  {
    id: "ORG-MISSION",
    name: "Mission — Tactical command and CUI analytics",
    acronym: "MISSION",
    kind: "mission",
    parentId: "ORG-ROOT",
    description: "Mission/business process that information systems are built to serve. P-8 lives here.",
    status: "established",
  },
  {
    id: "ORG-BF",
    name: "Business Functions",
    acronym: "BF",
    kind: "business_function",
    parentId: "ORG-ROOT",
    description: "ICAM, endpoint, and shared services that other systems inherit.",
    status: "established",
  },
  {
    id: "ORG-RE",
    name: "Risk Executive Function",
    acronym: "RE",
    kind: "risk_executive",
    parentId: "ORG-ROOT",
    description: "Organization-wide risk strategy, appetite, and aggregation. Not a login.",
    status: "established",
  },
  {
    id: "ORG-SEC",
    name: "Security Program",
    acronym: "SEC",
    kind: "security_program",
    parentId: "ORG-ROOT",
    description: "SAISO-owned program. PM-family policy, common controls, and ConMon strategy.",
    status: "established",
  },
  {
    id: "ORG-PRIV",
    name: "Privacy Program",
    acronym: "PRIV",
    kind: "privacy_program",
    parentId: "ORG-ROOT",
    description: "Senior Agency Official for Privacy. PT/PIA overlays and SORN coordination.",
    status: "established",
  },
  {
    id: "ORG-GOV",
    name: "Governance",
    acronym: "GOV",
    kind: "governance",
    parentId: "ORG-ROOT",
    description: "RMF procedure, overlay authority, and architecture review. Publishes policy; does not issue ATOs.",
    status: "established",
  },
];

export const RMF_ACTIONS = [
  { id: "org.prepare", label: "Establish org RMF environment", official: false },
  { id: "org.strategy", label: "Set risk management strategy", official: true },
  { id: "org.program", label: "Run security / privacy program", official: false },
  { id: "system.create", label: "Register an information system", official: false },
  { id: "system.categorize", label: "Categorize (FIPS 199)", official: false },
  { id: "control.select", label: "Select and tailor controls", official: false },
  { id: "control.implement", label: "Implement controls", official: false },
  { id: "package.submit", label: "Submit authorization package", official: false },
  { id: "assessment.plan", label: "Plan assessment (SAP)", official: false },
  { id: "assessment.record", label: "Record 800-53A results", official: false },
  { id: "sar.issue", label: "Issue SAR", official: true },
  { id: "risk.review", label: "Review residual risk", official: false },
  { id: "residual.accept", label: "Accept residual risk", official: true },
  { id: "ato.issue", label: "Issue ATO", official: true },
  { id: "ato.condition", label: "Authorize with conditions", official: true },
  { id: "poam.open", label: "Open POA&M", official: false },
  { id: "poam.close", label: "Close POA&M", official: true },
  { id: "monitor.execute", label: "Run continuous monitoring", official: false },
  { id: "common.provide", label: "Provide common controls", official: false },
  { id: "policy.publish", label: "Publish policy / overlay", official: true },
] as const;

export type RmfActionId = (typeof RMF_ACTIONS)[number]["id"];

export function isRmfActionId(value: unknown): value is RmfActionId {
  return typeof value === "string" && RMF_ACTIONS.some((a) => a.id === value);
}

export const RMF_ROLE_IDS = [
  "ao",
  "aodr",
  "cio",
  "saiso",
  "risk_executive",
  "system_owner",
  "ccp",
  "security_architect",
  "control_assessor",
  "sso",
  "privacy_officer",
  "system_admin",
  "info_owner",
  "enterprise_architect",
  "control_implementer",
  "issm",
] as const;

export type RmfRoleId = (typeof RMF_ROLE_IDS)[number];

export function isRmfRoleId(value: unknown): value is RmfRoleId {
  return typeof value === "string" && (RMF_ROLE_IDS as readonly string[]).includes(value);
}

export interface RmfRole {
  id: RmfRoleId;
  name: string;
  nist: string;
  scope: "organization" | "system" | "both";
  overlay?: string;
  allows: RmfActionId[];
  never: RmfActionId[];
  notes: string;
}

const AO_OFFICIAL: RmfActionId[] = ["ato.issue", "ato.condition", "residual.accept"];

export const RMF_ROLES: RmfRole[] = [
  {
    id: "ao",
    name: "Authorizing Official",
    nist: "Authorizing Official",
    scope: "both",
    allows: [...AO_OFFICIAL, "risk.review", "system.categorize", "org.strategy", "poam.close"],
    never: [],
    notes: "Only the AO issues or conditions an ATO and accepts residual risk. Accountable even when an AODR signs.",
  },
  {
    id: "aodr",
    name: "AO designated representative",
    nist: "Authorizing Official Designated Representative",
    scope: "both",
    allows: [...AO_OFFICIAL, "risk.review", "package.submit"],
    never: [],
    notes: "May carry out AO duties when designated. AO remains accountable. Not an engine actor.",
  },
  {
    id: "cio",
    name: "Chief Information Officer",
    nist: "Chief Information Officer",
    scope: "organization",
    allows: ["org.prepare", "org.strategy", "org.program", "system.create", "policy.publish", "risk.review"],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue"],
    notes: "Funds and oversees the information security program. Does not authorize systems.",
  },
  {
    id: "saiso",
    name: "Senior Agency Information Security Officer",
    nist: "Senior Agency Information Security Officer",
    scope: "organization",
    allows: ["org.prepare", "org.program", "control.select", "risk.review", "policy.publish", "monitor.execute"],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue"],
    notes: "SAISO / CISO analog. Owns the security program and common-control strategy.",
  },
  {
    id: "risk_executive",
    name: "Risk Executive",
    nist: "Risk Executive (Function)",
    scope: "organization",
    allows: ["org.prepare", "org.strategy", "risk.review"],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue", "system.create"],
    notes: "Function, not a login. Sets organization-wide risk strategy. Never issues an ATO.",
  },
  {
    id: "system_owner",
    name: "System Owner",
    nist: "System Owner",
    scope: "system",
    allows: [
      "system.create",
      "system.categorize",
      "package.submit",
      "poam.open",
      "control.implement",
      "monitor.execute",
    ],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue"],
    notes: "Registers the information system after org Prepare is complete. Mission owner, not AO.",
  },
  {
    id: "ccp",
    name: "Common Control Provider",
    nist: "Common Control Provider",
    scope: "organization",
    allows: ["common.provide", "control.implement", "monitor.execute", "poam.open"],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue", "system.create"],
    notes: "Provides inherited controls (ICAM, EDR, facility). Consumers still own customer-responsibility controls.",
  },
  {
    id: "security_architect",
    name: "Security Architect",
    nist: "Security Architect",
    scope: "both",
    allows: ["control.select", "system.categorize", "org.program"],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue"],
    notes: "Allocates controls to architecture. Does not authorize.",
  },
  {
    id: "control_assessor",
    name: "Control Assessor",
    nist: "Control Assessor",
    scope: "system",
    allows: ["assessment.plan", "assessment.record", "sar.issue", "poam.open"],
    never: [...AO_OFFICIAL, "poam.close", "system.create", "package.submit"],
    notes: "Independent SCA. Records unofficial engine recommendations. Issues the SAR. Does not authorize.",
  },
  {
    id: "sso",
    name: "System Security Officer",
    nist: "Information System Security Officer",
    scope: "system",
    allows: [
      "control.implement",
      "package.submit",
      "poam.open",
      "poam.close",
      "monitor.execute",
      "system.categorize",
      "assessment.record",
    ],
    never: [...AO_OFFICIAL, "sar.issue"],
    notes: "ISSO in eMASS terms. Daily operator. May mark a POA&M complete after remediation. Cannot accept residual risk or issue an ATO.",
  },
  {
    id: "privacy_officer",
    name: "Privacy Officer",
    nist: "Senior Agency Official for Privacy",
    scope: "organization",
    allows: ["org.program", "policy.publish", "system.categorize", "control.select"],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue"],
    notes: "Privacy program owner. PIA / SORN. Does not issue an ATO.",
  },
  {
    id: "system_admin",
    name: "System Administrator",
    nist: "System Administrator",
    scope: "system",
    allows: ["control.implement", "monitor.execute", "poam.open"],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue", "package.submit", "system.create"],
    notes: "Operates the system. Implements; does not authorize or submit the package.",
  },
  {
    id: "info_owner",
    name: "Information Owner/Steward",
    nist: "Information Owner/Steward",
    scope: "both",
    allows: ["system.categorize", "control.select", "poam.open"],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue", "system.create"],
    notes: "Owns information types that drive FIPS 199. Not the system owner unless also assigned.",
  },
  {
    id: "enterprise_architect",
    name: "Enterprise Architect",
    nist: "Enterprise Architect",
    scope: "organization",
    allows: ["control.select", "org.prepare", "common.provide"],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue"],
    notes: "Aligns systems to enterprise architecture. Does not authorize.",
  },
  {
    id: "control_implementer",
    name: "Control Implementers",
    nist: "Control Implementer",
    scope: "system",
    allows: ["control.implement", "poam.open", "monitor.execute"],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue", "package.submit", "system.create"],
    notes: "Build the control. Cannot submit the package or authorize.",
  },
  {
    id: "issm",
    name: "Information System Security Manager",
    nist: "Information System Security Manager",
    scope: "both",
    overlay: "eMASS / DoD",
    allows: ["risk.review", "package.submit", "org.program", "poam.open"],
    never: [...AO_OFFICIAL, "poam.close", "sar.issue"],
    notes: "eMASS overlay. Reviews residual risk and routes to the AO. Does not authorize.",
  },
];

export const ENGINE_ACTOR_NEVER: RmfActionId[] = RMF_ACTIONS.filter((a) => a.official).map((a) => a.id);

export function roleById(id: string): RmfRole | undefined {
  return RMF_ROLES.find((r) => r.id === id);
}

export function canPerform(roleId: string, action: RmfActionId): boolean {
  const role = roleById(roleId);
  if (!role) return false;
  if (role.never.includes(action)) return false;
  return role.allows.includes(action);
}

export function whoCan(action: RmfActionId): RmfRole[] {
  return RMF_ROLES.filter((r) => canPerform(r.id, action));
}

export const LEGACY_ROLE_MAP: Record<string, RmfRoleId> = {
  AO: "ao",
  AODR: "aodr",
  ISSO: "sso",
  ISSM: "issm",
  SCA: "control_assessor",
  "System owner": "system_owner",
  "Risk executive": "risk_executive",
  CIO: "cio",
  SAISO: "saiso",
  CISO: "saiso",
  CCP: "ccp",
};

export function roleIdFromLabel(label: string): RmfRoleId | null {
  if (isRmfRoleId(label)) return label;
  return LEGACY_ROLE_MAP[label] ?? null;
}

export const PHASE0_PERSONNEL: PersonnelRecord[] = [
  { id: "PER-13", systemId: "SYS-AETHER", orgId: "ORG-MD", name: "C. Reyes", role: "AODR", title: "AO designated representative, Mission Directorate" },
  { id: "PER-14", systemId: null, orgId: "ORG-AGENCY", name: "W. Lang", role: "CIO", title: "Chief Information Officer, ANMA" },
  { id: "PER-15", systemId: null, orgId: "ORG-SEC", name: "P. Okada", role: "SAISO", title: "Senior Agency Information Security Officer" },
  { id: "PER-16", systemId: "SYS-ARGUS", orgId: "ORG-ES", name: "F. Quinn", role: "CCP", title: "Common Control Provider, Enterprise ICAM" },
  { id: "PER-17", systemId: null, orgId: "ORG-GOV", name: "I. Mendel", role: "Security architect", title: "Security Architect, Governance" },
  { id: "PER-18", systemId: null, orgId: "ORG-PRIV", name: "S. Varela", role: "Privacy officer", title: "Senior Agency Official for Privacy" },
  { id: "PER-19", systemId: "SYS-AETHER", orgId: "ORG-MD", name: "B. Singh", role: "System administrator", title: "System Administrator, Aether-C2" },
  { id: "PER-20", systemId: "SYS-HELIOS", orgId: "ORG-MD", name: "G. Hale", role: "Information owner", title: "Information Owner/Steward, Helios CUI" },
  { id: "PER-21", systemId: null, orgId: "ORG-GOV", name: "M. Duarte", role: "Enterprise architect", title: "Enterprise Architect" },
  { id: "PER-22", systemId: "SYS-AETHER", orgId: "ORG-MD", name: "J. Keene", role: "Control implementer", title: "Control Implementer, Aether platform" },
];

export const ROLE_ASSIGNMENTS: RoleAssignment[] = [
  { id: "RA-01", personId: "PER-04", roleId: "ao", orgId: "ORG-MD", systemId: "SYS-AETHER", notes: "AO, Mission Directorate" },
  { id: "RA-02", personId: "PER-08", roleId: "ao", orgId: "ORG-ES", systemId: "SYS-ARGUS", notes: "AO, Enterprise Services" },
  { id: "RA-03", personId: "PER-13", roleId: "aodr", orgId: "ORG-MD", systemId: "SYS-AETHER", notes: "Designated for Aether; AO remains accountable" },
  { id: "RA-04", personId: "PER-14", roleId: "cio", orgId: "ORG-AGENCY", systemId: null, notes: "Agency CIO" },
  { id: "RA-05", personId: "PER-15", roleId: "saiso", orgId: "ORG-SEC", systemId: null, notes: "Security program owner" },
  { id: "RA-06", personId: "PER-12", roleId: "risk_executive", orgId: "ORG-RE", systemId: null, notes: "Risk executive function" },
  { id: "RA-07", personId: "PER-01", roleId: "system_owner", orgId: "ORG-MD", systemId: "SYS-AETHER", notes: "Aether owner" },
  { id: "RA-08", personId: "PER-06", roleId: "system_owner", orgId: "ORG-ES", systemId: "SYS-ARGUS", notes: "Argus owner" },
  { id: "RA-09", personId: "PER-09", roleId: "system_owner", orgId: "ORG-MD", systemId: "SYS-HELIOS", notes: "Helios owner" },
  { id: "RA-10", personId: "PER-11", roleId: "system_owner", orgId: "ORG-CISO", systemId: "SYS-VANGUARD", notes: "Vanguard owner" },
  { id: "RA-11", personId: "PER-16", roleId: "ccp", orgId: "ORG-ES", systemId: "SYS-ARGUS", notes: "ICAM common controls" },
  { id: "RA-12", personId: "PER-17", roleId: "security_architect", orgId: "ORG-GOV", systemId: null, notes: "Enterprise security architecture" },
  { id: "RA-13", personId: "PER-05", roleId: "control_assessor", orgId: "ORG-CISO", systemId: "SYS-AETHER", notes: "Independent SCA" },
  { id: "RA-14", personId: "PER-02", roleId: "sso", orgId: "ORG-MD", systemId: "SYS-AETHER", notes: "ISSO Aether" },
  { id: "RA-15", personId: "PER-07", roleId: "sso", orgId: "ORG-ES", systemId: "SYS-ARGUS", notes: "ISSO Argus" },
  { id: "RA-16", personId: "PER-10", roleId: "sso", orgId: "ORG-MD", systemId: "SYS-HELIOS", notes: "ISSO Helios" },
  { id: "RA-17", personId: "PER-18", roleId: "privacy_officer", orgId: "ORG-PRIV", systemId: null, notes: "SAOP" },
  { id: "RA-18", personId: "PER-19", roleId: "system_admin", orgId: "ORG-MD", systemId: "SYS-AETHER", notes: "Aether operations" },
  { id: "RA-19", personId: "PER-20", roleId: "info_owner", orgId: "ORG-MD", systemId: "SYS-HELIOS", notes: "CUI steward" },
  { id: "RA-20", personId: "PER-21", roleId: "enterprise_architect", orgId: "ORG-GOV", systemId: null, notes: "Enterprise architecture" },
  { id: "RA-21", personId: "PER-22", roleId: "control_implementer", orgId: "ORG-MD", systemId: "SYS-AETHER", notes: "Platform implementer" },
  { id: "RA-22", personId: "PER-03", roleId: "issm", orgId: "ORG-MD", systemId: "SYS-AETHER", notes: "ISSM routes residual risk to AO" },
];

export const PREPARE_TASKS: PrepareTask[] = [
  {
    id: "P-1",
    orgId: "ORG-ROOT",
    taskId: "P-1",
    title: "Risk management roles",
    status: "established",
    ownerRole: "cio",
    evidence: "Fifteen SP 800-37 roles assigned. ISSM overlay assigned for eMASS routing.",
  },
  {
    id: "P-2",
    orgId: "ORG-RE",
    taskId: "P-2",
    title: "Risk management strategy",
    status: "established",
    ownerRole: "risk_executive",
    evidence: "Agency appetite: High-impact mission systems require AO-C or full ATO. Residual risk is never agent-accepted.",
  },
  {
    id: "P-3",
    orgId: "ORG-RE",
    taskId: "P-3",
    title: "Organization risk assessment",
    status: "established",
    ownerRole: "risk_executive",
    evidence: "Mission, CUI, and identity risk recorded at the organization. Feeds system categorization.",
  },
  {
    id: "P-4",
    orgId: "ORG-SEC",
    taskId: "P-4",
    title: "Organizationally tailored baselines",
    status: "established",
    ownerRole: "saiso",
    evidence: "High + agency + mission + cloud + Zero Trust overlay. Privacy overlay from the privacy program.",
  },
  {
    id: "P-5",
    orgId: "ORG-ES",
    taskId: "P-5",
    title: "Common control identification",
    status: "established",
    ownerRole: "ccp",
    evidence: "Argus ICAM and Vanguard EDR offered as inherited. Customer-responsibility matrix published.",
  },
  {
    id: "P-6",
    orgId: "ORG-AGENCY",
    taskId: "P-6",
    title: "Impact-level prioritization",
    status: "established",
    ownerRole: "cio",
    evidence: "Aether High, Argus Moderate, Helios Moderate CUI, Vanguard High. Prioritization used for assessor scheduling.",
  },
  {
    id: "P-7",
    orgId: "ORG-SEC",
    taskId: "P-7",
    title: "Continuous monitoring strategy — organization",
    status: "established",
    ownerRole: "saiso",
    evidence: "Org ConMon cadence, ISCM metrics, and cATO review path. Strategy is not an ATO.",
  },
];

export interface OrgNode {
  unit: OrganizationRecord;
  children: OrgNode[];
}

export function buildOrgTree(units: OrganizationRecord[]): OrgNode[] {
  const byParent = new Map<string | null, OrganizationRecord[]>();
  for (const u of units) {
    const key = u.parentId;
    const list = byParent.get(key) ?? [];
    list.push(u);
    byParent.set(key, list);
  }
  const walk = (parentId: string | null): OrgNode[] =>
    (byParent.get(parentId) ?? []).map((unit) => ({ unit, children: walk(unit.id) }));
  const roots = walk(null);
  if (roots.length) return roots;
  return units.filter((u) => !units.some((o) => o.id === u.parentId)).map((unit) => ({
    unit,
    children: walk(unit.id),
  }));
}

export function assignedRoleIds(assignments: RoleAssignment[]): Set<string> {
  return new Set(assignments.map((a) => a.roleId));
}

export interface OrgPrepareView {
  units: OrganizationRecord[];
  tree: OrgNode[];
  tasks: PrepareTask[];
  assignments: RoleAssignment[];
  missingKinds: OrgUnitKind[];
  missingRoles: RmfRoleId[];
  openTasks: PrepareTask[];
  unitScore: number;
  roleScore: number;
  taskScore: number;
  overall: number;
  readyForSystems: boolean;
  summary: string;
}

export function buildOrgPrepareView(p: PortfolioSnapshot): OrgPrepareView {
  const units = p.organizations.length >= ORG_UNITS.length ? p.organizations : mergeUnits(p.organizations);
  const tasks = p.prepareTasks.length ? p.prepareTasks : PREPARE_TASKS;
  const assignments = p.roleAssignments.length ? p.roleAssignments : ROLE_ASSIGNMENTS;
  const presentKinds = new Set(units.map((u) => u.kind));
  const missingKinds = ORG_UNIT_KINDS.filter((k) => !presentKinds.has(k));
  const coreRoles = RMF_ROLES.filter((r) => !r.overlay);
  const have = assignedRoleIds(assignments);
  const missingRoles = coreRoles.filter((r) => !have.has(r.id)).map((r) => r.id);
  const openTasks = tasks.filter((t) => t.status !== "established");
  const unitScore = Math.round(((ORG_UNIT_KINDS.length - missingKinds.length) / ORG_UNIT_KINDS.length) * 100);
  const roleScore = Math.round(((coreRoles.length - missingRoles.length) / coreRoles.length) * 100);
  const taskScore = tasks.length
    ? Math.round(((tasks.length - openTasks.length) / tasks.length) * 100)
    : 0;
  const overall = Math.round((unitScore + roleScore + taskScore) / 3);
  const readyForSystems = overall === 100 && missingKinds.length === 0 && missingRoles.length === 0 && openTasks.length === 0;
  const summary = readyForSystems
    ? "Organization Prepare is complete. A system owner may register an information system. The engine still cannot issue an ATO."
    : `Organization Prepare is incomplete — ${missingKinds.length} environment gaps, ${missingRoles.length} unassigned roles, ${openTasks.length} open P-tasks. Do not create a system yet.`;
  return {
    units,
    tree: buildOrgTree(units),
    tasks,
    assignments,
    missingKinds,
    missingRoles,
    openTasks,
    unitScore,
    roleScore,
    taskScore,
    overall,
    readyForSystems,
    summary,
  };
}

function mergeUnits(existing: OrganizationRecord[]): OrganizationRecord[] {
  const byId = new Map(ORG_UNITS.map((u) => [u.id, u]));
  for (const e of existing) {
    const seed = byId.get(e.id);
    byId.set(e.id, {
      ...seed,
      ...e,
      parentId: e.parentId ?? seed?.parentId ?? null,
      description: e.description || seed?.description || "",
      status: e.status || seed?.status || "established",
    });
  }
  return [...byId.values()];
}

export function personForAssignment(
  assignment: RoleAssignment,
  personnel: PersonnelRecord[],
): PersonnelRecord | undefined {
  return personnel.find((p) => p.id === assignment.personId);
}

export function assignmentsForRole(assignments: RoleAssignment[], roleId: string): RoleAssignment[] {
  return assignments.filter((a) => a.roleId === roleId);
}

export function componentUnits(units: OrganizationRecord[]): OrganizationRecord[] {
  return units.filter((u) => u.kind === "component");
}

export const ACTING_STORAGE_KEY = "aegis.actingRole";
export const DEFAULT_ACTING_ROLE: RmfRoleId = "system_owner";
