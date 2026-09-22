import { RMF_STEP_META, RMF_STEPS } from "./cycle";
import { defaultSspBody } from "./layer1";
import { impactTrio, packageCompleteness } from "./package";
import type { ArtifactKind, AtoStatus, PortfolioSnapshot, RmfStep, SystemRecord, WorkflowGateId } from "./types";

export interface EngineStepDef {
  id: RmfStep;
  name: string;
  short: string;
  index: number;
  automation: string;
  human: string;
  gate: WorkflowGateId;
  tools: string[];
}

export const ENGINE_STEPS: EngineStepDef[] = [
  {
    id: "prepare",
    name: "Prepare",
    short: "Context",
    index: 0,
    automation: "Register boundary, inventory, stakeholders, and risk strategy.",
    human: "Org-level Prepare (Phase 0) must already exist. System owner / ISSO already on the record.",
    gate: "isso_implement",
    tools: ["cmdb.inventory", "boundary.snapshot", "personnel.register"],
  },
  {
    id: "categorize",
    name: "Categorize",
    short: "FIPS 199",
    index: 1,
    automation: "Derive CIA from information types and write the categorization worksheet.",
    human: "None unless the AO rejects the high-water mark later.",
    gate: "isso_implement",
    tools: ["fips199.classify", "sp800-60.map"],
  },
  {
    id: "select",
    name: "Select",
    short: "Baseline",
    index: 2,
    automation: "Apply the 800-53B baseline, overlay, and inheritance allocation.",
    human: "None. Tailoring is recorded; ISSO can still edit the baseline.",
    gate: "isso_implement",
    tools: ["sp800-53b.baseline", "overlay.apply", "inheritance.allocate"],
  },
  {
    id: "implement",
    name: "Implement",
    short: "Build",
    index: 3,
    automation: "Refresh SSP statements from inventory and stamp last-verified on implemented controls.",
    human: "None. Draft SSP still needs ISSO review before AO use.",
    gate: "isso_submit",
    tools: ["ssp.generate", "impl.stamp"],
  },
  {
    id: "assess",
    name: "Assess",
    short: "800-53A",
    index: 4,
    automation: "Collect enabled feeds and ingest OSCAL SAR into examine / interview / test.",
    human: "SCA may override a result. Engine does not close a POA&M.",
    gate: "sca_assess",
    tools: ["collection.run", "oscal.import_sar", "assessment.record_objectives"],
  },
  {
    id: "authorize",
    name: "Authorize",
    short: "ATO",
    index: 5,
    automation: "Stage residual risk and the authorization package. Stop.",
    human: "Required. Only the AO issues an ATO or accepts residual risk.",
    gate: "ao_decision",
    tools: ["package.stage", "risk.residual"],
  },
  {
    id: "monitor",
    name: "Monitor",
    short: "ConMon",
    index: 6,
    automation: "Collectors remap telemetry to 800-53A. Does not authorize.",
    human: "None for collection. AO still owns ongoing authorization.",
    gate: "conmon",
    tools: ["collection.run", "ca-7.refresh"],
  },
];

export function nextEngineCursor(step: RmfStep): RmfStep {
  const i = RMF_STEPS.indexOf(step);
  if (i < 0 || i >= RMF_STEPS.length - 1) return "monitor";
  return RMF_STEPS[i + 1]!;
}

export function engineCursorOf(system: SystemRecord): RmfStep {
  return system.extra.engineCursor ?? "prepare";
}

export function rmfAfter(
  current: RmfStep,
  executed: RmfStep,
  ato: AtoStatus,
): RmfStep {
  const ci = RMF_STEPS.indexOf(current);
  const ei = RMF_STEPS.indexOf(executed);
  if (executed === "authorize") {
    if (ato === "authorized" || ato === "authorized_with_conditions") return current;
    return ci <= RMF_STEPS.indexOf("authorize") ? "authorize" : current;
  }
  if (executed === "monitor") {
    if (ato === "authorized" || ato === "authorized_with_conditions") return "monitor";
    return current;
  }
  if (ei < ci) return current;
  return RMF_STEPS[ei + 1] ?? current;
}

export function automatedPrefix(): RmfStep[] {
  return ["prepare", "categorize", "select", "implement", "assess", "authorize", "monitor"];
}

export function isAoGate(system: SystemRecord): boolean {
  return system.rmfStep === "authorize" || engineCursorOf(system) === "monitor";
}

export interface EngineEvidence {
  controlId: string;
  title: string;
  summary: string;
}

export interface EngineSsp {
  sectionId: string;
  title: string;
  body: string;
}

export function planEvidence(p: PortfolioSnapshot, system: SystemRecord, step: RmfStep): EngineEvidence[] {
  const assets = p.assets.filter((a) => a.systemId === system.id);
  const cia = impactTrio(system);
  const selected = p.implementations.filter((i) => i.systemId === system.id && i.status !== "not_applicable");
  const implemented = selected.filter((i) => i.status === "implemented" || i.status === "inherited");
  const people = p.personnel.filter((x) => x.systemId === system.id);
  switch (step) {
    case "prepare":
      return [
        {
          controlId: "CM-8",
          title: "Engine — information system inventory",
          summary: `${assets.length} assets in the authorization boundary. ${assets.map((a) => a.name).slice(0, 8).join(", ") || "CMDB empty"}.`,
        },
        {
          controlId: "PM-9",
          title: "Engine — risk management strategy",
          summary: `Stakeholders: ${people.map((x) => `${x.role} (${x.name})`).join(", ") || system.issoRole}. Strategy bound to ${system.acronym}.`,
        },
        {
          controlId: "RA-3",
          title: "Engine — risk assessment context",
          summary: `Mission: ${system.mission} Data types: ${system.dataTypes.join(", ")}.`,
        },
      ];
    case "categorize":
      return [
        {
          controlId: "RA-2",
          title: "Engine — FIPS 199 categorization",
          summary: `Confidentiality ${cia.confidentiality}, integrity ${cia.integrity}, availability ${cia.availability}. High-water mark ${system.impactLevel}. Types: ${system.dataTypes.join(", ")}.`,
        },
      ];
    case "select":
      return [
        {
          controlId: "PL-2",
          title: "Engine — control selection",
          summary: `${selected.length} controls selected from the ${system.extra.baseline} baseline · overlay ${system.extra.overlay ?? "none"}. SSP remains a draft until ISSO/AO approve.`,
        },
      ];
    case "implement":
      return [
        {
          controlId: "PL-8",
          title: "Engine — as-built architecture",
          summary: `${implemented.length}/${selected.length} implemented or inherited. Boundary: ${system.authorizationBoundary.slice(0, 180)}`,
        },
      ];
    case "authorize": {
      const complete = packageCompleteness(p, system.id);
      const poams = p.poams.filter((x) => x.systemId === system.id && x.status !== "completed");
      const high = poams.filter((x) => x.riskLevel === "high" || x.riskLevel === "critical");
      return [
        {
          controlId: "CA-6",
          title: "Engine — residual risk staged for AO",
          summary: `Package ${complete.overall}%. Open POA&M ${poams.length} (${high.length} high/critical). Engine does not authorize.`,
        },
      ];
    }
    case "monitor":
      return [
        {
          controlId: "CA-7",
          title: "Engine — continuous monitoring strategy",
          summary: "Collectors remap telemetry to 800-53A on a user-initiated cadence. Authorization is not modified.",
        },
      ];
    default:
      return [];
  }
}

export function planSsp(p: PortfolioSnapshot, system: SystemRecord, step: RmfStep): EngineSsp[] {
  const ids =
    step === "prepare"
      ? ["1", "2", "4"]
      : step === "categorize"
        ? ["3", "7"]
        : step === "select"
          ? ["11", "12"]
          : step === "implement"
            ? ["5", "8", "14"]
            : step === "monitor"
              ? ["15"]
              : [];
  return ids.map((id) => ({
    sectionId: id,
    title: (
      {
        "1": "System identification",
        "2": "System environment",
        "3": "System categorization",
        "4": "Authorization boundary",
        "5": "Architecture",
        "7": "Information types",
        "8": "System components",
        "11": "Control implementations",
        "12": "Common controls",
        "14": "System-specific controls",
        "15": "Continuous monitoring",
      } as Record<string, string>
    )[id] ?? id,
    body: defaultSspBody(system, id, p),
  }));
}

export function planArtifacts(step: RmfStep): ArtifactKind[] {
  switch (step) {
    case "prepare":
      return ["ssp", "isa"];
    case "categorize":
      return ["pia", "overlay"];
    case "select":
      return ["ssp", "overlay"];
    case "implement":
      return ["ssp", "cpt"];
    case "assess":
      return ["sap", "sar"];
    case "authorize":
      return ["poam", "ato"];
    case "monitor":
      return ["conmon"];
  }
}

export function stepSummary(p: PortfolioSnapshot, system: SystemRecord, step: RmfStep): string {
  const meta = RMF_STEP_META[step];
  const selected = p.implementations.filter((i) => i.systemId === system.id && i.status !== "not_applicable").length;
  const cia = impactTrio(system);
  switch (step) {
    case "prepare":
      return `${meta.name}: inventory ${p.assets.filter((a) => a.systemId === system.id).length} assets · ${p.personnel.filter((x) => x.systemId === system.id).length} roles. ATO unchanged.`;
    case "categorize":
      return `${meta.name}: ${cia.confidentiality}/${cia.integrity}/${cia.availability} → ${system.impactLevel}. ATO unchanged.`;
    case "select":
      return `${meta.name}: ${selected} controls · ${system.extra.baseline} baseline. ATO unchanged.`;
    case "implement":
      return `${meta.name}: SSP draft refreshed from live inventory. ATO unchanged.`;
    case "assess":
      return `${meta.name}: collection + SAR ingest. ATO unchanged.`;
    case "authorize":
      return `${meta.name}: residual risk staged. AO decision required. ATO unchanged (${system.atoStatus}).`;
    case "monitor":
      return `${meta.name}: ConMon collectors. ATO unchanged.`;
  }
}
