import { NIST_CATALOG } from "./catalog";
import { ARTIFACT_KINDS, COMMON_CONTROL_PROVIDERS, impactTrio, originationOf } from "./package";
import { deriveSspSections } from "./layer1";
import type { PortfolioSnapshot, SystemRecord } from "./types";

export function buildOscalPackage(p: PortfolioSnapshot, systemId: string) {
  const system = p.systems.find((s) => s.id === systemId);
  if (!system) return null;
  const cia = impactTrio(system);
  const impls = p.implementations.filter((i) => i.systemId === systemId);
  const evidence = p.evidence.filter((e) => e.systemId === systemId);
  const poams = p.poams.filter((x) => x.systemId === systemId);
  const assets = p.assets.filter((a) => a.systemId === systemId);
  const sections = deriveSspSections(p, systemId);
  const artifacts = p.artifacts.filter((a) => a.systemId === systemId);

  return {
    "oscal-version": "1.1.3",
    metadata: {
      title: `${system.acronym} authorization package`,
      published: "2026-09-18T00:00:00Z",
      lastModified: "2026-09-18T12:00:00Z",
      version: system.extra.packageVersion ?? "1.0",
      oscalVersion: "1.1.3",
      roles: [
        { id: "system-owner", title: system.ownerRole },
        { id: "isso", title: system.issoRole },
        { id: "authorizing-official", title: system.aoRole },
      ],
    },
    "system-security-plan": {
      uuid: `ssp-${system.id.toLowerCase()}`,
      metadata: { title: `SSP — ${system.name}` },
      "system-characteristics": {
        "system-ids": [{ identifier: system.id }],
        "system-name": system.name,
        "system-name-short": system.acronym,
        description: system.mission,
        "security-sensitivity-level": system.impactLevel,
        "security-impact-level": {
          "security-objective-confidentiality": cia.confidentiality,
          "security-objective-integrity": cia.integrity,
          "security-objective-availability": cia.availability,
        },
        "authorization-boundary": { description: system.authorizationBoundary },
        "system-information": {
          "information-types": system.dataTypes.map((t) => ({ title: t })),
        },
        "status": { state: system.atoStatus },
      },
      "system-implementation": {
        users: [{ title: system.extra.users }],
        components: assets.map((a) => ({
          uuid: a.id,
          type: a.kind,
          title: a.name,
          description: `${a.environment} · ${a.criticality}`,
          status: { state: "operational" },
        })),
        "leveraged-authorizations": COMMON_CONTROL_PROVIDERS.filter((c) => c.systemId !== system.id).map((c) => ({
          title: c.name,
          "party-uuid": c.id,
        })),
      },
      "control-implementation": {
        description: `${system.extra.baseline} baseline with overlay ${system.extra.overlay ?? "none"}`,
        "implemented-requirements": impls
          .filter((i) => i.status !== "not_applicable")
          .map((i) => {
            const origin = originationOf(i, system.id, i.controlId);
            const control = NIST_CATALOG.find((c) => c.id === i.controlId);
            return {
              uuid: i.id,
              "control-id": i.controlId.toLowerCase(),
              title: control?.title,
              remarks: i.statement,
              props: [
                { name: "implementation-status", value: i.status },
                { name: "origination", value: origin.type },
                { name: "assessment-result", value: i.result },
              ],
            };
          }),
      },
      backMatter: {
        resources: evidence.map((e) => ({
          uuid: e.id,
          title: e.title,
          description: e.summary,
          props: [
            { name: "hash", value: e.hash },
            { name: "source", value: e.source },
            { name: "collected", value: e.collectedAt },
          ],
        })),
      },
      "ssp-studio": sections.map((s) => ({
        id: s.sectionId,
        title: s.title,
        prose: s.body,
        status: s.status,
      })),
    },
    "assessment-results": {
      uuid: `sar-${system.id.toLowerCase()}`,
      "reviewed-controls": impls.filter((i) => i.result !== "not_assessed").map((i) => ({
        "control-id": i.controlId.toLowerCase(),
        findings: p.findings.filter((f) => f.systemId === systemId && f.controlId === i.controlId).map((f) => f.id),
      })),
    },
    "plan-of-action-and-milestones": {
      uuid: `poam-${system.id.toLowerCase()}`,
      "poam-items": poams.map((x) => ({
        uuid: x.id,
        title: x.weakness,
        "related-controls": [{ "control-id": x.controlId.toLowerCase() }],
        props: [
          { name: "risk-level", value: x.riskLevel },
          { name: "status", value: x.status },
          { name: "due", value: x.dueDate },
        ],
      })),
    },
    artifacts: ARTIFACT_KINDS.map((k) => {
      const hit = artifacts.find((a) => a.kind === k.id);
      return { kind: k.id, oscal: k.oscal, title: k.label, status: hit?.status ?? "missing" };
    }),
    "authorization-decision": {
      status: system.atoStatus,
      expires: system.atoExpires,
      type: system.extra.authorizationType ?? null,
    },
  };
}

export function oscalJson(p: PortfolioSnapshot, system: SystemRecord): string {
  return JSON.stringify(buildOscalPackage(p, system.id), null, 2);
}

export function downloadOscal(p: PortfolioSnapshot, system: SystemRecord) {
  const json = oscalJson(p, system);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${system.acronym}-authorization.oscal.json`;
  a.click();
  URL.revokeObjectURL(url);
}
