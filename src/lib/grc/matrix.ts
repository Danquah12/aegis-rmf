import { artifactsFor, originationOf } from "./package";
import type { ArtifactKind, PortfolioSnapshot, RmfStep } from "./types";

export const RMF_PRINCIPLE =
  "AI can collect, analyze, correlate, test, recommend, and document. Humans retain authority over assessment determinations, residual-risk acceptance, and authorization decisions.";

export type MatrixPhase = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "fisma";
export type MatrixHuman = "none" | "owner" | "saiso" | "isso" | "sca" | "ao";
export type MatrixStatus = "missing" | "draft" | "attached" | "official" | "blocked";

export const MATRIX_PHASES: { id: MatrixPhase; label: string; nist: string; step: RmfStep | "org" | "fisma" }[] = [
  { id: "0", label: "Phase 0 — Organization Prepare", nist: "SP 800-37 Rev. 2 P-1–P-7", step: "org" },
  { id: "1", label: "Phase 1 — System Prepare", nist: "SP 800-37 Rev. 2 P-8–P-18", step: "prepare" },
  { id: "2", label: "Phase 2 — Categorize", nist: "FIPS 199 · SP 800-60 · SP 800-37 C-1–C-2", step: "categorize" },
  { id: "3", label: "Phase 3 — Select", nist: "SP 800-53B · SP 800-37 S-1–S-3", step: "select" },
  { id: "4", label: "Phase 4 — Implement", nist: "SP 800-53 · SP 800-18 · SP 800-37 I-1–I-2", step: "implement" },
  { id: "5", label: "Phase 5 — Assess", nist: "SP 800-53A · SP 800-37 A-1–A-6", step: "assess" },
  { id: "6", label: "Phase 6 — Authorize", nist: "SP 800-37 R-1–R-5 · CA-6", step: "authorize" },
  { id: "7", label: "Phase 7 — Monitor", nist: "SP 800-37 M-1–M-5 · CA-7", step: "monitor" },
  { id: "fisma", label: "FISMA reporting", nist: "FISMA · agency schema · not RMF itself", step: "fisma" },
];

export type MatrixProbe =
  | { kind: "org"; canonical: string }
  | { kind: "docs"; includes: string }
  | { kind: "field"; name: "assets" | "boundary" | "interconnects" | "cia" | "ssp" | "discovery" | "roles" | "dataTypes" | "mission" }
  | { kind: "pkg"; artifact: ArtifactKind }
  | { kind: "table"; name: "implementations" | "assessments" | "poams" | "evidence" | "findings" | "risks" | "collection" };

export interface MatrixRow {
  id: string;
  phase: MatrixPhase;
  nist: string;
  task: string;
  activity: string;
  artifact: string;
  required: boolean;
  fields: string[];
  agent: string;
  sources: string[];
  procedure: string;
  autoTest: string;
  human: MatrixHuman;
  oscal: string;
  fisma: string;
  tables: string[];
  workflow: string;
  probe: MatrixProbe;
}

function row(
  id: string,
  phase: MatrixPhase,
  nist: string,
  task: string,
  activity: string,
  artifact: string,
  required: boolean,
  fields: string,
  agent: string,
  sources: string,
  procedure: string,
  autoTest: string,
  human: MatrixHuman,
  oscal: string,
  fisma: string,
  tables: string,
  workflow: string,
  probe: MatrixProbe,
): MatrixRow {
  return {
    id,
    phase,
    nist,
    task,
    activity,
    artifact,
    required,
    fields: fields.split(" · "),
    agent,
    sources: sources.split(" · "),
    procedure,
    autoTest,
    human,
    oscal,
    fisma,
    tables: tables.split(" · "),
    workflow,
    probe,
  };
}

export const MASTER_MATRIX: MatrixRow[] = [
  row("p0-ispp", "0", "SP 800-37 · PM-1", "P-1", "Establish security program", "Information Security Program Plan", true, "scope · resources · roles", "Policy Agent", "org docs · SAISO", "examine", "none", "saiso", "—", "program inventory", "org_artifacts", "draft → publish", { kind: "org", canonical: "ispp" }),
  row("p0-isp", "0", "SP 800-37 · AC-1", "P-1", "Publish org policy", "Information Security Policy", true, "policy · families", "Policy Agent", "org docs", "examine", "none", "saiso", "—", "policy status", "org_artifacts", "draft → publish", { kind: "org", canonical: "isp" }),
  row("p0-rms", "0", "SP 800-37 · PM-9", "P-2", "Set risk strategy", "Risk Management Strategy", true, "appetite · tolerance · response", "Policy Agent", "risk executive", "examine", "none", "saiso", "—", "risk posture", "org_artifacts · org_rmf_baselines", "draft → publish", { kind: "org", canonical: "rms" }),
  row("p0-ora", "0", "SP 800-37 · RA-3", "P-3", "Org risk assessment", "Risk Assessment", true, "threats · mission · CUI", "Architecture Agent", "ORA · mission", "examine", "none", "saiso", "—", "risk summary", "org_artifacts", "attached", { kind: "org", canonical: "ora" }),
  row("p0-cms", "0", "SP 800-37 · CA-7", "P-7", "Org ConMon strategy", "Continuous Monitoring Strategy", true, "cadence · metrics · ISCM", "Assessment Agent", "CMS", "examine", "cadence parse", "saiso", "—", "ISCM", "org_artifacts · org_rmf_baselines", "draft → publish", { kind: "org", canonical: "cms" }),
  row("p0-scrm", "0", "SP 800-161 · SR-1", "P-17", "Supply chain strategy", "Supply Chain Risk Management Strategy", true, "suppliers · products", "Policy Agent", "SCRM", "examine", "none", "saiso", "—", "supply risk", "org_artifacts", "gap until attached", { kind: "org", canonical: "scrm" }),
  row("p0-baseline", "0", "SP 800-53B", "P-4", "Derive org RMF baseline", "Organizational RMF Baseline", true, "cadence · overlays · methods", "Assessment Agent", "CMS · RMS · policies", "examine", "buildOrgRmfBaseline", "saiso", "profile", "control cadence", "org_rmf_baselines", "unofficial → publish", { kind: "org", canonical: "cms" }),

  row("p1-reg", "1", "SP 800-37 P-18", "P-18", "Register the system", "System Registration Record", true, "name · id · owner · mission · hosting", "RMF Orchestrator", "CMDB · owner", "examine", "registerSystem", "owner", "system-security-plan", "system inventory", "systems", "register (not ATO)", { kind: "field", name: "mission" }),
  row("p1-desc", "1", "SP 800-37 P-18", "P-18", "Describe the boundary", "System Description", true, "mission · function · users", "Architecture Agent", "CMDB · discovery", "examine", "discoverInventory", "owner", "system-security-plan", "system description", "systems · support_documents", "draft intelligence", { kind: "docs", includes: "System description" }),
  row("p1-inv", "1", "SP 800-37 P-10 · CM-8", "P-10", "Build inventory", "System Inventory", true, "CIs · source · environment", "CMDB Agent", "CMDB · AWS · Azure · GCP · K8s · Terraform", "examine · test", "discoverInventory", "owner", "system-implementation", "HW/SW inventory", "assets", "unofficial until confirm", { kind: "field", name: "assets" }),
  row("p1-comp", "1", "CM-8", "P-10", "Component inventory", "System Component Inventory", true, "kind · criticality · exposure", "Cloud Agent", "AWS · Azure · K8s · Terraform", "test", "collector", "owner", "component-definition", "component count", "assets", "discovery apply", { kind: "field", name: "assets" }),
  row("p1-info", "1", "SP 800-37 P-12", "P-12", "Information inventory", "Information Inventory", true, "types · owner · lifecycle", "Architecture Agent", "data dictionary · privacy", "examine", "none", "owner", "system-information", "info types", "systems.data_types", "draft", { kind: "field", name: "dataTypes" }),
  row("p1-flow", "1", "PL-8 · SC-7", "P-11", "Map data movement", "Data Flow Diagram", true, "sources · sinks · CUI paths", "Architecture Agent", "diagrams · Terraform", "examine", "none", "isso", "system-security-plan", "—", "support_documents", "draft", { kind: "docs", includes: "Data flow" }),
  row("p1-net", "1", "SC-7", "P-11", "Network topology", "Network Diagram", true, "subnets · routes · listeners", "Network Agent", "network discovery · CSPM", "examine · test", "network probe", "isso", "component-definition", "—", "support_documents · assets", "draft", { kind: "docs", includes: "Network" }),
  row("p1-arch", "1", "PL-8 · SA-8", "P-16", "Architecture view", "Architecture Diagram", true, "tiers · trust · inheritance", "Architecture Agent", "EA · SA", "examine", "none", "isso", "component-definition", "—", "support_documents", "draft", { kind: "docs", includes: "Architecture" }),
  row("p1-bound", "1", "SP 800-37 P-11", "P-11", "Draw the boundary", "Authorization Boundary", true, "in · out · interconnects", "Architecture Agent", "CMDB · cloud · CDS", "examine", "boundary.snapshot", "owner", "authorization-boundary", "boundary", "systems", "owner confirms", { kind: "field", name: "boundary" }),
  row("p1-isa", "1", "CA-3", "P-11", "Interconnections", "System Interconnection Inventory", true, "partner · agreement · flow", "Architecture Agent", "ISA · MOU", "examine", "none", "isso", "—", "ISA count", "interconnections", "in review", { kind: "field", name: "interconnects" }),
  row("p1-mission", "1", "SP 800-37 P-8", "P-8", "Mission context", "Mission/Business Process Description", true, "mission · business function", "Policy Agent", "mission charter", "examine", "none", "owner", "—", "mission", "systems · organizations", "attached", { kind: "field", name: "mission" }),
  row("p1-types", "1", "SP 800-60", "P-12", "Information types", "Information Types Inventory", true, "type · owner · CIA", "Architecture Agent", "800-60 · steward", "examine", "none", "owner", "information-type", "info types", "systems.data_types", "feeds categorize", { kind: "field", name: "dataTypes" }),
  row("p1-roles", "1", "SP 800-37 P-9", "P-9", "Assign system roles", "System Roles", true, "AO · SO · ISSO · SCA", "RMF Orchestrator", "personnel", "examine", "none", "owner", "roles", "role roster", "personnel", "assigned", { kind: "field", name: "roles" }),
  row("p1-deps", "1", "SA-9 · SR-3", "P-10", "External dependencies", "External Dependencies", true, "partner · service · risk", "CMDB Agent", "CMDB · contracts", "examine", "none", "owner", "leveraged-authorizations", "supply", "systems.extra", "draft", { kind: "field", name: "discovery" }),
  row("p1-ccp", "1", "SP 800-37 P-5", "P-5", "Common controls", "Common-Control Inventory", true, "provider · control · consumer", "Inheritance Agent", "Argus · Vanguard", "examine", "allocate", "isso", "profile", "inheritance", "implementations", "inherited not ATO", { kind: "table", name: "implementations" }),

  row("p2-types", "2", "FIPS 199 · 800-60", "C-1", "Identify information types", "Information Types", true, "type · description · owner · sensitivity · C · I · A · rationale", "Categorize Agent", "data dictionary · privacy · mission · contracts", "examine", "fips199.classify", "owner", "information-type", "impact levels", "systems.extra", "draft CIA", { kind: "field", name: "cia" }),
  row("p2-ws", "2", "FIPS 199", "C-1", "CIA worksheet", "Categorization Worksheet", true, "per-type CIA · high-water mark", "Categorize Agent", "800-60", "examine", "sp800-60.map", "owner", "system-characteristics", "categorization", "support_documents · evidence", "human approval", { kind: "docs", includes: "categoriz" }),
  row("p2-scr", "2", "SP 800-37 C-2", "C-2", "Security Categorization Report", "Security Categorization Report", true, "proposed impact · rationale · evidence", "Categorize Agent", "worksheet · mission impact", "examine", "none", "ao", "system-security-plan", "FIPS 199", "support_documents", "AO later confirms", { kind: "docs", includes: "FIPS 199" }),
  row("p2-mbia", "2", "SP 800-37 C-1", "C-1", "Mission impact", "Mission/Business Impact Analysis", true, "mission · availability · integrity", "Architecture Agent", "mission · contracts", "examine", "none", "owner", "—", "mission impact", "support_documents", "draft", { kind: "docs", includes: "impact" }),
  row("p2-pia", "2", "PT-2 · privacy", "C-1", "Privacy overlay trigger", "Privacy Impact Information", true, "PII · SORN · PIA", "Policy Agent", "privacy program · PT", "examine", "none", "saiso", "—", "privacy", "artifacts.pia", "if PII", { kind: "pkg", artifact: "pia" }),

  row("p3-base", "3", "SP 800-53B", "S-1", "Apply baseline", "Security Control Baseline", true, "low/mod/high · privacy", "Select Agent", "800-53B · org baseline", "examine", "sp800-53b.baseline", "isso", "profile", "baseline", "implementations", "selected set", { kind: "table", name: "implementations" }),
  row("p3-tailor", "3", "SP 800-53B", "S-2", "Tailor", "Tailoring Workbook", true, "adds · drops · overlays · rationale", "Select Agent", "org · mission · tech", "examine", "overlay.apply", "isso", "profile", "tailoring", "implementations", "not ATO", { kind: "pkg", artifact: "overlay" }),
  row("p3-sel", "3", "SP 800-37 S-1", "S-1", "Record selection", "Control Selection Record", true, "control · baseline · overlay", "Select Agent", "catalog", "examine", "none", "isso", "profile", "control count", "implementations", "tailored", { kind: "table", name: "implementations" }),
  row("p3-alloc", "3", "SP 800-37 S-3", "S-3", "Allocate", "Control Allocation", true, "common · hybrid · system-specific", "Inheritance Agent", "CCP · SSP", "examine", "inheritance.allocate", "isso", "implemented-requirement", "allocation", "implementations", "COMMON/HYBRID/SYSTEM", { kind: "table", name: "implementations" }),
  row("p3-ccp", "3", "SP 800-37 P-5", "S-3", "Identify CCP", "Common Control Identification", true, "provider · inherited by", "Inheritance Agent", "Argus · Vanguard", "examine", "none", "isso", "leveraged-authorizations", "inheritance", "implementations", "inherited", { kind: "table", name: "implementations" }),
  row("p3-hyb", "3", "SP 800-53", "S-3", "Hybrid split", "Hybrid Control Identification", true, "provider part · customer part", "Inheritance Agent", "CCP · overlay", "examine", "none", "isso", "implemented-requirement", "hybrid", "implementations", "customer residual", { kind: "table", name: "implementations" }),
  row("p3-sys", "3", "SP 800-53", "S-3", "System-specific", "System-Specific Control Identification", true, "control · owner", "Select Agent", "boundary", "examine", "none", "isso", "implemented-requirement", "system-owned", "implementations", "system", { kind: "table", name: "implementations" }),
  row("p3-param", "3", "SP 800-53", "S-2", "Parameters", "Control Parameter Definitions", true, "org values · system values", "Select Agent", "org baseline", "examine", "none", "saiso", "set-parameter", "parameters", "org_rmf_baselines", "org first", { kind: "org", canonical: "cms" }),

  row("p4-ssp", "4", "SP 800-18 · PL-2", "I-1", "Build the SSP", "System Security Plan", true, "components · architecture · controls · evidence", "SSP Agent", "inventory · impl · params", "examine", "ssp.generate", "isso", "system-security-plan", "SSP", "systems.ssp_draft · artifacts", "draft OSCAL/PDF/JSON", { kind: "pkg", artifact: "ssp" }),
  row("p4-cis", "4", "SP 800-53", "I-2", "Implementation statements", "Control Implementation Statements", true, "control · how · who · evidence", "SSP Agent", "IAM · cloud · tickets", "examine", "impl.stamp", "isso", "implemented-requirement", "implementations", "implementations", "not satisfied yet", { kind: "table", name: "implementations" }),
  row("p4-arch", "4", "PL-8", "I-1", "Security architecture", "Security Architecture", true, "trust · zones · inheritance", "Architecture Agent", "EA · SA", "examine", "none", "isso", "component-definition", "—", "support_documents", "draft", { kind: "docs", includes: "Architecture" }),
  row("p4-inv", "4", "CM-8", "I-1", "Living inventory", "System Inventory", true, "CIs · drift", "CMDB Agent", "CMDB · Terraform", "test", "collector", "isso", "system-implementation", "inventory", "assets", "continuous", { kind: "field", name: "assets" }),
  row("p4-iam", "4", "AC-2 · IA-2", "I-2", "IAM configuration", "IAM configuration", false, "accounts · MFA · JIT", "IAM Agent", "Entra · AD · AWS IAM · Okta", "test", "iam.export", "none", "component-definition", "—", "evidence", "feeds assess", { kind: "table", name: "evidence" }),
  row("p4-tf", "4", "CM-2 · CM-6", "I-2", "IaC state", "Terraform / cloud configuration", false, "state · drift", "Cloud Agent", "Terraform · AWS Config", "test", "terraform.get_state", "none", "component-definition", "—", "evidence", "feeds assess", { kind: "table", name: "evidence" }),
  row("p4-cp", "4", "CP-2", "I-1", "Contingency", "Contingency Plan", true, "RTO · RPO · roles", "Policy Agent", "CP policy", "examine", "none", "isso", "component-definition", "CP", "artifacts.cpt", "package", { kind: "pkg", artifact: "cpt" }),
  row("p4-ir", "4", "IR-8", "I-1", "IR documentation", "Incident Response Plan", true, "playbooks · contacts", "Policy Agent", "org IRP", "examine", "none", "isso", "—", "IR", "support_documents", "package", { kind: "docs", includes: "Incident" }),

  row("p5-sap", "5", "SP 800-53A", "A-1", "Plan the assessment", "Security Assessment Plan", true, "scope · methods · team", "Assessment Orchestrator", "catalog · org cadence", "examine", "none", "sca", "assessment-plan", "SAP", "artifacts.sap", "SCA issues", { kind: "pkg", artifact: "sap" }),
  row("p5-obj", "5", "SP 800-53A", "A-2", "Objectives", "Assessment Objectives", true, "objective · method · result", "Assessment Agent", "800-53A", "examine · interview · test", "recordObjective", "sca", "assessment-results", "coverage", "assessment_objectives", "no skip to PASS", { kind: "table", name: "assessments" }),
  row("p5-evd", "5", "SP 800-53A", "A-3", "Collect evidence", "Evidence Index", true, "source · hash · freshness", "Evidence Agent", "IAM · SIEM · EDR · CMDB · HR", "examine", "collection.run", "none", "observation", "evidence currency", "evidence", "gates 1–4", { kind: "table", name: "evidence" }),
  row("p5-test", "5", "SP 800-53A", "A-3", "Technical tests", "Test Results", true, "control · method · result", "Technical Agents", "cloud · vuln · IAM", "test", "800-53A test", "sca", "local-definitions", "tests", "test_results", "gate 6", { kind: "table", name: "assessments" }),
  row("p5-find", "5", "SP 800-53A", "A-4", "Findings", "Findings", true, "control · deficiency · risk", "Control Assessor Agent", "tests · conflicts", "examine", "none", "sca", "finding", "findings", "findings", "not POA&M close", { kind: "table", name: "findings" }),
  row("p5-sar", "5", "SP 800-37 A-6", "A-6", "SAR", "Security Assessment Report", true, "results · residual · recommend", "Control Assessor Agent", "objectives · evidence", "examine", "oscal.import_sar", "sca", "assessment-results", "SAR", "artifacts.sar", "SCA official", { kind: "pkg", artifact: "sar" }),
  row("p5-contra", "5", "SP 800-53A", "A-4", "Contradiction log", "Contradiction Detection", true, "policy vs IAM vs SSP", "Assessment Agent", "multi-source", "examine · test", "correlate", "sca", "observation", "conflicts", "evidence · findings", "STOP if conflict", { kind: "table", name: "findings" }),
  row("p5-pkg", "5", "SP 800-53A", "A-6", "Evidence package", "Assessment Evidence Package", true, "plan · evidence · tests · recs", "Assessment Orchestrator", "all assess artifacts", "mixed", "deep assessment", "sca", "assessment-results", "assessment package", "assessments", "human review required", { kind: "table", name: "assessments" }),

  row("p6-ssp", "6", "SP 800-37 R-1", "R-1", "Package SSP", "System Security Plan", true, "current SSP", "SSP Agent", "phase 4", "examine", "package.stage", "ao", "system-security-plan", "package", "artifacts.ssp", "AO reads, does not auto-sign", { kind: "pkg", artifact: "ssp" }),
  row("p6-sap", "6", "R-1", "R-1", "Package SAP", "Security Assessment Plan", true, "scope", "Assessment Agent", "phase 5", "examine", "none", "ao", "assessment-plan", "package", "artifacts.sap", "AO", { kind: "pkg", artifact: "sap" }),
  row("p6-sar", "6", "R-1", "R-1", "Package SAR", "Security Assessment Report", true, "results", "Assessment Agent", "SCA", "examine", "none", "ao", "assessment-results", "package", "artifacts.sar", "AO", { kind: "pkg", artifact: "sar" }),
  row("p6-poam", "6", "CA-5", "R-2", "POA&M", "Plan of Action and Milestones", true, "weakness · milestone · owner", "POA&M Agent", "findings", "examine", "none", "ao", "plan-of-action-and-milestones", "POA&M", "poams", "engine never closes", { kind: "pkg", artifact: "poam" }),
  row("p6-risk", "6", "RA-3", "R-2", "Risk register", "Risk Register", true, "likelihood · impact · residual", "Risk Agent", "findings · vulns", "examine", "risk.residual", "ao", "risk", "risk", "risks", "AO accepts residual", { kind: "table", name: "risks" }),
  row("p6-idx", "6", "SP 800-37 R-1", "R-1", "Evidence index", "Evidence Index", true, "hash · source · control", "Evidence Agent", "evidence", "examine", "none", "ao", "observation", "evidence", "evidence", "package item 7", { kind: "table", name: "evidence" }),
  row("p6-ato", "6", "CA-6", "R-4", "Authorization decision", "Authorization Decision Document", true, "decision · conditions · expiry", "— human only —", "package", "examine", "none", "ao", "—", "ATO status", "authorization_history", "ONLY AO", { kind: "pkg", artifact: "ato" }),
  row("p6-oscal", "6", "OSCAL 1.1.3", "R-1", "Machine-readable package", "OSCAL artifacts", true, "catalog · profile · SSP · SAP · SAR · POA&M", "SSP Agent", "internal DB", "examine", "buildOscalPackage", "isso", "full model", "exchange", "derived", "exchange layer", { kind: "pkg", artifact: "ssp" }),

  row("p7-cms", "7", "CA-7", "M-1", "Execute ConMon", "Continuous Monitoring Strategy", true, "cadence · metrics", "Monitor Agent", "org CMS", "test", "collection.run", "isso", "—", "ISCM", "artifacts.conmon", "org cadence not generic", { kind: "pkg", artifact: "conmon" }),
  row("p7-chg", "7", "CM-3 · CM-4", "M-2", "Detect change", "Change Detection", true, "what · when · control impact", "Cloud Agent", "Terraform · cloud · IAM", "test", "whatChanged", "none", "observation", "change", "config_changes", "material?", { kind: "table", name: "collection" }),
  row("p7-re", "7", "CA-7", "M-3", "Reassess on material change", "Reassessment Record", true, "controls · results", "Assessment Orchestrator", "change · 800-53A", "test", "engine assess", "sca", "assessment-results", "reassessment", "assessments", "human oversight", { kind: "table", name: "assessments" }),
  row("p7-vuln", "7", "RA-5 · SI-2", "M-2", "Vulnerability watch", "Vulnerability findings", true, "CVE · KEV · SLO", "Vuln Agent", "Tenable · Qualys · KEV", "test", "scan ingest", "none", "finding", "vulns", "vulnerabilities", "KEV SLO from org baseline", { kind: "table", name: "findings" }),
  row("p7-auth", "7", "CA-6", "M-5", "Authorization state", "Authorization state", true, "ATO · conditions · cATO", "— human only —", "ConMon · risk", "examine", "none", "ao", "—", "ATO", "systems.ato_status", "engine never flips ATO", { kind: "pkg", artifact: "ato" }),

  row("f-schema", "fisma", "FISMA", "—", "Configure reporting schema", "FISMA Reporting Schema", true, "fields · agency · year", "Reports Agent", "agency config", "examine", "none", "saiso", "—", "schema", "derived", "not one frozen report", { kind: "org", canonical: "ispp" }),
  row("f-dash", "fisma", "FISMA", "—", "Agency dashboard", "FISMA Dashboard", true, "systems · ATO · POA&M · vulns · incidents", "Reports Agent", "portfolio", "examine", "fismaMetrics", "saiso", "—", "dashboard", "systems · poams · incidents", "accountability not RMF", { kind: "table", name: "poams" }),
  row("f-inv", "fisma", "FISMA", "—", "System inventory report", "FISMA System Inventory", true, "id · impact · ATO", "Reports Agent", "systems", "examine", "none", "saiso", "—", "inventory", "systems", "annual/quarterly per agency", { kind: "field", name: "mission" }),
  row("f-poam", "fisma", "FISMA", "—", "POA&M aging", "POA&M Report", true, "open · overdue · risk", "Reports Agent", "poams", "examine", "none", "saiso", "plan-of-action-and-milestones", "POA&M", "poams", "agency schema", { kind: "table", name: "poams" }),
];

export const QUALITY_GATES = [
  { id: "g1", name: "Evidence completeness", fail: "Required evidence missing. Assessment cannot be finalized." },
  { id: "g2", name: "Evidence freshness", fail: "Stale configuration. Re-collect before a determination." },
  { id: "g3", name: "Evidence authenticity", fail: "Source, timestamp, hash, or provenance incomplete." },
  { id: "g4", name: "Evidence relevance", fail: "Artifact does not address the assessment objective." },
  { id: "g5", name: "Assessment coverage", fail: "Uncovered assessment objectives remain." },
  { id: "g6", name: "Technical verification", fail: "Required TEST not executed." },
  { id: "g7", name: "Contradiction detection", fail: "Conflict between policy, IAM, SSP, or telemetry. Investigate." },
  { id: "g8", name: "Human review", fail: "SCA has not recorded the official determination." },
] as const;

export const AGENT_HIERARCHY = [
  { id: "rmf", name: "RMF Orchestrator", reportsTo: null },
  { id: "assess-orch", name: "Assessment Orchestrator", reportsTo: "rmf" },
  { id: "evidence", name: "Evidence Agents", reportsTo: "assess-orch" },
  { id: "technical", name: "Technical Agents", reportsTo: "assess-orch" },
  { id: "document", name: "Document Agents", reportsTo: "assess-orch" },
  { id: "assessor", name: "Control Assessor Agent", reportsTo: "assess-orch" },
  { id: "human", name: "Human assessor / AO", reportsTo: "assessor" },
] as const;

export interface MatrixCoverage {
  row: MatrixRow;
  status: MatrixStatus;
  note: string;
}

export interface SystemUnderstanding {
  name: string;
  acronym: string;
  components: number;
  applications: number;
  servers: number;
  containers: number;
  databases: number;
  cloud: string;
  interfaces: number;
  dataTypes: string[];
  boundary: "identified" | "draft";
  inherited: number;
  unofficial: true;
}

function probeStatus(p: PortfolioSnapshot, systemId: string, probe: MatrixProbe): { ok: boolean; official: boolean; note: string } {
  const system = p.systems.find((s) => s.id === systemId);
  switch (probe.kind) {
    case "org": {
      const kinds = p.orgArtifactKinds ?? [];
      const kind = kinds.find((k) => k.id === probe.canonical || k.canonicalId === probe.canonical);
      const docs = (p.orgArtifacts ?? []).filter((a) => {
        if (a.kindId === probe.canonical || a.kindId === kind?.id) return true;
        const src = kinds.find((k) => k.id === a.kindId);
        return Boolean(src && (src.canonicalId === probe.canonical || src.canonicalId === kind?.canonicalId));
      });
      if (!docs.length) return { ok: false, official: false, note: "Required org artifact missing." };
      const attached = docs.filter((d) => d.status === "attached");
      const published = (p.orgRmfBaselines ?? []).some((b) => b.status === "published");
      return {
        ok: attached.length > 0 || docs.length > 0,
        official: attached.length > 0 && (probe.canonical !== "cms" || published || attached.length > 0),
        note: `${docs.length} org document(s).`,
      };
    }
    case "docs": {
      const docs = (p.supportDocuments ?? []).filter(
        (d) => d.systemId === systemId && d.title.toLowerCase().includes(probe.includes.toLowerCase()),
      );
      if (!docs.length) {
        const org = (p.orgArtifacts ?? []).filter((d) => d.title.toLowerCase().includes(probe.includes.toLowerCase()));
        if (org.length) return { ok: true, official: org.some((d) => d.status === "attached"), note: `${org.length} org document(s).` };
        return { ok: false, official: false, note: "No matching support document." };
      }
      return { ok: true, official: docs.some((d) => d.status === "attached"), note: `${docs.length} support document(s).` };
    }
    case "field": {
      if (!system) return { ok: false, official: false, note: "No system." };
      if (probe.name === "assets") {
        const n = p.assets.filter((a) => a.systemId === systemId).length;
        return { ok: n > 0, official: Boolean(system.extra.discoveryAt), note: `${n} CIs.` };
      }
      if (probe.name === "boundary") {
        const ok = system.authorizationBoundary.length > 24 && !/to be drawn/i.test(system.authorizationBoundary);
        return { ok, official: Boolean(system.extra.discoveryAt), note: ok ? "Boundary text present." : "Boundary not drawn." };
      }
      if (probe.name === "interconnects") {
        const n = (p.interconnections ?? []).filter((i) => i.systemId === systemId).length;
        return { ok: n > 0, official: false, note: `${n} interconnect(s).` };
      }
      if (probe.name === "cia") {
        const ok = Boolean(system.extra.confidentiality && system.extra.integrity && system.extra.availability);
        return { ok, official: false, note: ok ? `C ${system.extra.confidentiality} / I ${system.extra.integrity} / A ${system.extra.availability}.` : "CIA not recorded." };
      }
      if (probe.name === "ssp") {
        return { ok: Boolean(system.sspDraft), official: false, note: system.sspDraft ? "SSP draft on file." : "No SSP draft." };
      }
      if (probe.name === "discovery") {
        return { ok: Boolean(system.extra.discoveryAt || (system.extra.dependencies ?? []).length), official: false, note: system.extra.discoveryAt ? "Discovery pass recorded." : "No discovery pass." };
      }
      if (probe.name === "roles") {
        const n = p.personnel.filter((x) => x.systemId === systemId || x.orgId === system.extra.orgId).length;
        return { ok: n > 0, official: true, note: `${n} role assignment(s).` };
      }
      if (probe.name === "dataTypes") {
        return { ok: system.dataTypes.length > 0, official: false, note: system.dataTypes.join(", ") || "none" };
      }
      return { ok: Boolean(system.mission), official: true, note: "Mission on register." };
    }
    case "pkg": {
      const arts = artifactsFor(p, systemId);
      const a = arts.find((x) => x.kind === probe.artifact);
      if (!a || a.status === "missing") return { ok: false, official: false, note: `${probe.artifact} missing.` };
      const official = a.status === "approved";
      return { ok: true, official, note: `${a.title} · ${a.status}.` };
    }
    case "table": {
      if (probe.name === "implementations") {
        const n = p.implementations.filter((i) => i.systemId === systemId && i.status !== "not_applicable").length;
        return { ok: n > 0, official: false, note: `${n} tailored controls.` };
      }
      if (probe.name === "assessments") {
        const n = p.assessments.filter((a) => a.systemId === systemId).length;
        return { ok: n > 0, official: p.assessments.some((a) => a.systemId === systemId && a.status === "complete"), note: `${n} assessment record(s).` };
      }
      if (probe.name === "poams") {
        const n = p.poams.filter((x) => x.systemId === systemId).length;
        return { ok: n > 0, official: false, note: `${n} POA&M.` };
      }
      if (probe.name === "evidence") {
        const n = p.evidence.filter((e) => e.systemId === systemId).length;
        return { ok: n > 0, official: false, note: `${n} evidence objects.` };
      }
      if (probe.name === "findings") {
        const n = p.findings.filter((f) => f.systemId === systemId).length;
        return { ok: n > 0, official: false, note: `${n} findings.` };
      }
      if (probe.name === "risks") {
        const n = p.risks.filter((r) => r.systemId === systemId).length;
        return { ok: n > 0, official: p.risks.some((r) => r.systemId === systemId && r.status === "accepted"), note: `${n} risks.` };
      }
      const n = (p.collectionJobs ?? []).filter((j) => j.systemId === systemId).length;
      return { ok: n > 0, official: false, note: `${n} collection jobs.` };
    }
  }
}

export function coverMatrix(p: PortfolioSnapshot, systemId: string): MatrixCoverage[] {
  return MASTER_MATRIX.map((row) => {
    const hit = probeStatus(p, systemId, row.probe);
    let status: MatrixStatus = "missing";
    if (hit.ok && hit.official) status = "official";
    else if (hit.ok && (row.human === "ao" || row.human === "sca") && !hit.official) status = "blocked";
    else if (hit.ok) status = row.human === "none" ? "attached" : "draft";
    const note =
      status === "blocked"
        ? `${hit.note} Human (${row.human}) must record the official result. AI does not.`
        : hit.note;
    return { row, status, note };
  });
}

export function matrixSummary(rows: MatrixCoverage[]) {
  const required = rows.filter((r) => r.row.required);
  const covered = required.filter((r) => r.status !== "missing");
  const blocked = required.filter((r) => r.status === "blocked");
  const official = required.filter((r) => r.status === "official");
  const missing = required.filter((r) => r.status === "missing");
  const pct = required.length ? Math.round((covered.length / required.length) * 100) : 0;
  return { required: required.length, covered: covered.length, blocked: blocked.length, official: official.length, missing: missing.length, pct };
}

export function systemUnderstanding(p: PortfolioSnapshot, systemId: string): SystemUnderstanding | null {
  const system = p.systems.find((s) => s.id === systemId);
  if (!system) return null;
  const assets = p.assets.filter((a) => a.systemId === systemId);
  const impls = p.implementations.filter((i) => i.systemId === systemId && i.status !== "not_applicable");
  const inherited = impls.filter((i) => originationOf(i, systemId, i.controlId).type === "inherited").length;
  const kind = (re: RegExp) => assets.filter((a) => re.test(`${a.kind} ${a.name}`)).length;
  return {
    name: system.name,
    acronym: system.acronym,
    components: system.extra.components || assets.length,
    applications: system.extra.applications?.length || kind(/app|api|ui|gateway/i),
    servers: kind(/server|windows|linux|host|bastion/i),
    containers: kind(/kubernetes|eks|container|pod/i),
    databases: kind(/database|aurora|rds|kafka|broker|storage/i),
    cloud: [system.hosting, system.cloudProvider].filter(Boolean).join(" · "),
    interfaces: system.extra.interfaces || (p.interconnections ?? []).filter((i) => i.systemId === systemId).length,
    dataTypes: system.dataTypes,
    boundary: system.authorizationBoundary.length > 24 && !/to be drawn/i.test(system.authorizationBoundary) ? "identified" : "draft",
    inherited,
    unofficial: true,
  };
}

export function phaseForStep(step: RmfStep): MatrixPhase {
  if (step === "prepare") return "1";
  if (step === "categorize") return "2";
  if (step === "select") return "3";
  if (step === "implement") return "4";
  if (step === "assess") return "5";
  if (step === "authorize") return "6";
  return "7";
}
