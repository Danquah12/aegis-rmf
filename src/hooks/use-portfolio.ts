import { useQuery } from "@tanstack/react-query";
import { getPortfolio } from "@/lib/grc/queries";
import { computeReadiness, implementationScore } from "@/lib/grc/scoring";
import { FAMILY_ORDER } from "@/lib/grc/families";
import { familyOf } from "@/lib/grc/catalog";
import type { PortfolioSnapshot, SystemRecord } from "@/lib/grc/types";

export function usePortfolio(initial?: PortfolioSnapshot) {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: () => getPortfolio(),
    initialData: initial,
  });
}

export function systemSlice(p: PortfolioSnapshot, systemId: string) {
  const system = p.systems.find((s) => s.id === systemId);
  const implementations = p.implementations.filter((i) => i.systemId === systemId);
  const evidence = p.evidence.filter((e) => e.systemId === systemId);
  const findings = p.findings.filter((f) => f.systemId === systemId);
  const poams = p.poams.filter((x) => x.systemId === systemId);
  const assessments = p.assessments.filter((a) => a.systemId === systemId);
  const agentRuns = p.agentRuns.filter((r) => r.systemId === systemId);
  const assets = p.assets.filter((a) => a.systemId === systemId);
  const vulnerabilities = p.vulnerabilities.filter((v) => v.systemId === systemId);
  const artifacts = p.artifacts.filter((a) => a.systemId === systemId);
  const workflowEvents = p.workflowEvents.filter((e) => e.systemId === systemId);
  const testResults = p.testResults.filter((t) => t.systemId === systemId);
  const interconnections = p.interconnections.filter((i) => i.systemId === systemId);
  const personnel = p.personnel.filter((x) => x.systemId === systemId);
  const risks = p.risks.filter((x) => x.systemId === systemId);
  const tickets = p.tickets.filter((x) => x.systemId === systemId);
  const sspSections = p.sspSections.filter((x) => x.systemId === systemId);
  const objectives = p.objectives.filter((x) => x.systemId === systemId);
  const configChanges = p.configChanges.filter((x) => x.systemId === systemId);
  const authorizationHistory = p.authorizationHistory.filter((x) => x.systemId === systemId);
  const connectorBindings = p.connectorBindings.filter((x) => x.systemId === systemId);
  const collectionJobs = p.collectionJobs.filter((x) => x.systemId === systemId);
  const incidents = p.incidents.filter((x) => x.systemId === systemId);
  const whatIfRuns = p.whatIfRuns.filter((x) => x.systemId === systemId);
  const interviews = p.interviews.filter((x) => x.systemId === systemId);
  const inheritanceProposals = p.inheritanceProposals.filter((x) => x.systemId === systemId);
  const catoReviews = p.catoReviews.filter((x) => x.systemId === systemId);
  const readiness = system
    ? computeReadiness({
        implementations,
        evidence,
        poams,
        findings,
        hasSsp: Boolean(system.sspDraft) || system.atoStatus !== "in_assessment",
      })
    : null;
  return {
    system,
    implementations,
    evidence,
    findings,
    poams,
    assessments,
    agentRuns,
    assets,
    vulnerabilities,
    artifacts,
    workflowEvents,
    testResults,
    interconnections,
    personnel,
    risks,
    tickets,
    sspSections,
    objectives,
    configChanges,
    authorizationHistory,
    connectorBindings,
    collectionJobs,
    incidents,
    whatIfRuns,
    interviews,
    inheritanceProposals,
    catoReviews,
    readiness,
  };
}

export function familyHealth(
  implementations: PortfolioSnapshot["implementations"],
  systemId?: string,
) {
  const impls = systemId
    ? implementations.filter((i) => i.systemId === systemId)
    : implementations;
  return FAMILY_ORDER.map((family) => {
    const rows = impls.filter((i) => familyOf(i.controlId) === family);
    const applicable = rows.filter((i) => i.status !== "not_applicable");
    const score =
      applicable.length === 0
        ? 0
        : (applicable.reduce((s, i) => s + implementationScore(i.status), 0) /
            applicable.length) *
          100;
    return { family, score: Math.round(score), count: applicable.length };
  });
}

export function portfolioReadiness(p: PortfolioSnapshot) {
  const per = p.systems.map((s) => {
    const slice = systemSlice(p, s.id);
    return { system: s, readiness: slice.readiness! };
  });
  const overall =
    per.length === 0
      ? 0
      : Math.round(per.reduce((s, x) => s + x.readiness.overall, 0) / per.length);
  return { overall, per };
}

export type SystemWithReady = {
  system: SystemRecord;
  overall: number;
};
