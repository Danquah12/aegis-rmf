import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import {
  SEED_AGENT_RUNS,
  SEED_ASSESSMENTS,
  SEED_ASSETS,
  SEED_EVIDENCE,
  SEED_FINDINGS,
  SEED_POAMS,
  SEED_SYSTEMS,
  SEED_VULNS,
  buildImplementations,
} from "./seed";
import {
  ARTIFACT_KINDS,
  deriveArtifacts,
  deriveInterconnects,
  deriveTestResults,
  deriveWorkflow,
  packageCompleteness,
} from "./package";
import {
  ORGANIZATIONS,
  PERSONNEL,
  PROGRAMS,
  SEED_AUTH_HISTORY,
  SEED_CHANGES,
  SEED_RISKS,
  SEED_TICKETS,
} from "./layer1";
import { connectorByRef, nextRunAt, planAxiom, planCollection, planSuite, seedBindings } from "./collection";
import { fetchAxiomFindings } from "./axiom";
import { AUTO_SCAN_FEEDS, fetchAxiomIac, fetchAxiomSca, prefetchAutoScanCatalogs } from "./axiom-suite";
import { parseAssessmentPayload, sampleSarJson, observationsFor, type IngestObservation } from "./assessment-ingest";
import {
  ENGINE_STEPS,
  nextEngineCursor,
  planArtifacts,
  planEvidence,
  planSsp,
  rmfAfter,
  stepSummary,
} from "./engine";
import { compareSupportDocs, parseControlIds, SUPPORT_DOC_SEED } from "./support-docs";
import { coverMatrix, matrixSummary, phaseForStep } from "./matrix";
import { discoverInventory, extraFromDiscovery, type DiscoveryDraft } from "./discovery";
import { comparePhase0Artifacts, PHASE0_ARTIFACT_SEED, PHASE0_KIND_SEED, activeOrgBaseline, buildOrgRmfBaseline, cadenceChecks } from "./phase0-artifacts";
import { buildOrchestratorView, formatOrchSummary } from "./orchestrator";
import {
  ORG_UNITS,
  PHASE0_PERSONNEL,
  ROLE_ASSIGNMENTS,
  PREPARE_TASKS,
  buildOrgPrepareView,
  canPerform,
  isRmfRoleId,
  roleById,
  type RmfActionId,
} from "./phase0";
import {
  INCIDENT_SEED,
  INHERITANCE_SEED,
  POLICY_SEED,
} from "./layer3";
import {
  rowAgent,
  rowArtifact,
  rowAssessment,
  rowAsset,
  rowAuthHistory,
  rowChange,
  rowEvidence,
  rowFinding,
  rowImpl,
  rowInterconnect,
  rowObjective,
  rowOrg,
  rowPersonnel,
  rowPoam,
  rowPrepareTask,
  rowProgram,
  rowRisk,
  rowRoleAssignment,
  rowSspSection,
  rowSystem,
  rowTest,
  rowTicket,
  rowVuln,
  rowWorkflow,
  rowBinding,
  rowJob,
  rowIncident,
  rowPolicy,
  rowWhatIf,
  rowInterview,
  rowProposal,
  rowCato,
  rowAudit,
  rowAcademy,
  rowSupportDoc,
  rowOrgArtifactKind,
  rowOrgArtifact,
  rowOrgRmfBaseline,
} from "./serialize";
import type { AtoStatus, CatoReviewState, PortfolioSnapshot, RmfStep, WorkflowGateId } from "./types";

let seedLock: Promise<void> | null = null;

async function ensureSeeded() {
  if (!seedLock) {
    seedLock = (async () => {
      const sql = await getSql();
      const existing = await sql<{ n: number }>`select count(*)::int as n from systems`;
      if ((existing[0]?.n ?? 0) > 0) return;

      for (const s of SEED_SYSTEMS) {
        await sql`
          insert into systems (
            id, name, acronym, mission, impact_level, ato_status, ato_expires,
            hosting, cloud_provider, owner_role, isso_role, ao_role,
            authorization_boundary, data_types, rmf_step, ssp_draft, extra
          ) values (
            ${s.id}, ${s.name}, ${s.acronym}, ${s.mission}, ${s.impactLevel},
            ${s.atoStatus}, ${s.atoExpires}, ${s.hosting}, ${s.cloudProvider},
            ${s.ownerRole}, ${s.issoRole}, ${s.aoRole}, ${s.authorizationBoundary},
            ${JSON.stringify(s.dataTypes)}, ${s.rmfStep}, ${s.sspDraft},
            ${JSON.stringify(s.extra)}
          ) on conflict (id) do nothing
        `;
      }
      for (const a of SEED_ASSETS) {
        await sql`
          insert into assets (id, system_id, name, kind, environment, criticality, internet_exposed)
          values (${a.id}, ${a.systemId}, ${a.name}, ${a.kind}, ${a.environment}, ${a.criticality}, ${a.internetExposed})
          on conflict (id) do nothing
        `;
      }
      for (const v of SEED_VULNS) {
        await sql`
          insert into vulnerabilities (id, system_id, asset_id, cve, title, cvss, severity, kev, control_ids, status)
          values (${v.id}, ${v.systemId}, ${v.assetId}, ${v.cve}, ${v.title}, ${v.cvss}, ${v.severity}, ${v.kev}, ${JSON.stringify(v.controlIds)}, ${v.status})
          on conflict (id) do nothing
        `;
      }
      for (const i of buildImplementations()) {
        await sql`
          insert into implementations (id, system_id, control_id, status, result, statement, confidence, last_verified, responsible)
          values (${i.id}, ${i.systemId}, ${i.controlId}, ${i.status}, ${i.result}, ${i.statement}, ${i.confidence}, ${i.lastVerified}, ${i.responsible})
          on conflict (id) do nothing
        `;
      }
      for (const e of SEED_EVIDENCE) {
        await sql`
          insert into evidence (id, system_id, control_id, title, source, method, collected_at, hash, classification, expires_at, summary)
          values (${e.id}, ${e.systemId}, ${e.controlId}, ${e.title}, ${e.source}, ${e.method}, ${e.collectedAt}, ${e.hash}, ${e.classification}, ${e.expiresAt}, ${e.summary})
          on conflict (id) do nothing
        `;
      }
      for (const f of SEED_FINDINGS) {
        await sql`
          insert into findings (id, system_id, control_id, title, severity, status, description, impact)
          values (${f.id}, ${f.systemId}, ${f.controlId}, ${f.title}, ${f.severity}, ${f.status}, ${f.description}, ${f.impact})
          on conflict (id) do nothing
        `;
      }
      for (const p of SEED_POAMS) {
        await sql`
          insert into poams (id, system_id, finding_id, control_id, weakness, risk_level, owner, due_date, status, milestones, resources, compensating, days_open)
          values (${p.id}, ${p.systemId}, ${p.findingId}, ${p.controlId}, ${p.weakness}, ${p.riskLevel}, ${p.owner}, ${p.dueDate}, ${p.status}, ${JSON.stringify(p.milestones)}, ${p.resources}, ${p.compensating}, ${p.daysOpen})
          on conflict (id) do nothing
        `;
      }
      for (const a of SEED_ASSESSMENTS) {
        await sql`
          insert into assessments (id, system_id, kind, status, assessor, started_at, completed_at, summary)
          values (${a.id}, ${a.systemId}, ${a.kind}, ${a.status}, ${a.assessor}, ${a.startedAt}, ${a.completedAt}, ${a.summary})
          on conflict (id) do nothing
        `;
      }
      for (const r of SEED_AGENT_RUNS) {
        await sql`
          insert into agent_runs (id, agent, system_id, status, objective, plan, tools, evidence, decision, confidence, created_at, requires_approval)
          values (${r.id}, ${r.agent}, ${r.systemId}, ${r.status}, ${r.objective}, ${r.plan}, ${JSON.stringify(r.tools)}, ${r.evidence}, ${r.decision}, ${r.confidence}, ${r.createdAt}, ${r.requiresApproval})
          on conflict (id) do nothing
        `;
      }
    })().catch((err) => {
      seedLock = null;
      throw err;
    });
  }
  return seedLock;
}

async function ensurePackageSeeded() {
  const sql = await getSql();
  await sql.query(`create table if not exists package_artifacts (
      id text primary key,
      system_id text not null,
      kind text not null,
      title text not null,
      status text not null,
      source text not null,
      updated_at date not null
    )`);
  await sql.query(`create table if not exists workflow_events (
      id text primary key,
      system_id text not null,
      gate text not null,
      actor text not null,
      action text not null,
      notes text not null,
      created_at timestamptz not null default now()
    )`);
  await sql.query(`create table if not exists test_results (
      id text primary key,
      system_id text not null,
      control_id text not null,
      method text not null,
      objective text not null,
      result text not null,
      comments text not null,
      automated boolean not null default false
    )`);
  await sql.query(`create table if not exists interconnections (
      id text primary key,
      system_id text not null,
      partner text not null,
      kind text not null,
      agreement text not null,
      data_flow text not null,
      status text not null
    )`);

  const extras = await sql<{ id: string; extra: string }>`select id, extra from systems`;
  for (const row of extras) {
    const seed = SEED_SYSTEMS.find((s) => s.id === row.id);
    if (!seed) continue;
    let extra: Record<string, unknown> = {};
    try {
      extra = JSON.parse(String(row.extra || "{}")) as Record<string, unknown>;
    } catch {
      extra = {};
    }
    const merged = { ...seed.extra, ...extra };
    if (JSON.stringify(merged) === JSON.stringify(extra)) continue;
    await sql`update systems set extra = ${JSON.stringify(merged)} where id = ${row.id}`;
  }

  const existing = await sql<{ n: number }>`select count(*)::int as n from package_artifacts`;
  if ((existing[0]?.n ?? 0) > 0) return;

  const snap: PortfolioSnapshot = {
    systems: SEED_SYSTEMS,
    implementations: buildImplementations(),
    evidence: SEED_EVIDENCE,
    findings: SEED_FINDINGS,
    poams: SEED_POAMS,
    assessments: SEED_ASSESSMENTS,
    agentRuns: SEED_AGENT_RUNS,
    assets: SEED_ASSETS,
    vulnerabilities: SEED_VULNS,
    artifacts: [],
    workflowEvents: [],
    testResults: [],
    interconnections: [],
    organizations: ORGANIZATIONS,
    programs: PROGRAMS,
    personnel: PERSONNEL,
    roleAssignments: ROLE_ASSIGNMENTS,
    prepareTasks: PREPARE_TASKS,
    risks: SEED_RISKS,
    tickets: SEED_TICKETS,
    sspSections: [],
    objectives: [],
    configChanges: SEED_CHANGES,
    authorizationHistory: SEED_AUTH_HISTORY,
    connectorBindings: seedBindings(),
    collectionJobs: [],
    incidents: [],
    policies: [],
    whatIfRuns: [],
    interviews: [],
    inheritanceProposals: [],
    catoReviews: [],
    auditEvents: [],
    academyProgress: [],
    supportDocuments: [],
    orgArtifactKinds: [],
    orgArtifacts: [],
    orgRmfBaselines: [],
  };

  for (const system of SEED_SYSTEMS) {
    for (const a of deriveArtifacts(snap, system.id)) {
      await sql`
        insert into package_artifacts (id, system_id, kind, title, status, source, updated_at)
        values (${a.id}, ${a.systemId}, ${a.kind}, ${a.title}, ${a.status}, ${a.source}, ${a.updatedAt})
        on conflict (id) do nothing
      `;
    }
    for (const e of deriveWorkflow(system)) {
      await sql`
        insert into workflow_events (id, system_id, gate, actor, action, notes, created_at)
        values (${e.id}, ${e.systemId}, ${e.gate}, ${e.actor}, ${e.action}, ${e.notes}, ${e.createdAt})
        on conflict (id) do nothing
      `;
    }
    for (const i of deriveInterconnects(system)) {
      await sql`
        insert into interconnections (id, system_id, partner, kind, agreement, data_flow, status)
        values (${i.id}, ${i.systemId}, ${i.partner}, ${i.kind}, ${i.agreement}, ${i.dataFlow}, ${i.status})
        on conflict (id) do nothing
      `;
    }
    const tests = deriveTestResults(snap, system.id).filter(
      (t) => t.result !== "not_assessed" || t.automated,
    );
    for (const t of tests) {
      await sql`
        insert into test_results (id, system_id, control_id, method, objective, result, comments, automated)
        values (${t.id}, ${t.systemId}, ${t.controlId}, ${t.method}, ${t.objective}, ${t.result}, ${t.comments}, ${t.automated})
        on conflict (id) do nothing
      `;
    }
  }
}

async function ensureLayer1Seeded() {
  const sql = await getSql();
  await sql.query(`create table if not exists organizations (
      id text primary key, name text not null, acronym text not null, kind text not null)`);
  await sql.query(`create table if not exists programs (
      id text primary key, org_id text not null, name text not null, mission text not null)`);
  await sql.query(`create table if not exists personnel (
      id text primary key, system_id text, org_id text not null, name text not null, role text not null, title text not null)`);
  await sql.query(`create table if not exists risks (
      id text primary key, system_id text not null, title text not null, threat text not null, vulnerability text not null,
      asset_id text, control_id text not null, likelihood text not null, impact text not null, risk_level text not null,
      mitigation text not null, residual text not null, owner text not null, status text not null, acceptance_expires date)`);
  await sql.query(`create table if not exists tickets (
      id text primary key, poam_id text, system_id text not null, source text not null, external_id text not null,
      title text not null, status text not null, assignee text not null, updated_at date not null)`);
  await sql.query(`create table if not exists ssp_sections (
      id text primary key, system_id text not null, section_id text not null, title text not null, body text not null,
      source text not null, status text not null, updated_at date not null)`);
  await sql.query(`create table if not exists assessment_objectives (
      id text primary key, system_id text not null, control_id text not null, objective_id text not null, method text not null,
      result text not null, comments text not null, assessor text not null, updated_at date not null)`);
  await sql.query(`create table if not exists config_changes (
      id text primary key, system_id text not null, kind text not null, summary text not null, detected_at timestamptz not null,
      controls text not null, risk text not null, status text not null)`);
  await sql.query(`create table if not exists authorization_history (
      id text primary key, system_id text not null, decision text not null, actor text not null, conditions text not null,
      expires_at date, created_at timestamptz not null default now())`);

  const existing = await sql<{ n: number }>`select count(*)::int as n from organizations`;
  if ((existing[0]?.n ?? 0) > 0) return;

  for (const o of ORGANIZATIONS) {
    await sql`insert into organizations (id, name, acronym, kind) values (${o.id}, ${o.name}, ${o.acronym}, ${o.kind}) on conflict (id) do nothing`;
  }
  for (const p of PROGRAMS) {
    await sql`insert into programs (id, org_id, name, mission) values (${p.id}, ${p.orgId}, ${p.name}, ${p.mission}) on conflict (id) do nothing`;
  }
  for (const p of PERSONNEL) {
    await sql`insert into personnel (id, system_id, org_id, name, role, title) values (${p.id}, ${p.systemId}, ${p.orgId}, ${p.name}, ${p.role}, ${p.title}) on conflict (id) do nothing`;
  }
  for (const r of SEED_RISKS) {
    await sql`insert into risks (id, system_id, title, threat, vulnerability, asset_id, control_id, likelihood, impact, risk_level, mitigation, residual, owner, status, acceptance_expires)
      values (${r.id}, ${r.systemId}, ${r.title}, ${r.threat}, ${r.vulnerability}, ${r.assetId}, ${r.controlId}, ${r.likelihood}, ${r.impact}, ${r.riskLevel}, ${r.mitigation}, ${r.residual}, ${r.owner}, ${r.status}, ${r.acceptanceExpires})
      on conflict (id) do nothing`;
  }
  for (const t of SEED_TICKETS) {
    await sql`insert into tickets (id, poam_id, system_id, source, external_id, title, status, assignee, updated_at)
      values (${t.id}, ${t.poamId}, ${t.systemId}, ${t.source}, ${t.externalId}, ${t.title}, ${t.status}, ${t.assignee}, ${t.updatedAt})
      on conflict (id) do nothing`;
  }
  for (const c of SEED_CHANGES) {
    await sql`insert into config_changes (id, system_id, kind, summary, detected_at, controls, risk, status)
      values (${c.id}, ${c.systemId}, ${c.kind}, ${c.summary}, ${c.detectedAt}, ${JSON.stringify(c.controls)}, ${c.risk}, ${c.status})
      on conflict (id) do nothing`;
  }
  for (const a of SEED_AUTH_HISTORY) {
    await sql`insert into authorization_history (id, system_id, decision, actor, conditions, expires_at, created_at)
      values (${a.id}, ${a.systemId}, ${a.decision}, ${a.actor}, ${a.conditions}, ${a.expiresAt}, ${a.createdAt})
      on conflict (id) do nothing`;
  }
}

async function ensurePhase0Seeded() {
  const sql = await getSql();
  await sql.query(`alter table organizations add column if not exists parent_id text`);
  await sql.query(`alter table organizations add column if not exists description text not null default ''`);
  await sql.query(`alter table organizations add column if not exists status text not null default 'established'`);
  await sql.query(`create table if not exists role_assignments (
      id text primary key, person_id text not null, role_id text not null, org_id text not null,
      system_id text, notes text not null default '')`);
  await sql.query(`create table if not exists org_prepare_tasks (
      id text primary key, org_id text not null, task_id text not null, title text not null,
      status text not null, owner_role text not null, evidence text not null)`);

  for (const o of ORG_UNITS) {
    await sql`
      insert into organizations (id, name, acronym, kind, parent_id, description, status)
      values (${o.id}, ${o.name}, ${o.acronym}, ${o.kind}, ${o.parentId}, ${o.description}, ${o.status})
      on conflict (id) do update set
        name = excluded.name,
        acronym = excluded.acronym,
        kind = excluded.kind,
        parent_id = excluded.parent_id,
        description = excluded.description,
        status = excluded.status
    `;
  }
  for (const p of PHASE0_PERSONNEL) {
    await sql`
      insert into personnel (id, system_id, org_id, name, role, title)
      values (${p.id}, ${p.systemId}, ${p.orgId}, ${p.name}, ${p.role}, ${p.title})
      on conflict (id) do nothing
    `;
  }
  for (const a of ROLE_ASSIGNMENTS) {
    await sql`
      insert into role_assignments (id, person_id, role_id, org_id, system_id, notes)
      values (${a.id}, ${a.personId}, ${a.roleId}, ${a.orgId}, ${a.systemId}, ${a.notes})
      on conflict (id) do nothing
    `;
  }
  for (const t of PREPARE_TASKS) {
    await sql`
      insert into org_prepare_tasks (id, org_id, task_id, title, status, owner_role, evidence)
      values (${t.id}, ${t.orgId}, ${t.taskId}, ${t.title}, ${t.status}, ${t.ownerRole}, ${t.evidence})
      on conflict (id) do nothing
    `;
  }
}

async function ensurePhase0ArtifactsSeeded() {
  const sql = await getSql();
  await sql.query(`create table if not exists org_artifact_kinds (
      id text primary key, canonical_id text not null, name text not null, aliases text not null default '',
      required integer not null default 1, nist_task text not null, control_ids text not null,
      owner_role text not null, agency text not null, hint text not null default '')`);
  await sql.query(`create table if not exists org_artifacts (
      id text primary key, kind_id text not null, org_id text not null, title text not null, body text not null,
      control_ids text not null, source text not null, url text, status text not null, updated_at timestamptz not null)`);
  const existingKinds = await sql<{ n: number }>`select count(*)::int as n from org_artifact_kinds`;
  if ((existingKinds[0]?.n ?? 0) === 0) {
    for (const k of PHASE0_KIND_SEED) {
      await sql`insert into org_artifact_kinds (id, canonical_id, name, aliases, required, nist_task, control_ids, owner_role, agency, hint)
        values (${k.id}, ${k.canonicalId}, ${k.name}, ${k.aliases}, ${k.required ? 1 : 0}, ${k.nistTask}, ${k.controlIds.join(",")}, ${k.ownerRole}, ${k.agency}, ${k.hint})
        on conflict (id) do nothing`;
    }
  }
  const existingArts = await sql<{ n: number }>`select count(*)::int as n from org_artifacts`;
  if ((existingArts[0]?.n ?? 0) === 0) {
    for (const a of PHASE0_ARTIFACT_SEED) {
      await sql`insert into org_artifacts (id, kind_id, org_id, title, body, control_ids, source, url, status, updated_at)
        values (${a.id}, ${a.kindId}, ${a.orgId}, ${a.title}, ${a.body}, ${a.controlIds.join(",")}, ${a.source}, ${a.url}, ${a.status}, ${a.updatedAt})
        on conflict (id) do nothing`;
    }
  }
  const cms = PHASE0_ARTIFACT_SEED.find((a) => a.id === "OA-CMS");
  if (cms) {
    await sql`update org_artifacts set body = ${cms.body}, control_ids = ${cms.controlIds.join(",")} where id = ${"OA-CMS"}`;
  }

  await sql.query(`create table if not exists org_rmf_baselines (
      id text primary key, org_id text not null, org_name text not null, statement text not null,
      risk_tolerance text not null, security_requirements text not null, overlays text not null,
      control_ids text not null, default_cadence text not null, cadence_assumed integer not null default 0,
      control_cadence text not null, methods text not null, kev_slo_days integer, stages text not null,
      status text not null, updated_at timestamptz not null)`);
  const published = await sql<{ id: string }>`select id from org_rmf_baselines where status = ${"published"}`;
  if (published.length === 0) {
    const [orgRows, kindRows, artRows] = await Promise.all([
      sql`select * from organizations`,
      sql`select * from org_artifact_kinds`,
      sql`select * from org_artifacts`,
    ]);
    const built = buildOrgRmfBaseline({
      organizations: orgRows.length ? orgRows.map(rowOrg) : ORG_UNITS,
      orgArtifactKinds: kindRows.length ? kindRows.map(rowOrgArtifactKind) : PHASE0_KIND_SEED,
      orgArtifacts: artRows.length ? artRows.map(rowOrgArtifact) : PHASE0_ARTIFACT_SEED,
      policies: POLICY_SEED.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        body: p.body,
        controls: p.controls.split(",").map((s) => s.trim()).filter(Boolean),
        source: p.source,
        updatedAt: p.updatedAt,
      })),
    });
    await persistOrgBaseline(sql, built);
  }
}

async function persistOrgBaseline(sql: Sql, bl: import("./types").OrgRmfBaseline) {
  await sql`insert into org_rmf_baselines (
      id, org_id, org_name, statement, risk_tolerance, security_requirements, overlays, control_ids,
      default_cadence, cadence_assumed, control_cadence, methods, kev_slo_days, stages, status, updated_at)
    values (
      ${bl.id}, ${bl.orgId}, ${bl.orgName}, ${bl.statement}, ${bl.riskTolerance},
      ${bl.securityRequirements.join(" | ")}, ${bl.overlays.join(" | ")}, ${bl.controlIds.join(",")},
      ${bl.defaultCadence}, ${bl.cadenceAssumed ? 1 : 0}, ${JSON.stringify(bl.controlCadence)},
      ${bl.methods.join(",")}, ${bl.kevSloDays}, ${JSON.stringify(bl.stages)}, ${bl.status}, ${bl.updatedAt})
    on conflict (id) do update set
      statement = excluded.statement, risk_tolerance = excluded.risk_tolerance,
      security_requirements = excluded.security_requirements, overlays = excluded.overlays,
      control_ids = excluded.control_ids, default_cadence = excluded.default_cadence,
      cadence_assumed = excluded.cadence_assumed, control_cadence = excluded.control_cadence,
      methods = excluded.methods, kev_slo_days = excluded.kev_slo_days, stages = excluded.stages,
      status = excluded.status, updated_at = excluded.updated_at, org_name = excluded.org_name`;
}

async function ensureCollectionSeeded() {
  const sql = await getSql();
  await sql.query(`create table if not exists connector_bindings (
      id text primary key, system_id text not null, connector_id text not null, status text not null,
      run_count integer not null default 0, last_run timestamptz, next_run timestamptz, last_summary text not null default '',
      unique (system_id, connector_id))`);
  await sql.query(`create table if not exists collection_jobs (
      id text primary key, system_id text not null, connector_id text not null, status text not null,
      started_at timestamptz not null, finished_at timestamptz not null, evidence_count integer not null default 0,
      change_count integer not null default 0, finding_count integer not null default 0, summary text not null, mappings text not null)`);
  const existing = await sql<{ n: number }>`select count(*)::int as n from connector_bindings`;
  if ((existing[0]?.n ?? 0) === 0) {
    for (const b of seedBindings()) {
      await sql`insert into connector_bindings (id, system_id, connector_id, status, run_count, last_run, next_run, last_summary)
        values (${b.id}, ${b.systemId}, ${b.connectorId}, ${b.status}, ${b.runCount}, ${b.lastRun}, ${b.nextRun}, ${b.lastSummary})
        on conflict (id) do nothing`;
    }
    return;
  }
  for (const b of seedBindings()) {
    await sql`insert into connector_bindings (id, system_id, connector_id, status, run_count, last_run, next_run, last_summary)
      values (${b.id}, ${b.systemId}, ${b.connectorId}, ${b.status}, ${b.runCount}, ${b.lastRun}, ${b.nextRun}, ${b.lastSummary})
      on conflict (id) do nothing`;
  }
}

async function ensureLayer3Seeded() {
  const sql = await getSql();
  await sql.query(`create table if not exists incidents (
      id text primary key, system_id text not null, title text not null, severity text not null,
      status text not null, summary text not null, asset_id text, control_ids text not null,
      ato_impact text not null, created_at timestamptz not null)`);
  await sql.query(`create table if not exists policies (
      id text primary key, title text not null, status text not null, body text not null,
      controls text not null, source text not null, updated_at date not null)`);
  await sql.query(`create table if not exists whatif_runs (
      id text primary key, system_id text not null, scenario text not null, result text not null,
      ato_impact text not null, created_at timestamptz not null)`);
  await sql.query(`create table if not exists interviews (
      id text primary key, system_id text not null, control_id text not null, question text not null,
      answer text not null, flag text, assessor text not null, updated_at timestamptz not null)`);
  await sql.query(`create table if not exists inheritance_proposals (
      id text primary key, system_id text not null, provider text not null, control_id text not null,
      rationale text not null, status text not null)`);
  await sql.query(`create table if not exists cato_reviews (
      id text primary key, system_id text not null, state text not null, notes text not null,
      actor text not null, created_at timestamptz not null)`);
  await sql.query(`create table if not exists audit_events (
      id text primary key, actor text not null, action text not null, object text not null,
      created_at timestamptz not null)`);
  await sql.query(`create table if not exists academy_progress (
      id text primary key, lab_id text not null, status text not null, updated_at timestamptz not null)`);

  const existing = await sql<{ n: number }>`select count(*)::int as n from incidents`;
  if ((existing[0]?.n ?? 0) > 0) return;
  for (const i of INCIDENT_SEED) {
    await sql`insert into incidents (id, system_id, title, severity, status, summary, asset_id, control_ids, ato_impact, created_at)
      values (${i.id}, ${i.systemId}, ${i.title}, ${i.severity}, ${i.status}, ${i.summary}, ${i.assetId}, ${i.controlIds}, ${i.atoImpact}, ${i.createdAt})
      on conflict (id) do nothing`;
  }
  for (const p of POLICY_SEED) {
    await sql`insert into policies (id, title, status, body, controls, source, updated_at)
      values (${p.id}, ${p.title}, ${p.status}, ${p.body}, ${p.controls}, ${p.source}, ${p.updatedAt})
      on conflict (id) do nothing`;
  }
  for (const p of INHERITANCE_SEED) {
    await sql`insert into inheritance_proposals (id, system_id, provider, control_id, rationale, status)
      values (${p.id}, ${p.systemId}, ${p.provider}, ${p.controlId}, ${p.rationale}, ${p.status})
      on conflict (id) do nothing`;
  }
  await logAudit(sql, "System", "Layer 3 seed", "incidents/policies/inheritance");
}

async function ensureSupportDocsSeeded() {
  const sql = await getSql();
  await sql.query(`create table if not exists support_documents (
      id text primary key, system_id text not null, rmf_step text not null, kind text not null,
      title text not null, body text not null, control_ids text not null, source text not null,
      url text, status text not null, updated_at timestamptz not null)`);
  const existing = await sql<{ n: number }>`select count(*)::int as n from support_documents`;
  if ((existing[0]?.n ?? 0) > 0) return;
  for (const d of SUPPORT_DOC_SEED) {
    await sql`insert into support_documents (id, system_id, rmf_step, kind, title, body, control_ids, source, url, status, updated_at)
      values (${d.id}, ${d.systemId}, ${d.rmfStep}, ${d.kind}, ${d.title}, ${d.body}, ${d.controlIds.join(",")}, ${d.source}, ${d.url}, ${d.status}, ${d.updatedAt})
      on conflict (id) do nothing`;
  }
}

export const getPortfolio = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortfolioSnapshot> => {
    await ensureSeeded();
    await ensurePackageSeeded();
    await ensureLayer1Seeded();
    await ensurePhase0Seeded();
    await ensurePhase0ArtifactsSeeded();
    await ensureCollectionSeeded();
    await ensureLayer3Seeded();
    await ensureSupportDocsSeeded();
    const sql = await getSql();
    const [systems, implementations, evidence, findings, poams, assessments, agentRuns, assets, vulnerabilities, artifacts, workflowEvents, testResults, interconnections, organizations, programs, personnel, roleAssignments, prepareTasks, risks, tickets, sspSections, objectives, configChanges, authorizationHistory, connectorBindings, collectionJobs, incidents, policies, whatIfRuns, interviews, inheritanceProposals, catoReviews, auditEvents, academyProgress, supportDocuments, orgArtifactKinds, orgArtifacts, orgRmfBaselines] =
      await Promise.all([
        sql`select * from systems order by acronym`,
        sql`select * from implementations`,
        sql`select * from evidence order by collected_at desc`,
        sql`select * from findings`,
        sql`select * from poams order by days_open desc`,
        sql`select * from assessments order by started_at desc`,
        sql`select * from agent_runs order by created_at desc`,
        sql`select * from assets`,
        sql`select * from vulnerabilities`,
        sql`select * from package_artifacts`,
        sql`select * from workflow_events order by created_at asc`,
        sql`select * from test_results`,
        sql`select * from interconnections`,
        sql`select * from organizations`,
        sql`select * from programs`,
        sql`select * from personnel`,
        sql`select * from role_assignments`,
        sql`select * from org_prepare_tasks`,
        sql`select * from risks`,
        sql`select * from tickets`,
        sql`select * from ssp_sections`,
        sql`select * from assessment_objectives`,
        sql`select * from config_changes order by detected_at desc`,
        sql`select * from authorization_history order by created_at desc`,
        sql`select * from connector_bindings order by system_id, connector_id`,
        sql`select * from collection_jobs order by started_at desc`,
        sql`select * from incidents order by created_at desc`,
        sql`select * from policies order by updated_at desc`,
        sql`select * from whatif_runs order by created_at desc`,
        sql`select * from interviews order by updated_at desc`,
        sql`select * from inheritance_proposals`,
        sql`select * from cato_reviews order by created_at desc`,
        sql`select * from audit_events order by created_at desc`,
        sql`select * from academy_progress`,
        sql`select * from support_documents order by rmf_step, title`,
        sql`select * from org_artifact_kinds order by name`,
        sql`select * from org_artifacts order by title`,
        sql`select * from org_rmf_baselines order by updated_at desc`,
      ]);
    return {
      systems: systems.map(rowSystem),
      implementations: implementations.map(rowImpl),
      evidence: evidence.map(rowEvidence),
      findings: findings.map(rowFinding),
      poams: poams.map(rowPoam),
      assessments: assessments.map(rowAssessment),
      agentRuns: agentRuns.map(rowAgent),
      assets: assets.map(rowAsset),
      vulnerabilities: vulnerabilities.map(rowVuln),
      artifacts: artifacts.map(rowArtifact),
      workflowEvents: workflowEvents.map(rowWorkflow),
      testResults: testResults.map(rowTest),
      interconnections: interconnections.map(rowInterconnect),
      organizations: organizations.map(rowOrg),
      programs: programs.map(rowProgram),
      personnel: personnel.map(rowPersonnel),
      roleAssignments: roleAssignments.map(rowRoleAssignment),
      prepareTasks: prepareTasks.map(rowPrepareTask),
      risks: risks.map(rowRisk),
      tickets: tickets.map(rowTicket),
      sspSections: sspSections.map(rowSspSection),
      objectives: objectives.map(rowObjective),
      configChanges: configChanges.map(rowChange),
      authorizationHistory: authorizationHistory.map(rowAuthHistory),
      connectorBindings: connectorBindings.map(rowBinding),
      collectionJobs: collectionJobs.map(rowJob),
      incidents: incidents.map(rowIncident),
      policies: policies.map(rowPolicy),
      whatIfRuns: whatIfRuns.map(rowWhatIf),
      interviews: interviews.map(rowInterview),
      inheritanceProposals: inheritanceProposals.map(rowProposal),
      catoReviews: catoReviews.map(rowCato),
      auditEvents: auditEvents.map(rowAudit),
      academyProgress: academyProgress.map(rowAcademy),
      supportDocuments: supportDocuments.map(rowSupportDoc),
      orgArtifactKinds: orgArtifactKinds.map(rowOrgArtifactKind),
      orgArtifacts: orgArtifacts.map(rowOrgArtifact),
      orgRmfBaselines: orgRmfBaselines.map(rowOrgRmfBaseline),
    };
  },
);

export const updatePoamStatus = createServerFn({ method: "POST" })
  .validator((input: { id: string; status: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    await sql`update poams set status = ${data.status} where id = ${data.id}`;
    return { ok: true as const };
  });

export const approveAgentRun = createServerFn({ method: "POST" })
  .validator((input: { id: string; approve: boolean }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    await sql`update agent_runs set status = ${data.approve ? "complete" : "rejected"} where id = ${data.id}`;
    return { ok: true as const };
  });

export const saveSspDraft = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; draft: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    await sql`update systems set ssp_draft = ${data.draft} where id = ${data.systemId}`;
    return { ok: true as const };
  });

export const insertAgentRun = createServerFn({ method: "POST" })
  .validator(
    (input: {
      agent: string;
      systemId: string | null;
      objective: string;
      plan: string;
      tools: string[];
      evidence: string;
      decision: string;
      confidence: number;
      requiresApproval: boolean;
    }) => input,
  )
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const id = `RUN-${Date.now().toString(36).toUpperCase()}`;
    await sql`
      insert into agent_runs (id, agent, system_id, status, objective, plan, tools, evidence, decision, confidence, requires_approval)
      values (${id}, ${data.agent}, ${data.systemId}, ${data.requiresApproval ? "pending_approval" : "complete"}, ${data.objective}, ${data.plan}, ${JSON.stringify(data.tools)}, ${data.evidence}, ${data.decision}, ${data.confidence}, ${data.requiresApproval})
    `;
    return { id };
  });

export const listAskMessages = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  const sql = await getSql();
  const rows = await sql<{ id: string; role: string; content: string; created_at: string }>`
    select id, role, content, created_at from ask_messages order by created_at asc
  `;
  return rows.map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant",
    content: r.content,
    createdAt: r.created_at,
  }));
});

export const insertAskMessage = createServerFn({ method: "POST" })
  .validator((input: { role: "user" | "assistant"; content: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const id = `MSG-${Date.now().toString(36)}`;
    await sql`insert into ask_messages (id, role, content) values (${id}, ${data.role}, ${data.content})`;
    return { id };
  });

export const runPackage = createServerFn({ method: "POST" })
  .validator((input: { systemId: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensurePackageSeeded();
    const sql = await getSql();
    const snapshot = await getPortfolio();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };

    const tests = deriveTestResults({ ...snapshot, testResults: [] }, system.id);
    let testsWritten = 0;
    for (const t of tests) {
      await sql`
        insert into test_results (id, system_id, control_id, method, objective, result, comments, automated)
        values (${t.id}, ${t.systemId}, ${t.controlId}, ${t.method}, ${t.objective}, ${t.result}, ${t.comments}, ${t.automated})
        on conflict (id) do update set result = excluded.result, comments = excluded.comments, automated = excluded.automated
      `;
      testsWritten += 1;
    }

    const artifacts = deriveArtifacts({ ...snapshot, artifacts: [] }, system.id).map((a) =>
      a.status === "missing" ? { ...a, status: "generated" as const, source: "Aegis package engine" } : a,
    );
    for (const a of artifacts) {
      await sql`
        insert into package_artifacts (id, system_id, kind, title, status, source, updated_at)
        values (${a.id}, ${a.systemId}, ${a.kind}, ${a.title}, ${a.status}, ${a.source}, ${"2026-09-18"})
        on conflict (id) do update set status = excluded.status, source = excluded.source, updated_at = excluded.updated_at
      `;
    }

    const eventId = `WF-${Date.now().toString(36).toUpperCase()}`;
    await sql`
      insert into workflow_events (id, system_id, gate, actor, action, notes)
      values (${eventId}, ${system.id}, ${"conmon"}, ${"Aegis RMF Orchestrator"}, ${"Automated package run"}, ${"Collected evidence mappings, executed 800-53A methods, refreshed OSCAL artifacts. AO decision remains human."})
    `;

    const runId = `RUN-${Date.now().toString(36).toUpperCase()}`;
    const complete = packageCompleteness({ ...snapshot, artifacts, testResults: tests }, system.id);
    await sql`
      insert into agent_runs (id, agent, system_id, status, objective, plan, tools, evidence, decision, confidence, requires_approval)
      values (
        ${runId}, ${"rmf-orchestrator"}, ${system.id}, ${"pending_approval"},
        ${`Automated eMASS package refresh for ${system.acronym}`},
        ${"1. Map telemetry to 800-53 2. Execute examine/interview/test 3. Refresh SSP/SAP/SAR/POA&M 4. Stage residual risk for AO"},
        ${JSON.stringify(["aws.get_config_rules", "tenable.get_vulnerabilities", "azure.get_policy_results", "splunk.search"])},
        ${`${testsWritten} test results · ${artifacts.length} artifacts`},
        ${`Package completeness ${complete.overall}%. ${complete.implemented}/${complete.selected} controls implemented. Artifacts ${complete.artifactsReady}/${complete.artifactsRequired}. Human authorization still required.`},
        ${complete.overall},
        ${true}
      )
    `;

    return {
      ok: true as const,
      testsWritten,
      artifacts: artifacts.length,
      completeness: complete.overall,
      runId,
    };
  });

export const advanceWorkflow = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; gate: WorkflowGateId; notes: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensurePackageSeeded();
    const sql = await getSql();
    const snapshot = await getPortfolio();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const id = `WF-${Date.now().toString(36).toUpperCase()}`;
    const actor =
      data.gate === "ao_decision"
        ? system.aoRole
        : data.gate === "sca_assess"
          ? (system.extra.scaRole ?? "SCA")
          : data.gate === "issm_review"
            ? (system.extra.issmRole ?? "ISSM")
            : system.issoRole;
    await sql`
      insert into workflow_events (id, system_id, gate, actor, action, notes)
      values (${id}, ${data.systemId}, ${data.gate}, ${actor}, ${`Signed ${data.gate.replaceAll("_", " ")}`}, ${data.notes})
    `;
    if (data.gate === "ao_decision") {
      await sql`update systems set ato_status = ${"authorized_with_conditions"}, rmf_step = ${"monitor"} where id = ${data.systemId}`;
    }
    if (data.gate === "isso_submit") {
      await sql`update systems set rmf_step = ${"assess"} where id = ${data.systemId}`;
    }
    if (data.gate === "sca_assess") {
      await sql`update systems set rmf_step = ${"authorize"} where id = ${data.systemId}`;
    }
    return { ok: true as const, id };
  });

export const recordAtoDecision = createServerFn({ method: "POST" })
  .validator(
    (input: {
      systemId: string;
      decision: "authorized" | "authorized_with_conditions" | "not_authorized";
      conditions: string;
      actingRole?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensureLayer1Seeded();
    await ensurePhase0Seeded();
    const sql = await getSql();
    const snapshot = await getPortfolio();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const acting = data.actingRole && isRmfRoleId(data.actingRole) ? data.actingRole : null;
    const needed: RmfActionId = data.decision === "authorized_with_conditions" ? "ato.condition" : "ato.issue";
    if (!acting || !canPerform(acting, needed)) {
      const role = acting ? roleById(acting)?.name ?? acting : "no acting role";
      return {
        ok: false as const,
        error: `Authorization is a human AO action. ${role} cannot ${needed.replaceAll(".", " ")}. Act as Authorizing Official or AO designated representative.`,
      };
    }
    const step: RmfStep = data.decision === "not_authorized" ? "authorize" : "monitor";
    const status: AtoStatus = data.decision;
    const expires = data.decision === "not_authorized" ? null : "2027-09-18";
    const actorName = roleById(acting)?.name ?? system.aoRole;
    await sql`update systems set ato_status = ${status}, rmf_step = ${step}, ato_expires = ${expires} where id = ${data.systemId}`;
    const id = `AH-${Date.now().toString(36).toUpperCase()}`;
    await sql`insert into authorization_history (id, system_id, decision, actor, conditions, expires_at)
      values (${id}, ${data.systemId}, ${data.decision}, ${actorName}, ${data.conditions}, ${expires})`;
    const wf = `WF-${Date.now().toString(36).toUpperCase()}`;
    await sql`insert into workflow_events (id, system_id, gate, actor, action, notes)
      values (${wf}, ${data.systemId}, ${"ao_decision"}, ${actorName}, ${`AO ${data.decision.replaceAll("_", " ")}`}, ${data.conditions})`;
    return { ok: true as const, id };
  });

export const registerSystem = createServerFn({ method: "POST" })
  .validator(
    (input: {
      name: string;
      acronym: string;
      mission: string;
      orgId: string;
      impactLevel: "low" | "moderate" | "high";
      actingRole: string;
      discover?: boolean;
    }) => input,
  )
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensureLayer1Seeded();
    await ensurePhase0Seeded();
    await ensureSupportDocsSeeded();
    const snapshot = await getPortfolio();
    const view = buildOrgPrepareView(snapshot);
    if (!view.readyForSystems) {
      return {
        ok: false as const,
        error: "Organization Prepare is incomplete. Finish Phase 0 before registering a system.",
      };
    }
    if (!isRmfRoleId(data.actingRole) || !canPerform(data.actingRole, "system.create")) {
      const label = roleById(data.actingRole)?.name ?? "This role";
      return {
        ok: false as const,
        error: `${label} cannot register a system. Act as System Owner or Chief Information Officer.`,
      };
    }
    const acronym = data.acronym.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 16);
    const name = data.name.trim();
    const mission = data.mission.trim();
    if (!acronym || name.length < 3 || mission.length < 8) {
      return { ok: false as const, error: "Name, acronym, and mission are required." };
    }
    const org = snapshot.organizations.find((o) => o.id === data.orgId);
    if (!org || org.kind !== "component") {
      return { ok: false as const, error: "Register the system under a component." };
    }
    if (snapshot.systems.some((s) => s.acronym.toUpperCase() === acronym)) {
      return { ok: false as const, error: `Acronym ${acronym} is already on the register.` };
    }
    const id = `SYS-${acronym.replace(/[^A-Z0-9]/g, "").slice(0, 12)}`;
    const systemId = snapshot.systems.some((s) => s.id === id)
      ? `${id}-${Date.now().toString(36).toUpperCase()}`
      : id;
    const people = snapshot.personnel.filter((p) => p.orgId === org.id);
    const owner =
      people.find((p) => p.role.toLowerCase().includes("owner"))?.title ?? "System owner";
    const isso =
      people.find((p) => p.role === "ISSO" || p.role.toLowerCase().includes("security"))?.title ?? "ISSO";
    const ao =
      snapshot.personnel.find((p) => p.orgId === org.id && p.role === "AO")?.title ??
      snapshot.personnel.find((p) => p.role === "AO")?.title ??
      "Authorizing Official";
    const draft =
      data.discover === false
        ? null
        : discoverInventory({ name, acronym, mission });
    const extra = extraFromDiscovery(
      {
        users: draft?.users ?? "To be inventoried",
        components: draft?.assets.length ?? 0,
        interfaces: draft?.interfaces ?? 0,
        baseline: data.impactLevel,
        confidentiality: data.impactLevel,
        integrity: data.impactLevel,
        availability: data.impactLevel,
        overlay: "",
        packageVersion: "0.1",
        orgId: org.id,
        engineCursor: "prepare",
      },
      draft ??
        discoverInventory({ name, acronym, mission }),
    );
    if (data.discover === false) {
      extra.discoverySources = [];
      extra.discoveryAt = undefined;
      extra.users = "To be inventoried";
      extra.components = 0;
      extra.interfaces = 0;
    }
    const sql = await getSql();
    await sql`
      insert into systems (
        id, name, acronym, mission, impact_level, ato_status, ato_expires,
        hosting, cloud_provider, owner_role, isso_role, ao_role,
        authorization_boundary, data_types, rmf_step, ssp_draft, extra
      ) values (
        ${systemId}, ${name}, ${acronym}, ${mission}, ${data.impactLevel},
        ${"not_authorized"}, ${null}, ${draft?.hosting ?? "To be determined"}, ${draft?.cloudProvider ?? null},
        ${draft?.owner ?? owner}, ${isso}, ${ao}, ${draft?.authorizationBoundary ?? "Boundary to be drawn in system Prepare."},
        ${JSON.stringify(draft?.dataTypes ?? ["CUI"])}, ${"prepare"}, ${null}, ${JSON.stringify(extra)}
      )
    `;
    if (draft && data.discover !== false) {
      await persistDiscovery(sql, systemId, draft, []);
    }
    const actor = roleById(data.actingRole)?.name ?? data.actingRole;
    await logAudit(sql, actor, "Registered information system", systemId);
    return { ok: true as const, id: systemId, discovered: Boolean(draft && data.discover !== false) };
  });

async function persistDiscovery(sql: Sql, systemId: string, draft: DiscoveryDraft, existingNames: string[]) {
  const known = new Set(existingNames.map((n) => n.toLowerCase()));
  let i = 0;
  for (const a of draft.assets) {
    if (known.has(a.name.toLowerCase())) continue;
    i += 1;
    const id = `AST-${systemId.replace("SYS-", "").slice(0, 8)}-D${Date.now().toString(36).toUpperCase()}${i}`;
    await sql`
      insert into assets (id, system_id, name, kind, environment, criticality, internet_exposed)
      values (${id}, ${systemId}, ${a.name}, ${a.kind}, ${a.environment}, ${a.criticality}, ${a.internetExposed})
      on conflict (id) do nothing
    `;
  }
  const now = new Date().toISOString();
  for (const [idx, art] of draft.artifacts.entries()) {
    const id = `DOC-${systemId.replace("SYS-", "").slice(0, 8)}-P1-${idx}-${Date.now().toString(36).toUpperCase()}`;
    await sql`insert into support_documents (id, system_id, rmf_step, kind, title, body, control_ids, source, url, status, updated_at)
      values (${id}, ${systemId}, ${"prepare"}, ${art.kind}, ${art.title}, ${art.body}, ${art.controlIds.join(",")}, ${"discovery"}, ${null}, ${"attached"}, ${now})
      on conflict (id) do nothing`;
  }
  const evId = `${systemId}-CM8-DISC`;
  await sql`
    insert into evidence (id, system_id, control_id, title, source, method, collected_at, hash, classification, expires_at, summary)
    values (
      ${evId}, ${systemId}, ${"CM-8"}, ${"Discovery — component inventory"}, ${"RMF discovery engine"}, ${"examine"},
      ${now}, ${`sha256:${evId.slice(-10)}`}, ${"CUI"}, ${null},
      ${`${draft.assets.length} CIs from ${draft.hits.filter((h) => h.status === "connected").length} collectors. Unofficial until the system owner confirms. Not an ATO.`}
    )
    on conflict (id) do update set summary = excluded.summary, collected_at = excluded.collected_at
  `;
  for (const [idx, dep] of draft.dependencies.entries()) {
    const iid = `ISA-${systemId.replace("SYS-", "").slice(0, 6)}-D${idx + 1}`;
    await sql`
      insert into interconnections (id, system_id, partner, kind, agreement, data_flow, status)
      values (${iid}, ${systemId}, ${dep}, ${"Dependency"}, ${"Discovered — confirm ISA"}, ${"To be documented"}, ${"in_review"})
      on conflict (id) do nothing
    `;
  }
}

export const applyDiscovery = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; actingRole: string; name?: string; acronym?: string; mission?: string }) => input)
  .handler(async ({ data }) => {
    if (
      !isRmfRoleId(data.actingRole) ||
      !(canPerform(data.actingRole, "system.create") || canPerform(data.actingRole, "control.implement"))
    ) {
      return { ok: false as const, error: "Act as System Owner, ISSO, or CIO to run discovery." };
    }
    await ensureSeeded();
    await ensureSupportDocsSeeded();
    const snapshot = await getPortfolio();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const atoBefore = system.atoStatus;
    const draft = discoverInventory({
      name: data.name ?? system.name,
      acronym: data.acronym ?? system.acronym,
      mission: data.mission ?? system.mission,
      existing: system,
    });
    const extra = extraFromDiscovery(system.extra, draft);
    const sql = await getSql();
    await sql`update systems set
      hosting = ${draft.hosting},
      cloud_provider = ${draft.cloudProvider},
      authorization_boundary = ${draft.authorizationBoundary},
      data_types = ${JSON.stringify(draft.dataTypes)},
      extra = ${JSON.stringify(extra)}
      where id = ${system.id}`;
    await persistDiscovery(
      sql,
      system.id,
      draft,
      snapshot.assets.filter((a) => a.systemId === system.id).map((a) => a.name),
    );
    const atoAfter = await sql<{ ato_status: string }>`select ato_status from systems where id = ${system.id}`;
    if (atoAfter[0]?.ato_status !== atoBefore) {
      await sql`update systems set ato_status = ${atoBefore} where id = ${system.id}`;
    }
    await logAudit(sql, roleById(data.actingRole)?.name ?? data.actingRole, "Discovery inventory applied", system.id);
    return {
      ok: true as const,
      assets: draft.assets.length,
      sources: draft.hits.filter((h) => h.status === "connected").length,
      statement: `${draft.assets.length} CIs from ${draft.hits.filter((h) => h.status === "connected").length} collectors. Unofficial. ATO unchanged.`,
    };
  });

export const acceptRisk = createServerFn({ method: "POST" })
  .validator((input: { id: string; expires: string; notes: string }) => input)
  .handler(async ({ data }) => {
    await ensureLayer1Seeded();
    const sql = await getSql();
    await sql`update risks set status = ${"accepted"}, acceptance_expires = ${data.expires} where id = ${data.id}`;
    return { ok: true as const };
  });

export const recordObjective = createServerFn({ method: "POST" })
  .validator(
    (input: {
      id: string;
      systemId: string;
      controlId: string;
      objectiveId: string;
      method: string;
      result: string;
      comments: string;
      assessor: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    await ensureLayer1Seeded();
    const sql = await getSql();
    await sql`
      insert into assessment_objectives (id, system_id, control_id, objective_id, method, result, comments, assessor, updated_at)
      values (${data.id}, ${data.systemId}, ${data.controlId}, ${data.objectiveId}, ${data.method}, ${data.result}, ${data.comments}, ${data.assessor}, ${"2026-09-18"})
      on conflict (id) do update set result = excluded.result, comments = excluded.comments, updated_at = excluded.updated_at
    `;
    return { ok: true as const };
  });

export const saveSspSection = createServerFn({ method: "POST" })
  .validator(
    (input: { id: string; systemId: string; sectionId: string; title: string; body: string; source: string }) =>
      input,
  )
  .handler(async ({ data }) => {
    await ensureLayer1Seeded();
    const sql = await getSql();
    await sql`
      insert into ssp_sections (id, system_id, section_id, title, body, source, status, updated_at)
      values (${data.id}, ${data.systemId}, ${data.sectionId}, ${data.title}, ${data.body}, ${data.source}, ${"draft"}, ${"2026-09-18"})
      on conflict (id) do update set body = excluded.body, source = excluded.source, status = ${"draft"}, updated_at = excluded.updated_at
    `;
    return { ok: true as const };
  });

export const collectFromConnector = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; connector: string; controlId: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensureCollectionSeeded();
    const sql = await getSql();
    return applyCollection(sql, data.systemId, data.connector);
  });

export const runConmon = createServerFn({ method: "POST" })
  .validator((input: { systemId: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensureCollectionSeeded();
    const sql = await getSql();
    const bindings = await sql<{ connector_id: string; status: string }>`
      select connector_id, status from connector_bindings where system_id = ${data.systemId}
    `;
    const enabled = bindings.filter((b) => b.status === "enabled").map((b) => b.connector_id);
    const ids = enabled.length ? enabled : seedBindings().filter((b) => b.systemId === data.systemId).map((b) => b.connectorId);
    const scanIds = await withAutoScans(sql, data.systemId, ids);
    await prefetchAutoScanCatalogs();
    const results = [];
    for (const connectorId of scanIds) {
      results.push(await applyCollection(sql, data.systemId, connectorId));
    }
    const evidenceCount = results.reduce((s, r) => s + (r.ok ? r.evidenceCount : 0), 0);
    const changeCount = results.reduce((s, r) => s + (r.ok ? r.changeCount : 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    await sql`update package_artifacts set status = ${"generated"}, source = ${"Collection plane"}, updated_at = ${today}
      where system_id = ${data.systemId} and kind = ${"conmon"}`;
    const runId = `RUN-${Date.now().toString(36).toUpperCase()}`;
    await sql`
      insert into agent_runs (id, agent, system_id, status, objective, plan, tools, evidence, decision, confidence, requires_approval)
      values (
        ${runId}, ${"monitor"}, ${data.systemId}, ${"pending_approval"},
        ${"Continuous monitoring collection"},
        ${"1. Collect enabled feeds 2. Map to 800-53A 3. Refresh evidence lake 4. Stage residual risk. Do not authorize."},
        ${JSON.stringify(scanIds)},
        ${`${evidenceCount} artifacts · ${changeCount} changes`},
        ${"Package refreshed from live collectors. AO decision remains human."},
        ${88},
        ${true}
      )
    `;
    const wf = `WF-${Date.now().toString(36).toUpperCase()}`;
    await sql`insert into workflow_events (id, system_id, gate, actor, action, notes)
      values (${wf}, ${data.systemId}, ${"conmon"}, ${"Collection plane"}, ${"ConMon run"}, ${`${scanIds.length} feeds · ${evidenceCount} evidence · ${changeCount} changes. Authorization not modified.`})`;
    return { ok: true as const, feeds: scanIds.length, evidenceCount, changeCount, runId };
  });

export const toggleConnector = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; connectorId: string; enabled: boolean }) => input)
  .handler(async ({ data }) => {
    await ensureCollectionSeeded();
    const sql = await getSql();
    const id = `BND-${data.systemId}-${data.connectorId}`;
    const status = data.enabled ? "enabled" : "disabled";
    await sql`insert into connector_bindings (id, system_id, connector_id, status, run_count, last_run, next_run, last_summary)
      values (${id}, ${data.systemId}, ${data.connectorId}, ${status}, ${0}, ${null}, ${null}, ${"Never collected."})
      on conflict (id) do update set status = excluded.status`;
    return { ok: true as const };
  });

async function persistObservations(
  sql: Sql,
  opts: {
    systemId: string;
    issoRole: string;
    observations: IngestObservation[];
    source: string;
    jobId: string;
    writeEvidence: boolean;
    openFindings: boolean;
    now: Date;
    assessor: string;
  },
): Promise<{ findingsOpened: number; poamsOpened: number; otherCount: number; mappings: { controlId: string; objective: string; method: string; result: string; sourceRef: string }[] }> {
  const nowIso = opts.now.toISOString();
  const day = nowIso.slice(0, 10);
  let findingsOpened = 0;
  let poamsOpened = 0;
  const mappings: { controlId: string; objective: string; method: string; result: string; sourceRef: string }[] = [];

  for (const [i, o] of opts.observations.entries()) {
    if (opts.writeEvidence) {
      const evId = `${opts.jobId}-E${i + 1}`;
      await sql`
        insert into evidence (id, system_id, control_id, title, source, method, collected_at, hash, classification, expires_at, summary)
        values (${evId}, ${opts.systemId}, ${o.controlId}, ${o.evidenceTitle}, ${opts.source}, ${o.method}, ${nowIso}, ${`sha256:${evId.slice(-10)}`}, ${"CUI"}, ${null}, ${o.evidenceSummary})
        on conflict (id) do nothing
      `;
    }
    const testId = `TST-SAR-${opts.systemId}-${o.controlId}-${o.method}`;
    await sql`
      insert into test_results (id, system_id, control_id, method, objective, result, comments, automated)
      values (${testId}, ${opts.systemId}, ${o.controlId}, ${o.method}, ${`${o.controlId}.${o.method[0]}`}, ${o.result}, ${o.comments}, ${true})
      on conflict (id) do update set result = excluded.result, comments = excluded.comments, automated = excluded.automated
    `;
    const objId = `OBJ-${opts.systemId}-${o.controlId}-${o.method}`;
    await sql`
      insert into assessment_objectives (id, system_id, control_id, objective_id, method, result, comments, assessor, updated_at)
      values (${objId}, ${opts.systemId}, ${o.controlId}, ${`${o.controlId}.${o.method[0]}`}, ${o.method}, ${o.result}, ${o.comments}, ${opts.assessor}, ${day})
      on conflict (id) do update set result = excluded.result, comments = excluded.comments, assessor = excluded.assessor, updated_at = excluded.updated_at
    `;
    await sql`update implementations set result = ${o.result}, last_verified = ${day}, statement = ${o.comments}
      where system_id = ${opts.systemId} and control_id = ${o.controlId} and status <> ${"not_applicable"}`;
    mappings.push({
      controlId: o.controlId,
      objective: `${o.controlId}.${o.method[0]}`,
      method: o.method,
      result: o.result,
      sourceRef: opts.source,
    });

    if (opts.openFindings && o.result === "other") {
      const openF = await sql<{ id: string }>`select id from findings where system_id = ${opts.systemId} and control_id = ${o.controlId} and status = ${"open"} limit 1`;
      let findingId = openF[0]?.id ?? null;
      if (!findingId && o.findingTitle) {
        findingId = `FND-SAR-${Date.now().toString(36).toUpperCase()}-${i}`;
        await sql`
          insert into findings (id, system_id, control_id, title, severity, status, description, impact)
          values (${findingId}, ${opts.systemId}, ${o.controlId}, ${o.findingTitle}, ${o.findingSeverity ?? "high"}, ${"open"}, ${o.comments}, ${"Imported from assessment tool. Residual risk not accepted."})
          on conflict (id) do nothing
        `;
        findingsOpened += 1;
      }
      const openP = await sql<{ id: string }>`select id from poams where system_id = ${opts.systemId} and control_id = ${o.controlId} and status <> ${"completed"} limit 1`;
      if (!openP[0] && o.findingTitle) {
        const poamId = `POAM-SAR-${Date.now().toString(36).toUpperCase()}-${i}`;
        const due = new Date(opts.now.getTime() + 30 * 86_400_000).toISOString().slice(0, 10);
        await sql`
          insert into poams (id, system_id, finding_id, control_id, weakness, risk_level, owner, due_date, status, milestones, resources, compensating, days_open)
          values (${poamId}, ${opts.systemId}, ${findingId}, ${o.controlId}, ${o.comments}, ${o.findingSeverity ?? "high"}, ${opts.issoRole}, ${due}, ${"open"}, ${JSON.stringify([{ date: due, label: "ISSO remediation", done: false }])}, ${"Imported SAR — human closure only"}, ${null}, ${0})
        `;
        poamsOpened += 1;
      }
    }
  }

  await sql`update package_artifacts set status = ${"generated"}, source = ${opts.source}, updated_at = ${day}
    where system_id = ${opts.systemId} and (kind = ${"sap"} or kind = ${"sar"})`;

  return {
    findingsOpened,
    poamsOpened,
    otherCount: opts.observations.filter((o) => o.result === "other").length,
    mappings,
  };
}

async function withAutoScans(sql: Sql, systemId: string, ids: string[]): Promise<string[]> {
  for (const connectorId of AUTO_SCAN_FEEDS) {
    const id = `BND-${systemId}-${connectorId}`;
    await sql`
      insert into connector_bindings (id, system_id, connector_id, status, run_count, last_run, next_run, last_summary)
      values (${id}, ${systemId}, ${connectorId}, ${"enabled"}, ${0}, ${null}, ${null}, ${"Auto-scan attached to the system under assessment."})
      on conflict (id) do update set status = ${"enabled"}
    `;
  }
  return [...new Set([...ids, ...AUTO_SCAN_FEEDS])];
}

async function applyCollection(sql: Sql, systemId: string, connectorRef: string) {
  const def = connectorByRef(connectorRef);
  if (!def) return { ok: false as const, error: "Unknown connector." };
  const now = new Date();
  const nowIso = now.toISOString();
  const bindingId = `BND-${systemId}-${def.id}`;
  const existing = await sql<{ run_count: number; status: string }>`select run_count, status from connector_bindings where id = ${bindingId}`;
  const generation = Number(existing[0]?.run_count ?? 0);
  const jobId = `JOB-${def.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  let plan = planCollection({ systemId, connectorId: def.id, generation, now: nowIso, jobId });
  if (def.id === "axiom") {
    const live = await fetchAxiomFindings();
    plan = planAxiom({ systemId, generation, now: nowIso, jobId }, def, live.findings, live.live, live.source);
  } else if (def.id === "axiom-sca") {
    const live = await fetchAxiomSca();
    plan = planSuite({ systemId, generation, now: nowIso, jobId }, def, live.findings, live.live, live.source, "AXIOM SCA");
  } else if (def.id === "axiom-iac") {
    const live = await fetchAxiomIac();
    plan = planSuite({ systemId, generation, now: nowIso, jobId }, def, live.findings, live.live, live.source, "AXIOM IaC");
  }
  const next = nextRunAt(def.cadence, now);
  const status = existing[0]?.status === "disabled" ? "disabled" : "enabled";

  for (const e of plan.evidence) {
    await sql`
      insert into evidence (id, system_id, control_id, title, source, method, collected_at, hash, classification, expires_at, summary)
      values (${e.id}, ${e.systemId}, ${e.controlId}, ${e.title}, ${e.source}, ${e.method}, ${e.collectedAt}, ${e.hash}, ${e.classification}, ${e.expiresAt}, ${e.summary})
      on conflict (id) do nothing
    `;
  }
  for (const t of plan.tests) {
    await sql`
      insert into test_results (id, system_id, control_id, method, objective, result, comments, automated)
      values (${t.id}, ${t.systemId}, ${t.controlId}, ${t.method}, ${t.objective}, ${t.result}, ${t.comments}, ${t.automated})
      on conflict (id) do update set result = excluded.result, comments = excluded.comments, automated = excluded.automated
    `;
  }
  for (const c of plan.changes) {
    await sql`
      insert into config_changes (id, system_id, kind, summary, detected_at, controls, risk, status)
      values (${c.id}, ${c.systemId}, ${c.kind}, ${c.summary}, ${c.detectedAt}, ${JSON.stringify(c.controls)}, ${c.risk}, ${c.status})
      on conflict (id) do nothing
    `;
  }
  for (const v of plan.vulns) {
    await sql`
      insert into vulnerabilities (id, system_id, asset_id, cve, title, cvss, severity, kev, control_ids, status)
      values (${v.id}, ${v.systemId}, ${v.assetId}, ${v.cve}, ${v.title}, ${v.cvss}, ${v.severity}, ${v.kev}, ${JSON.stringify(v.controlIds)}, ${v.status})
      on conflict (id) do nothing
    `;
  }
  for (const t of plan.tickets) {
    await sql`update tickets set status = ${t.status}, updated_at = ${t.updatedAt} where external_id = ${t.externalId} and system_id = ${systemId}`;
  }
  for (const a of plan.assets) {
    await sql`
      insert into assets (id, system_id, name, kind, environment, criticality, internet_exposed)
      values (${a.id}, ${a.systemId}, ${a.name}, ${a.kind}, ${a.environment}, ${a.criticality}, ${a.internetExposed})
      on conflict (id) do nothing
    `;
  }
  const day = nowIso.slice(0, 10);
  for (const controlId of plan.implControls) {
    await sql`update implementations set last_verified = ${day} where system_id = ${systemId} and control_id = ${controlId}`;
  }

  if (def.id === "oscal") {
    const roles = await sql<{ isso_role: string }>`select isso_role from systems where id = ${systemId}`;
    await persistObservations(sql, {
      systemId,
      issoRole: roles[0]?.isso_role ?? "ISSO",
      observations: observationsFor(systemId),
      source: def.name,
      jobId,
      writeEvidence: false,
      openFindings: true,
      now,
      assessor: "Imported assessor",
    });
  } else {
    for (const m of plan.mappings) {
      const objId = `OBJ-${systemId}-${m.controlId}-${m.method}`;
      const comment = plan.tests.find((t) => t.controlId === m.controlId && t.method === m.method)?.comments ?? m.sourceRef;
      await sql`
        insert into assessment_objectives (id, system_id, control_id, objective_id, method, result, comments, assessor, updated_at)
        values (${objId}, ${systemId}, ${m.controlId}, ${m.objective}, ${m.method}, ${m.result}, ${comment}, ${def.name}, ${day})
        on conflict (id) do update set result = excluded.result, comments = excluded.comments, assessor = excluded.assessor, updated_at = excluded.updated_at
      `;
      await sql`update implementations set result = ${m.result}, last_verified = ${day}
        where system_id = ${systemId} and control_id = ${m.controlId} and status <> ${"not_applicable"}`;
    }
  }

  await sql`
    insert into collection_jobs (id, system_id, connector_id, status, started_at, finished_at, evidence_count, change_count, finding_count, summary, mappings)
    values (${jobId}, ${systemId}, ${def.id}, ${"complete"}, ${nowIso}, ${nowIso}, ${plan.evidence.length}, ${plan.changes.length}, ${plan.vulns.length}, ${plan.summary}, ${JSON.stringify(plan.mappings)})
  `;
  await sql`
    insert into connector_bindings (id, system_id, connector_id, status, run_count, last_run, next_run, last_summary)
    values (${bindingId}, ${systemId}, ${def.id}, ${status}, ${generation + 1}, ${nowIso}, ${next}, ${plan.summary})
    on conflict (id) do update set run_count = excluded.run_count, last_run = excluded.last_run, next_run = excluded.next_run, last_summary = excluded.last_summary
  `;

  return {
    ok: true as const,
    id: jobId,
    evidenceCount: plan.evidence.length,
    changeCount: plan.changes.length,
    findingCount: plan.vulns.length,
    summary: plan.summary,
    connectorId: def.id,
  };
}

export const ingestAssessment = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; payload: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensureCollectionSeeded();
    await ensureLayer1Seeded();
    await ensurePackageSeeded();
    const parsed = parseAssessmentPayload(data.payload);
    if (!parsed.ok) return parsed;
    const sql = await getSql();
    const systems = await sql<{ id: string; isso_role: string; ato_status: string }>`select id, isso_role, ato_status from systems where id = ${data.systemId}`;
    const system = systems[0];
    if (!system) return { ok: false as const, error: "System not found." };
    const atoBefore = system.ato_status;
    const now = new Date();
    const nowIso = now.toISOString();
    const jobId = `JOB-OSCL-${Date.now().toString(36).toUpperCase()}`;
    const persisted = await persistObservations(sql, {
      systemId: data.systemId,
      issoRole: system.isso_role,
      observations: parsed.observations,
      source: parsed.source,
      jobId,
      writeEvidence: true,
      openFindings: true,
      now,
      assessor: "Imported assessor",
    });

    const summary = `${parsed.source}: ${parsed.observations.length} objectives · ${persisted.otherCount} other-than-satisfied · ${persisted.findingsOpened} findings opened. ATO unchanged (${atoBefore}).`;
    await sql`
      insert into collection_jobs (id, system_id, connector_id, status, started_at, finished_at, evidence_count, change_count, finding_count, summary, mappings)
      values (${jobId}, ${data.systemId}, ${"oscal"}, ${"complete"}, ${nowIso}, ${nowIso}, ${parsed.observations.length}, ${0}, ${persisted.findingsOpened}, ${summary}, ${JSON.stringify(persisted.mappings)})
    `;
    const bindingId = `BND-${data.systemId}-oscal`;
    await sql`
      insert into connector_bindings (id, system_id, connector_id, status, run_count, last_run, next_run, last_summary)
      values (${bindingId}, ${data.systemId}, ${"oscal"}, ${"enabled"}, ${1}, ${nowIso}, ${null}, ${summary})
      on conflict (id) do update set run_count = connector_bindings.run_count + 1, last_run = excluded.last_run, last_summary = excluded.last_summary, status = ${"enabled"}
    `;
    const asmId = `ASM-SAR-${Date.now().toString(36).toUpperCase()}`;
    await sql`
      insert into assessments (id, system_id, kind, status, assessor, started_at, completed_at, summary)
      values (${asmId}, ${data.systemId}, ${"Imported OSCAL / assessment-results"}, ${"in_progress"}, ${parsed.source}, ${nowIso}, ${null}, ${summary})
    `;
    const runId = `RUN-${Date.now().toString(36).toUpperCase()}`;
    await sql`
      insert into agent_runs (id, agent, system_id, status, objective, plan, tools, evidence, decision, confidence, requires_approval)
      values (
        ${runId}, ${"assessment"}, ${data.systemId}, ${"pending_approval"},
        ${`Ingest assessment-results for ${data.systemId}`},
        ${"1. Parse OSCAL/800-53A 2. Write evidence + objectives 3. Open findings/POA&M if other 4. Do not authorize"},
        ${JSON.stringify(["oscal.import_sar", "assessment.record_objectives"])},
        ${`${parsed.observations.length} observations`},
        ${summary},
        ${90},
        ${true}
      )
    `;
    const wf = `WF-${Date.now().toString(36).toUpperCase()}`;
    await sql`insert into workflow_events (id, system_id, gate, actor, action, notes)
      values (${wf}, ${data.systemId}, ${"sca_assess"}, ${parsed.source}, ${"Assessment ingest"}, ${`${summary} Human SCA still records; AO still authorizes.`})`;
    await logAudit(sql, parsed.source, "Assessment ingest", `${data.systemId} ${jobId}`);

    const atoAfter = await sql<{ ato_status: string }>`select ato_status from systems where id = ${data.systemId}`;
    return {
      ok: true as const,
      jobId,
      evidenceCount: parsed.observations.length,
      findingsOpened: persisted.findingsOpened,
      poamsOpened: persisted.poamsOpened,
      otherCount: persisted.otherCount,
      summary,
      atoUnchanged: atoAfter[0]?.ato_status === atoBefore,
    };
  });

async function executeAssessmentPipeline(
  sql: Sql,
  systemId: string,
  payload: string,
): Promise<
  | {
      ok: true;
      jobId: string;
      runId: string;
      feeds: number;
      evidenceCount: number;
      changeCount: number;
      observations: number;
      findingsOpened: number;
      poamsOpened: number;
      otherCount: number;
      source: string;
      summary: string;
      atoUnchanged: boolean;
      atoStatus: string;
    }
  | { ok: false; error: string }
> {
  const systems = await sql<{ id: string; isso_role: string; ato_status: string; rmf_step: string }>`
    select id, isso_role, ato_status, rmf_step from systems where id = ${systemId}
  `;
  const system = systems[0];
  if (!system) return { ok: false, error: "System not found." };
  const atoBefore = system.ato_status;

  const bindings = await sql<{ connector_id: string; status: string }>`
    select connector_id, status from connector_bindings where system_id = ${systemId}
  `;
  const enabled = bindings.filter((b) => b.status === "enabled").map((b) => b.connector_id);
  const ids = enabled.length
    ? enabled
    : seedBindings()
        .filter((b) => b.systemId === systemId)
        .map((b) => b.connectorId);
  const trimmed = payload.trim();
  const collectIds = await withAutoScans(sql, systemId, trimmed ? ids.filter((id) => id !== "oscal") : ids);
  await prefetchAutoScanCatalogs();

  const collected = [];
  for (const connectorId of collectIds) {
    collected.push(await applyCollection(sql, systemId, connectorId));
  }
  const evidenceCount = collected.reduce((s, r) => s + (r.ok ? r.evidenceCount : 0), 0);
  const changeCount = collected.reduce((s, r) => s + (r.ok ? r.changeCount : 0), 0);

  const sarText = trimmed || sampleSarJson(systemId);
  const parsed = parseAssessmentPayload(sarText);
  if (!parsed.ok) return parsed;

  const now = new Date();
  const nowIso = now.toISOString();
  const jobId = `JOB-PIPE-${Date.now().toString(36).toUpperCase()}`;
  const persisted = await persistObservations(sql, {
    systemId,
    issoRole: system.isso_role,
    observations: parsed.observations,
    source: parsed.source,
    jobId,
    writeEvidence: true,
    openFindings: true,
    now,
    assessor: "Imported assessor",
  });

  const summary = `Pipeline: ${collectIds.length} feeds · ${evidenceCount} evidence · ${parsed.observations.length} SAR objectives · ${persisted.otherCount} other · ${persisted.findingsOpened} findings opened. ATO unchanged (${atoBefore}).`;

  await sql`
    insert into collection_jobs (id, system_id, connector_id, status, started_at, finished_at, evidence_count, change_count, finding_count, summary, mappings)
    values (${jobId}, ${systemId}, ${"oscal"}, ${"complete"}, ${nowIso}, ${nowIso}, ${parsed.observations.length}, ${changeCount}, ${persisted.findingsOpened}, ${summary}, ${JSON.stringify(persisted.mappings)})
  `;
  const bindingId = `BND-${systemId}-oscal`;
  await sql`
    insert into connector_bindings (id, system_id, connector_id, status, run_count, last_run, next_run, last_summary)
    values (${bindingId}, ${systemId}, ${"oscal"}, ${"enabled"}, ${1}, ${nowIso}, ${null}, ${summary})
    on conflict (id) do update set run_count = connector_bindings.run_count + 1, last_run = excluded.last_run, last_summary = excluded.last_summary, status = ${"enabled"}
  `;
  const asmId = `ASM-PIPE-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    insert into assessments (id, system_id, kind, status, assessor, started_at, completed_at, summary)
    values (${asmId}, ${systemId}, ${"Assessment pipeline"}, ${"in_progress"}, ${parsed.source}, ${nowIso}, ${null}, ${summary})
  `;
  const runId = `RUN-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    insert into agent_runs (id, agent, system_id, status, objective, plan, tools, evidence, decision, confidence, requires_approval)
    values (
      ${runId}, ${"assessment"}, ${systemId}, ${"pending_approval"},
      ${`Run assessment pipeline for ${systemId}`},
      ${"1. Collect enabled feeds 2. Ingest OSCAL SAR 3. Write 800-53A objectives 4. Open findings/POA&M if other 5. Stage SAP/SAR 6. Do not authorize"},
      ${JSON.stringify(["collection.run", "oscal.import_sar", "assessment.record_objectives", "package.stage_sar"])},
      ${`${evidenceCount} collected · ${parsed.observations.length} SAR`},
      ${summary},
      ${91},
      ${true}
    )
  `;
  const wf = `WF-${Date.now().toString(36).toUpperCase()}`;
  await sql`insert into workflow_events (id, system_id, gate, actor, action, notes)
    values (${wf}, ${systemId}, ${"sca_assess"}, ${"Assessment pipeline"}, ${"Assessment pipeline"}, ${`${summary} SCA still records; AO still authorizes.`})`;
  await logAudit(sql, "Assessment pipeline", "Run pipeline", `${systemId} ${jobId}`);

  if (system.rmf_step === "implement" || system.rmf_step === "select" || system.rmf_step === "categorize") {
    await sql`update systems set rmf_step = ${"assess"} where id = ${systemId}`;
  }

  const atoAfter = await sql<{ ato_status: string }>`select ato_status from systems where id = ${systemId}`;
  return {
    ok: true,
    jobId,
    runId,
    feeds: collectIds.length,
    evidenceCount,
    changeCount,
    observations: parsed.observations.length,
    findingsOpened: persisted.findingsOpened,
    poamsOpened: persisted.poamsOpened,
    otherCount: persisted.otherCount,
    source: parsed.source,
    summary,
    atoUnchanged: atoAfter[0]?.ato_status === atoBefore,
    atoStatus: atoAfter[0]?.ato_status ?? atoBefore,
  };
}

export const runAssessmentPipeline = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; payload?: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensureCollectionSeeded();
    await ensureLayer1Seeded();
    await ensurePackageSeeded();
    const sql = await getSql();
    return executeAssessmentPipeline(sql, data.systemId, data.payload ?? "");
  });

async function stampArtifacts(sql: Sql, systemId: string, kinds: string[], source: string, day: string) {
  for (const kind of kinds) {
    const id = `ART-${systemId}-${kind}`;
    const title = ARTIFACT_KINDS.find((k) => k.id === kind)?.label ?? kind;
    const status = kind === "ato" ? "draft" : "generated";
    await sql`
      insert into package_artifacts (id, system_id, kind, title, status, source, updated_at)
      values (${id}, ${systemId}, ${kind}, ${title}, ${status}, ${source}, ${day})
      on conflict (id) do update set status = excluded.status, source = excluded.source, updated_at = excluded.updated_at
    `;
  }
}

export interface EngineStepResult {
  ok: true;
  step: RmfStep;
  summary: string;
  evidenceCount: number;
  sspCount: number;
  feeds?: number;
  observations?: number;
  otherCount?: number;
  findingsOpened?: number;
  poamsOpened?: number;
  openPoams?: number;
  highPoams?: number;
  completeness?: number;
  atoUnchanged: boolean;
  atoStatus: string;
  rmfStep: RmfStep;
  cursor: RmfStep;
  humanRequired: boolean;
  docsCovered?: number;
  docsTotal?: number;
  docsGaps?: number;
  recommendation?: string;
  recommendationVerdict?: string;
  orchCoverage?: number;
}

async function executeEngineStep(
  sql: Sql,
  systemId: string,
  step: RmfStep,
  opts: { skipHeavyCollect?: boolean } = {},
): Promise<EngineStepResult | { ok: false; error: string }> {
  const rows = await sql<{
    id: string;
    isso_role: string;
    ao_role: string;
    ato_status: string;
    rmf_step: string;
    extra: string;
  }>`select id, isso_role, ao_role, ato_status, rmf_step, extra from systems where id = ${systemId}`;
  const row = rows[0];
  if (!row) return { ok: false, error: "System not found." };
  const atoBefore = row.ato_status as AtoStatus;
  const current = row.rmf_step as RmfStep;
  const snapshot = await getPortfolio();
  const system = snapshot.systems.find((s) => s.id === systemId);
  if (!system) return { ok: false, error: "System not found." };

  if (step === "prepare") {
    const orgView = buildOrgPrepareView(snapshot);
    if (!orgView.readyForSystems) {
      return { ok: false as const, error: orgView.summary };
    }
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const day = nowIso.slice(0, 10);
  const def = ENGINE_STEPS.find((s) => s.id === step)!;
  const jobId = `JOB-ENG-${step.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  let summary = stepSummary(snapshot, system, step);
  let evidenceCount = 0;
  let sspCount = 0;
  let feeds: number | undefined;
  let observations: number | undefined;
  let otherCount: number | undefined;
  let findingsOpened: number | undefined;
  let poamsOpened: number | undefined;
  let openPoams: number | undefined;
  let highPoams: number | undefined;
  let completeness: number | undefined;
  let docsCovered: number | undefined;
  let docsTotal: number | undefined;
  let docsGaps: number | undefined;
  let recommendation: string | undefined;
  let recommendationVerdict: string | undefined;
  let orchCoverage: number | undefined;

  if (step === "assess") {
    const pipe = await executeAssessmentPipeline(sql, systemId, "");
    if (!pipe.ok) return pipe;
    summary = pipe.summary;
    evidenceCount = pipe.evidenceCount;
    feeds = pipe.feeds;
    observations = pipe.observations;
    otherCount = pipe.otherCount;
    findingsOpened = pipe.findingsOpened;
    poamsOpened = pipe.poamsOpened;
    const after = await getPortfolio();
    const orch = buildOrchestratorView(after, systemId);
    if (orch) {
      recommendation = orch.recommendation.summary;
      recommendationVerdict = orch.recommendation.verdict;
      orchCoverage = orch.coveragePercent;
      summary = `${pipe.summary} ${formatOrchSummary(orch)}`;
      const recId = `${jobId}-ORCH`;
      await sql`
        insert into evidence (id, system_id, control_id, title, source, method, collected_at, hash, classification, expires_at, summary)
        values (
          ${recId}, ${systemId}, ${"CA-2"},
          ${"Engine — orchestrator recommendation"}, ${"RMF orchestrator"}, ${"examine"}, ${nowIso}, ${`sha256:${recId.slice(-10)}`}, ${"CUI"}, ${null},
          ${`${orch.recommendation.headline}. Verdict ${orch.recommendation.verdict}. Coverage ${orch.coveragePercent}% of ${orch.tailored} tailored. Examine ${orch.examine} · interview ${orch.interview} · test ${orch.test}. Unofficial. Engine does not authorize.`}
        )
        on conflict (id) do update set summary = excluded.summary, collected_at = excluded.collected_at
      `;
      evidenceCount += 1;
      const asmId = `ASM-ORCH-${Date.now().toString(36).toUpperCase()}`;
      await sql`
        insert into assessments (id, system_id, kind, status, assessor, started_at, completed_at, summary)
        values (${asmId}, ${systemId}, ${"Orchestrator recommendation"}, ${"pending_approval"}, ${"RMF orchestrator"}, ${nowIso}, ${null}, ${orch.recommendation.summary})
      `;
    }
  } else if (step === "monitor" && !opts.skipHeavyCollect) {
    const bindings = await sql<{ connector_id: string; status: string }>`
      select connector_id, status from connector_bindings where system_id = ${systemId}
    `;
    const enabled = bindings.filter((b) => b.status === "enabled").map((b) => b.connector_id);
    const ids = await withAutoScans(
      sql,
      systemId,
      enabled.length
        ? enabled
        : seedBindings()
            .filter((b) => b.systemId === systemId)
            .map((b) => b.connectorId),
    );
    await prefetchAutoScanCatalogs();
    const collected = [];
    for (const connectorId of ids) {
      collected.push(await applyCollection(sql, systemId, connectorId));
    }
    feeds = ids.length;
    evidenceCount = collected.reduce((s, r) => s + (r.ok ? r.evidenceCount : 0), 0);
    summary = `Monitor: ${ids.length} feeds · ${evidenceCount} artifacts. ATO unchanged (${atoBefore}).`;
    await sql`update package_artifacts set status = ${"generated"}, source = ${"RMF engine"}, updated_at = ${day}
      where system_id = ${systemId} and kind = ${"conmon"}`;
  } else {
    const evidence = planEvidence(snapshot, system, step);
    for (const [i, e] of evidence.entries()) {
      const evId = `${jobId}-E${i + 1}`;
      await sql`
        insert into evidence (id, system_id, control_id, title, source, method, collected_at, hash, classification, expires_at, summary)
        values (${evId}, ${systemId}, ${e.controlId}, ${e.title}, ${"RMF engine"}, ${"automated"}, ${nowIso}, ${`sha256:${evId.slice(-10)}`}, ${"CUI"}, ${null}, ${e.summary})
        on conflict (id) do update set summary = excluded.summary, collected_at = excluded.collected_at, title = excluded.title
      `;
      evidenceCount += 1;
    }
    const ssp = planSsp(snapshot, system, step);
    for (const s of ssp) {
      const id = `SSP-${systemId}-${s.sectionId}`;
      await sql`
        insert into ssp_sections (id, system_id, section_id, title, body, source, status, updated_at)
        values (${id}, ${systemId}, ${s.sectionId}, ${s.title}, ${s.body}, ${"RMF engine"}, ${"draft"}, ${day})
        on conflict (id) do update set body = excluded.body, source = excluded.source, status = ${"draft"}, updated_at = excluded.updated_at
      `;
      sspCount += 1;
    }
    await stampArtifacts(sql, systemId, planArtifacts(step), "RMF engine", day);
    if (step === "implement") {
      await sql`update implementations set last_verified = ${day}
        where system_id = ${systemId} and (status = ${"implemented"} or status = ${"inherited"})`;
    }
    if (step === "authorize") {
      const poamOpen = await sql<{ n: number }>`
        select count(*)::int as n from poams where system_id = ${systemId} and status <> ${"completed"}
      `;
      const poamHigh = await sql<{ n: number }>`
        select count(*)::int as n from poams
        where system_id = ${systemId} and status <> ${"completed"}
          and (risk_level = ${"high"} or risk_level = ${"critical"})
      `;
      openPoams = poamOpen[0]?.n ?? 0;
      highPoams = poamHigh[0]?.n ?? 0;
      const complete = packageCompleteness(snapshot, systemId);
      completeness = complete.overall;
      summary = `Authorize staged: package ${complete.overall}% · ${openPoams} open POA&M (${highPoams} high/critical). AO decision required. ATO unchanged (${atoBefore}).`;
      const asmId = `ASM-ENG-${Date.now().toString(36).toUpperCase()}`;
      await sql`
        insert into assessments (id, system_id, kind, status, assessor, started_at, completed_at, summary)
        values (${asmId}, ${systemId}, ${"Authorization package staged"}, ${"in_progress"}, ${"RMF engine"}, ${nowIso}, ${null}, ${summary})
      `;
    }
  }

  const cmp = compareSupportDocs(snapshot, systemId, step);
  docsCovered = cmp.covered;
  docsTotal = cmp.tailored;
  docsGaps = cmp.gapIds.length;
  summary = `${summary} Supporting docs ${cmp.covered}/${cmp.tailored} tailored (${cmp.gapIds.length} gaps).`;
  const mx = coverMatrix(snapshot, systemId);
  const phaseRows = mx.filter((c) => c.row.phase === phaseForStep(step) || (step === "prepare" && c.row.phase === "0"));
  const ms = matrixSummary(phaseRows);
  summary = `${summary} Artifact matrix ${ms.covered}/${ms.required} required (${ms.missing} missing, ${ms.blocked} awaiting human).`;
  const orgBl = activeOrgBaseline(snapshot);
  if (step === "prepare") {
    const org = comparePhase0Artifacts(snapshot);
    summary = `${summary} Phase 0 artifacts ${org.covered}/${org.required} required (${org.gaps.length} gaps). ${orgBl.statement}`;
    const disc = snapshot.assets.filter((a) => a.systemId === systemId).length;
    summary = `${summary} Discovery inventory ${disc} CIs.`;
  }
  if (step === "assess" || step === "monitor") {
    const checks = cadenceChecks(snapshot, systemId, orgBl);
    const overdue = checks.filter((c) => c.overdue).map((c) => c.controlId);
    summary = `${summary} Org cadence ${orgBl.defaultCadence}${orgBl.cadenceAssumed ? " (assumed — CMS missing)" : ""} · ${overdue.length ? `overdue ${overdue.join(", ")}` : "no overdue org-cadence controls"}. ${orgBl.statement}`;
  }
  const covId = `${jobId}-DOC`;
  await sql`
    insert into evidence (id, system_id, control_id, title, source, method, collected_at, hash, classification, expires_at, summary)
    values (
      ${covId}, ${systemId}, ${step === "select" ? "PL-2" : step === "assess" ? "CA-2" : step === "authorize" ? "CA-6" : step === "monitor" ? "CA-7" : step === "categorize" ? "RA-2" : step === "implement" ? "PL-8" : "CM-8"},
      ${`Engine — ${def.name} vs tailored controls`}, ${"RMF engine"}, ${"examine"}, ${nowIso}, ${`sha256:${covId.slice(-10)}`}, ${"CUI"}, ${null},
      ${`Compared ${cmp.docs} support document(s) to ${cmp.tailored} tailored controls for ${step}. Covered ${cmp.covered}. Gaps ${cmp.gapIds.slice(0, 12).join(", ") || "none"}. Extra (not in tailored set) ${cmp.extraIds.slice(0, 8).join(", ") || "none"}. Engine does not close a POA&M.`}
    )
    on conflict (id) do update set summary = excluded.summary, collected_at = excluded.collected_at
  `;
  evidenceCount += 1;

  const extra = { ...system.extra, engineCursor: nextEngineCursor(step), engineAt: nowIso };
  const nextRmf = rmfAfter(current, step, atoBefore);
  await sql`update systems set extra = ${JSON.stringify(extra)}, rmf_step = ${nextRmf} where id = ${systemId}`;

  const runId = `RUN-ENG-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    insert into agent_runs (id, agent, system_id, status, objective, plan, tools, evidence, decision, confidence, requires_approval)
    values (
      ${runId}, ${"rmf-orchestrator"}, ${systemId}, ${step === "authorize" ? "pending_approval" : "complete"},
      ${`Engine · ${def.name} · ${systemId}`},
      ${def.automation},
      ${JSON.stringify(def.tools)},
      ${`${evidenceCount} evidence · ${sspCount} SSP sections`},
      ${summary},
      ${step === "authorize" ? 70 : 92},
      ${step === "authorize"}
    )
  `;
  const wf = `WF-ENG-${Date.now().toString(36).toUpperCase()}`;
  await sql`insert into workflow_events (id, system_id, gate, actor, action, notes)
    values (${wf}, ${systemId}, ${def.gate}, ${"RMF engine"}, ${`Engine ${def.name}`}, ${summary})`;
  await logAudit(sql, "RMF engine", `Engine ${step}`, `${systemId} ${jobId}`);

  const atoAfter = await sql<{ ato_status: string; rmf_step: string }>`select ato_status, rmf_step from systems where id = ${systemId}`;
  return {
    ok: true,
    step,
    summary,
    evidenceCount,
    sspCount,
    feeds,
    observations,
    otherCount,
    findingsOpened,
    poamsOpened,
    openPoams,
    highPoams,
    completeness,
    docsCovered,
    docsTotal,
    docsGaps,
    recommendation,
    recommendationVerdict,
    orchCoverage,
    atoUnchanged: atoAfter[0]?.ato_status === atoBefore,
    atoStatus: atoAfter[0]?.ato_status ?? atoBefore,
    rmfStep: (atoAfter[0]?.rmf_step ?? nextRmf) as RmfStep,
    cursor: nextEngineCursor(step),
    humanRequired: step === "authorize",
  };
}

export const runEngineStep = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; step: RmfStep; skipHeavyCollect?: boolean }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensureCollectionSeeded();
    await ensureLayer1Seeded();
    await ensurePhase0Seeded();
    await ensurePackageSeeded();
    await ensureSupportDocsSeeded();
    await ensurePhase0ArtifactsSeeded();
    const sql = await getSql();
    return executeEngineStep(sql, data.systemId, data.step, {
      skipHeavyCollect: data.skipHeavyCollect,
    });
  });

export const runEngineCycle = createServerFn({ method: "POST" })
  .validator((input: { systemId: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensureCollectionSeeded();
    await ensureLayer1Seeded();
    await ensurePhase0Seeded();
    await ensurePackageSeeded();
    await ensureSupportDocsSeeded();
    await ensurePhase0ArtifactsSeeded();
    const sql = await getSql();
    const before = await sql<{ ato_status: string }>`select ato_status from systems where id = ${data.systemId}`;
    if (!before[0]) return { ok: false as const, error: "System not found." };
    const atoBefore = before[0].ato_status;
    const journal: EngineStepResult[] = [];
    const sequence: RmfStep[] = ["prepare", "categorize", "select", "implement", "assess", "authorize", "monitor"];
    for (const step of sequence) {
      const res = await executeEngineStep(sql, data.systemId, step, {
        skipHeavyCollect: step === "monitor",
      });
      if (!res.ok) return res;
      journal.push(res);
    }
    const after = await sql<{ ato_status: string; rmf_step: string }>`select ato_status, rmf_step from systems where id = ${data.systemId}`;
    const summary = journal.map((j) => j.summary).join(" → ");
    return {
      ok: true as const,
      journal,
      summary,
      atoUnchanged: after[0]?.ato_status === atoBefore,
      atoStatus: after[0]?.ato_status ?? atoBefore,
      rmfStep: (after[0]?.rmf_step ?? "authorize") as RmfStep,
      humanRequired: true,
    };
  });

export const saveSupportDocument = createServerFn({ method: "POST" })
  .validator(
    (input: {
      systemId: string;
      rmfStep: RmfStep;
      kind: string;
      title: string;
      body: string;
      controlIds: string;
      url?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    await ensureSupportDocsSeeded();
    const sql = await getSql();
    const ids = parseControlIds(data.controlIds);
    if (!data.title.trim() || !data.body.trim()) {
      return { ok: false as const, error: "Title and body are required." };
    }
    if (ids.length === 0) {
      return { ok: false as const, error: "Map at least one tailored control ID." };
    }
    const id = `DOC-${data.systemId.replace("SYS-", "")}-${data.rmfStep.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    await sql`insert into support_documents (id, system_id, rmf_step, kind, title, body, control_ids, source, url, status, updated_at)
      values (${id}, ${data.systemId}, ${data.rmfStep}, ${data.kind}, ${data.title.trim()}, ${data.body.trim()}, ${ids.join(",")}, ${"pasted"}, ${data.url?.trim() || null}, ${"attached"}, ${now})`;
    await logAudit(sql, "ISSO", "Support document attached", `${data.systemId} ${data.rmfStep} ${id}`);
    return { ok: true as const, id, controlIds: ids };
  });

export const saveOrgArtifact = createServerFn({ method: "POST" })
  .validator(
    (input: {
      kindId: string;
      orgId: string;
      title: string;
      body: string;
      controlIds: string;
      url?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    await ensurePhase0ArtifactsSeeded();
    const sql = await getSql();
    const ids = parseControlIds(data.controlIds);
    if (!data.title.trim() || !data.body.trim()) {
      return { ok: false as const, error: "Title and body are required." };
    }
    if (ids.length === 0) {
      return { ok: false as const, error: "Map at least one organization control ID." };
    }
    const kind = await sql<{ id: string }>`select id from org_artifact_kinds where id = ${data.kindId}`;
    if (!kind[0]) return { ok: false as const, error: "Unknown artifact kind." };
    const id = `OA-${data.kindId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    await sql`insert into org_artifacts (id, kind_id, org_id, title, body, control_ids, source, url, status, updated_at)
      values (${id}, ${data.kindId}, ${data.orgId}, ${data.title.trim()}, ${data.body.trim()}, ${ids.join(",")}, ${"pasted"}, ${data.url?.trim() || null}, ${"attached"}, ${now})`;
    await logAudit(sql, "SAISO", "Phase 0 artifact attached", `${data.orgId} ${data.kindId} ${id}`);
    return { ok: true as const, id, controlIds: ids };
  });

export const addOrgArtifactKind = createServerFn({ method: "POST" })
  .validator(
    (input: {
      name: string;
      aliases?: string;
      canonicalId: string;
      required: boolean;
      agency: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    await ensurePhase0ArtifactsSeeded();
    const sql = await getSql();
    const name = data.name.trim();
    if (!name) return { ok: false as const, error: "Agency document name is required." };
    const canonRows = await sql<{
      id: string;
      nist_task: string;
      control_ids: string;
      owner_role: string;
      hint: string;
    }>`select id, nist_task, control_ids, owner_role, hint from org_artifact_kinds where id = ${data.canonicalId}`;
    const canon = canonRows[0];
    if (!canon) return { ok: false as const, error: "Map the agency name to a catalog kind." };
    const id = `kind-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32)}-${Date.now().toString(36)}`;
    await sql`insert into org_artifact_kinds (id, canonical_id, name, aliases, required, nist_task, control_ids, owner_role, agency, hint)
      values (${id}, ${canon.id}, ${name}, ${data.aliases?.trim() || ""}, ${data.required ? 1 : 0}, ${canon.nist_task}, ${canon.control_ids}, ${canon.owner_role}, ${data.agency.trim() || "Agency"}, ${`Agency-specific name for ${canon.id}.`})`;
    await logAudit(sql, "SAISO", "Agency artifact requirement added", `${id} → ${canon.id}`);
    return { ok: true as const, id };
  });

export const saveOrgRmfBaseline = createServerFn({ method: "POST" })
  .validator((input: { actingRole?: string }) => input)
  .handler(async () => {
    await ensurePhase0ArtifactsSeeded();
    await ensureLayer3Seeded();
    const snapshot = await getPortfolio();
    const built = buildOrgRmfBaseline(snapshot);
    const sql = await getSql();
    await persistOrgBaseline(sql, built);
    await logAudit(sql, "SAISO", "Org RMF baseline rebuilt", built.id);
    return { ok: true as const, baseline: built };
  });

export const publishOrgRmfBaseline = createServerFn({ method: "POST" })
  .validator((input: { actingRole: string }) => input)
  .handler(async ({ data }) => {
    if (!isRmfRoleId(data.actingRole) || !canPerform(data.actingRole, "policy.publish")) {
      return { ok: false as const, error: "Only SAISO, CIO, or Privacy Officer may publish the org baseline. Not an ATO." };
    }
    await ensurePhase0ArtifactsSeeded();
    const snapshot = await getPortfolio();
    const built = { ...buildOrgRmfBaseline(snapshot), status: "published" as const, updatedAt: new Date().toISOString() };
    const sql = await getSql();
    await persistOrgBaseline(sql, built);
    await logAudit(sql, roleById(data.actingRole)?.name ?? "SAISO", "Org RMF baseline published", built.id);
    return { ok: true as const, baseline: built };
  });

async function logAudit(sql: Sql, actor: string, action: string, object: string) {
  const id = `AUD-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  await sql`insert into audit_events (id, actor, action, object, created_at)
    values (${id}, ${actor}, ${action}, ${object}, ${now})`;
}

export const runWhatIf = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; scenario: string; result: string; atoImpact: string }) => input)
  .handler(async ({ data }) => {
    await ensureLayer3Seeded();
    const sql = await getSql();
    const id = `WFR-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    await sql`insert into whatif_runs (id, system_id, scenario, result, ato_impact, created_at)
      values (${id}, ${data.systemId}, ${data.scenario}, ${data.result}, ${data.atoImpact}, ${now})`;
    await logAudit(sql, "ISSO", "What-if simulation", `${data.systemId} ${data.scenario}`);
    return { ok: true as const, id };
  });

export const recordIncidentPoam = createServerFn({ method: "POST" })
  .validator((input: { incidentId: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensureLayer3Seeded();
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      system_id: string;
      title: string;
      severity: string;
      status: string;
      summary: string;
      control_ids: string;
    }>`select id, system_id, title, severity, status, summary, control_ids from incidents where id = ${data.incidentId}`;
    const inc = rows[0];
    if (!inc) return { ok: false as const, error: "Incident not found." };
    if (inc.status === "poam_opened") return { ok: false as const, error: "POA&M already opened from this incident." };
    const controlId = inc.control_ids.split(",")[0]?.trim() || "IR-4";
    const stamp = Date.now().toString(36).toUpperCase();
    const findingId = `FND-INC-${stamp}`;
    const poamId = `POAM-INC-${stamp}`;
    await sql`insert into findings (id, system_id, control_id, title, severity, status, description, impact)
      values (${findingId}, ${inc.system_id}, ${controlId}, ${inc.title}, ${inc.severity}, ${"open"}, ${inc.summary}, ${"Confirmed deficiency from incident. Authorization not modified."})`;
    await sql`insert into poams (id, system_id, finding_id, control_id, weakness, risk_level, owner, due_date, status, milestones, resources, compensating, days_open)
      values (${poamId}, ${inc.system_id}, ${findingId}, ${controlId}, ${inc.title}, ${inc.severity}, ${"ISSO"}, ${"2026-10-17"}, ${"open"}, ${JSON.stringify([{ date: "2026-09-26", label: "Root cause + compensating control", done: false }])}, ${"Incident response + control owner"}, ${null}, ${1})`;
    await sql`update incidents set status = ${"poam_opened"} where id = ${inc.id}`;
    await logAudit(sql, "ISSO", "Incident to POA&M", `${inc.id} → ${poamId}`);
    return { ok: true as const, findingId, poamId };
  });

export const saveInterview = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; controlId: string; question: string; answer: string; flag: string | null; assessor: string }) => input)
  .handler(async ({ data }) => {
    await ensureLayer3Seeded();
    const sql = await getSql();
    const id = `INT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    await sql`insert into interviews (id, system_id, control_id, question, answer, flag, assessor, updated_at)
      values (${id}, ${data.systemId}, ${data.controlId}, ${data.question}, ${data.answer}, ${data.flag}, ${data.assessor}, ${now})`;
    await logAudit(sql, data.assessor, "Interview recorded", `${data.systemId} ${data.controlId}`);
    return { ok: true as const, id };
  });

export const decideInheritance = createServerFn({ method: "POST" })
  .validator((input: { id: string; accept: boolean }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensureLayer3Seeded();
    const sql = await getSql();
    const rows = await sql<{ id: string; system_id: string; control_id: string }>`select id, system_id, control_id from inheritance_proposals where id = ${data.id}`;
    const row = rows[0];
    if (!row) return { ok: false as const, error: "Proposal not found." };
    const status = data.accept ? "accepted" : "rejected";
    await sql`update inheritance_proposals set status = ${status} where id = ${row.id}`;
    if (data.accept) {
      await sql`update implementations set status = ${"inherited"}, statement = ${"Inherited after human review of discovery proposal. Customer overlay still applies where hybrid."}
        where system_id = ${row.system_id} and control_id = ${row.control_id}`;
    }
    await logAudit(sql, "ISSO", data.accept ? "Accepted inheritance" : "Rejected inheritance", row.id);
    return { ok: true as const, status };
  });

export const generatePolicy = createServerFn({ method: "POST" })
  .validator((input: { title: string; body: string; controls: string }) => input)
  .handler(async ({ data }) => {
    await ensureLayer3Seeded();
    const sql = await getSql();
    const id = `POL-${Date.now().toString(36).toUpperCase()}`;
    const today = new Date().toISOString().slice(0, 10);
    await sql`insert into policies (id, title, status, body, controls, source, updated_at)
      values (${id}, ${data.title}, ${"draft"}, ${data.body}, ${data.controls}, ${"Aegis policy generator"}, ${today})`;
    await logAudit(sql, "ISSM", "Draft policy generated", id);
    return { ok: true as const, id };
  });

export const setCatoReview = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; state: CatoReviewState; notes: string; actor: string }) => input)
  .handler(async ({ data }) => {
    await ensureLayer3Seeded();
    const sql = await getSql();
    const id = `CATO-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    await sql`insert into cato_reviews (id, system_id, state, notes, actor, created_at)
      values (${id}, ${data.systemId}, ${data.state}, ${data.notes}, ${data.actor}, ${now})`;
    await logAudit(sql, data.actor, "cATO review", `${data.systemId} ${data.state}`);
    return { ok: true as const, id };
  });

export const completeLab = createServerFn({ method: "POST" })
  .validator((input: { labId: string }) => input)
  .handler(async ({ data }) => {
    await ensureLayer3Seeded();
    const sql = await getSql();
    const id = `LABP-${data.labId}`;
    const now = new Date().toISOString();
    await sql`insert into academy_progress (id, lab_id, status, updated_at)
      values (${id}, ${data.labId}, ${"complete"}, ${now})
      on conflict (id) do update set status = ${"complete"}, updated_at = excluded.updated_at`;
    await logAudit(sql, "Analyst", "Academy lab complete", data.labId);
    return { ok: true as const, id };
  });

export const requestRecollection = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; controlId: string }) => input)
  .handler(async ({ data }) => {
    await ensureSeeded();
    await ensureLayer3Seeded();
    const sql = await getSql();
    const runId = `RUN-${Date.now().toString(36).toUpperCase()}`;
    await sql`
      insert into agent_runs (id, agent, system_id, status, objective, plan, tools, evidence, decision, confidence, requires_approval)
      values (
        ${runId}, ${"evidence"}, ${data.systemId}, ${"pending_approval"},
        ${`Recollect evidence for ${data.controlId}`},
        ${"1. Identify stale/expired artifact 2. Queue collector 3. Do not mark control satisfied"},
        ${JSON.stringify(["tenable.get_vulnerabilities", "aws.get_config_rules"])},
        ${"Queued from evidence lifecycle"},
        ${"Recollection requested. Human still reviews the artifact. ATO unchanged."},
        ${70},
        ${true}
      )`;
    await logAudit(sql, "ISSO", "Evidence recollection requested", `${data.systemId} ${data.controlId}`);
    return { ok: true as const, runId };
  });



