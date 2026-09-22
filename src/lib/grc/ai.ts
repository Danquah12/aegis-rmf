import { createServerFn } from "@tanstack/react-start";
import { NIST_CATALOG } from "./catalog";
import { rmfStepForControl } from "./cycle";
import { getPortfolio, insertAgentRun, insertAskMessage, saveSspDraft } from "./queries";
import { computeReadiness } from "./scoring";

const MODEL = "grok-4.5";

async function chat(system: string, user: string, maxTokens = 1400): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available in this environment." };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return { ok: false, error: `xAI API error ${res.status}` };
  const body = (await res.json()) as { choices: { message: { content: string } }[] };
  return { ok: true, text: body.choices[0]?.message.content ?? "" };
}

function portfolioBrief() {
  return getPortfolio().then((p) => {
    const lines = p.systems.map((s) => {
      const impls = p.implementations.filter((i) => i.systemId === s.id);
      const poams = p.poams.filter((x) => x.systemId === s.id);
      const findings = p.findings.filter((x) => x.systemId === s.id);
      const ready = computeReadiness({
        implementations: impls,
        evidence: p.evidence.filter((e) => e.systemId === s.id),
        poams,
        findings,
        hasSsp: Boolean(s.sspDraft) || s.atoStatus !== "in_assessment",
      });
      const openPoams = poams
        .filter((x) => x.status !== "completed")
        .map((x) => `${x.id} [${x.riskLevel}/${x.status}] ${x.controlId}: ${x.weakness}`)
        .join(" | ");
      const openFindings = findings
        .filter((x) => x.status === "open")
        .map((x) => `${x.id} [${x.severity}] ${x.controlId}: ${x.title}`)
        .join(" | ");
      const gaps = impls
        .filter((i) => i.result === "other" || i.status === "partial" || i.status === "not_implemented")
        .map((i) => `${i.controlId}[${rmfStepForControl(i.controlId)}] ${i.status} (${i.confidence}%): ${i.statement}`)
        .join(" | ");
      return [
        `SYSTEM ${s.acronym} (${s.id})`,
        `name=${s.name}; impact=${s.impactLevel}; ato=${s.atoStatus}; expires=${s.atoExpires ?? "n/a"}; rmf=${s.rmfStep}`,
        `hosting=${s.hosting} ${s.cloudProvider ?? ""}; data=${s.dataTypes.join(",")}`,
        `boundary=${s.authorizationBoundary}`,
        `readiness=${ready.overall}% impl=${ready.implementation} evidence=${ready.evidence} highRisk=${ready.highRisks}`,
        `gaps: ${gaps || "none material"}`,
        `findings: ${openFindings || "none"}`,
        `poams: ${openPoams || "none"}`,
        `rmf cycle position=${s.rmfStep}`,
      ].join("\n");
    });
    const vulns = p.vulnerabilities
      .map((v) => `${v.cve} ${v.severity} cvss=${v.cvss} kev=${v.kev} system=${v.systemId} asset=${v.assetId} controls=${v.controlIds.join(",")}`)
      .join("\n");
    const agents = p.agentRuns
      .slice(0, 8)
      .map((r) => `${r.id} ${r.agent} ${r.status} ${r.objective} → ${r.decision}`)
      .join("\n");
    return { text: `${lines.join("\n\n")}\n\nVULNS\n${vulns}\n\nAGENT RUNS\n${agents}`, snapshot: p };
  });
}

const AEGIS_SYSTEM = `You are Aegis, the authorization copilot for AegisRMF — an AI-native NIST SP 800-53 Rev. 5 / 5.2.0 continuous RMF platform.
Speak like a senior ISSO advising an Authorizing Official. Be precise, citable, and calm.
Always ground claims in the provided portfolio snapshot. Cite system acronyms, control IDs (e.g. SI-2), POA&M IDs, evidence IDs, and CVEs.
When discussing work, name the RMF step that owns it (Prepare, Categorize, Select, Implement, Assess, Authorize, Monitor) per NIST SP 800-37 Rev. 2.
Never declare a system officially authorized. You produce recommendations, confidence, and evidence — humans approve.
Make clear that ATO readiness is an analytical indicator, not a NIST determination.
Use 800-53A methods (examine, interview, test) when discussing assessment.
Keep answers structured with short headings. No emoji.`;

export const askAegis = createServerFn({ method: "POST" })
  .validator((input: { question: string }) => input)
  .handler(async ({ data }) => {
    const q = data.question.trim().slice(0, 2000);
    if (!q) return { ok: false as const, error: "Ask a question." };
    await insertAskMessage({ data: { role: "user", content: q } });
    const { text: brief } = await portfolioBrief();
    const result = await chat(
      AEGIS_SYSTEM,
      `PORTFOLIO SNAPSHOT\n${brief}\n\nQUESTION\n${q}`,
      1200,
    );
    if (!result.ok) return result;
    await insertAskMessage({ data: { role: "assistant", content: result.text } });
    return { ok: true as const, text: result.text };
  });

export const generateSsp = createServerFn({ method: "POST" })
  .validator((input: { systemId: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const impls = snapshot.implementations.filter((i) => i.systemId === system.id);
    const assets = snapshot.assets.filter((a) => a.systemId === system.id);
    const catalogSlice = NIST_CATALOG.map((c) => `${c.id} ${c.title}`).join("; ");
    const result = await chat(
      `${AEGIS_SYSTEM}
Draft an OSCAL-inspired System Security Plan narrative (not raw JSON). Sections:
1. System identification
2. Authorization boundary
3. System environment and inventory
4. Data types and FIPS 199 categorization
5. Selected baseline
6. Control implementation summaries for material controls (especially gaps)
7. Interconnections
8. Open POA&M / residual risk
9. Human review checklist
Mark the document DRAFT — not official.`,
      `SYSTEM RECORD\n${JSON.stringify(system)}\nASSETS\n${JSON.stringify(assets)}\nIMPLEMENTATION GAPS\n${JSON.stringify(impls.filter((i) => i.result !== "satisfied").slice(0, 20))}\nCATALOG\n${catalogSlice}`,
      1800,
    );
    if (!result.ok) return result;
    await saveSspDraft({ data: { systemId: system.id, draft: result.text } });
    await insertAgentRun({
      data: {
        agent: "ssp",
        systemId: system.id,
        objective: `Draft SSP for ${system.acronym}`,
        plan: "Ingest inventory, baseline, and control implementations. Produce draft OSCAL SSP narrative.",
        tools: ["terraform.get_state", "aws.get_resources"],
        evidence: "inventory + implementations",
        decision: "Draft SSP generated. ISSO approval required before package use.",
        confidence: 82,
        requiresApproval: true,
      },
    });
    return { ok: true as const, text: result.text };
  });

export const runAssessment = createServerFn({ method: "POST" })
  .validator((input: { systemId: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const impls = snapshot.implementations.filter((i) => i.systemId === system.id);
    const evidence = snapshot.evidence.filter((e) => e.systemId === system.id);
    const result = await chat(
      `${AEGIS_SYSTEM}
Produce an 800-53A-style assessment memo for the system. For each material weakness:
- Control ID and title
- Assessment methods used (examine / interview / test)
- Evidence cited
- Result (satisfied / other than satisfied)
- Confidence
- Recommended POA&M
End with an ATO-readiness recommendation for the AO, clearly labeled unofficial.`,
      `SYSTEM\n${JSON.stringify(system)}\nGAPS\n${JSON.stringify(impls.filter((i) => i.result !== "satisfied"))}\nEVIDENCE\n${JSON.stringify(evidence)}`,
      1600,
    );
    if (!result.ok) return result;
    await insertAgentRun({
      data: {
        agent: "assessment",
        systemId: system.id,
        objective: `Run AI assessment of ${system.acronym}`,
        plan: "Apply 800-53A methods to current evidence and implementations. Draft findings for ISSO review.",
        tools: ["tenable.get_vulnerabilities", "aws.get_config_rules", "splunk.search"],
        evidence: evidence.map((e) => e.id).join(", "),
        decision: result.text.slice(0, 400),
        confidence: 88,
        requiresApproval: true,
      },
    });
    return { ok: true as const, text: result.text };
  });

export const runNamedAgent = createServerFn({ method: "POST" })
  .validator((input: { agent: string; systemId: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const result = await chat(
      `${AEGIS_SYSTEM}
You are the ${data.agent} agent in AegisRMF. Produce:
1. Plan (3-6 steps)
2. Tools you would call
3. Evidence you would collect
4. Decision summary with control citations
5. Confidence 0-100
6. Whether human approval is required (true for authorization, SSP publication, remediation).
Keep it under 500 words.`,
      `SYSTEM\n${JSON.stringify(system)}\nPORTFOLIO EXCERPT\n${JSON.stringify({
        poams: snapshot.poams.filter((p) => p.systemId === system.id),
        vulns: snapshot.vulnerabilities.filter((v) => v.systemId === system.id),
        findings: snapshot.findings.filter((f) => f.systemId === system.id),
      })}`,
      900,
    );
    if (!result.ok) return result;
    const approvalNeeded = !["monitor", "evidence", "siem"].includes(data.agent);
    await insertAgentRun({
      data: {
        agent: data.agent,
        systemId: system.id,
        objective: `Execute ${data.agent} agent against ${system.acronym}`,
        plan: result.text.slice(0, 280),
        tools: ["aws.get_config_rules", "tenable.get_vulnerabilities", "splunk.search"],
        evidence: "live telemetry + catalog",
        decision: result.text.slice(0, 500),
        confidence: 85,
        requiresApproval: approvalNeeded,
      },
    });
    return { ok: true as const, text: result.text };
  });

export const writeImplementation = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; controlId: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const control = NIST_CATALOG.find((c) => c.id === data.controlId);
    if (!control) return { ok: false as const, error: "Control not found." };
    const impl = snapshot.implementations.find((i) => i.systemId === system.id && i.controlId === data.controlId);
    const evidence = snapshot.evidence.filter((e) => e.systemId === system.id && e.controlId === data.controlId);
    const assets = snapshot.assets.filter((a) => a.systemId === system.id);
    const result = await chat(
      `${AEGIS_SYSTEM}
Draft an implementation statement for one 800-53 control. Structure:
AI GENERATED
Evidence: (cite IDs)
Architecture facts used
Confidence 0-100
Implementation statement (ISSO voice, 120-180 words)
Mark DRAFT. Do not claim the control is satisfied unless evidence supports it.`,
      `SYSTEM ${system.acronym}\nBOUNDARY ${system.authorizationBoundary}\nASSETS ${JSON.stringify(assets)}\nCONTROL ${control.id} ${control.title}\nSTATEMENT ${control.statement}\nCURRENT ${JSON.stringify(impl)}\nEVIDENCE ${JSON.stringify(evidence)}`,
      800,
    );
    if (!result.ok) return result;
    await insertAgentRun({
      data: {
        agent: "ssp",
        systemId: system.id,
        objective: `Draft ${data.controlId} implementation statement`,
        plan: "Read architecture, evidence, and current statement. Produce a draft for ISSO accept/edit/reject.",
        tools: ["aws.get_config_rules", "terraform.get_state"],
        evidence: evidence.map((e) => e.id).join(", ") || "architecture",
        decision: result.text.slice(0, 400),
        confidence: 84,
        requiresApproval: true,
      },
    });
    return { ok: true as const, text: result.text };
  });

export const analyzeImpact = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; question: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot, text: brief } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const q = data.question.trim().slice(0, 1200);
    const result = await chat(
      `${AEGIS_SYSTEM}
You are performing authorization impact analysis. Identify affected controls, inherited controls, evidence that would stale, POA&M, and whether the ATO package would need to be reopened. Be conservative. Humans decide.`,
      `SYSTEM ${system.acronym}\n${brief}\nQUESTION\n${q}`,
      1000,
    );
    if (!result.ok) return result;
    await insertAgentRun({
      data: {
        agent: "rmf-orchestrator",
        systemId: system.id,
        objective: `Impact analysis: ${q.slice(0, 80)}`,
        plan: "Compare architecture, inherited controls, evidence, and residual risk.",
        tools: ["aws.get_resources", "terraform.get_state"],
        evidence: "portfolio snapshot",
        decision: result.text.slice(0, 400),
        confidence: 80,
        requiresApproval: true,
      },
    });
    return { ok: true as const, text: result.text };
  });

export const analyzeReadiness = createServerFn({ method: "POST" })
  .validator((input: { systemId: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const result = await chat(
      `${AEGIS_SYSTEM}
Write an AO briefing: authorization readiness. Cover implementation, assessment, evidence freshness, high risks, open POA&M, package artifacts, and a recommended decision (authorize / authorize with conditions / return). Label unofficial.`,
      `SYSTEM ${JSON.stringify(system)}\nPOAM ${JSON.stringify(snapshot.poams.filter((p) => p.systemId === system.id))}\nFINDINGS ${JSON.stringify(snapshot.findings.filter((f) => f.systemId === system.id))}\nRISKS ${JSON.stringify(snapshot.risks.filter((r) => r.systemId === system.id))}`,
      1100,
    );
    return result;
  });

export const whatChangedAi = createServerFn({ method: "POST" })
  .validator((input: { systemId: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const result = await chat(
      `${AEGIS_SYSTEM}
Produce a "What changed since last assessment" memo. List infrastructure, application, network, vulnerability, control-implementation, and evidence deltas. Name potentially affected controls.`,
      `SYSTEM ${system.acronym}\nCHANGES ${JSON.stringify(snapshot.configChanges.filter((c) => c.systemId === system.id))}\nVULNS ${JSON.stringify(snapshot.vulnerabilities.filter((v) => v.systemId === system.id))}\nGAPS ${JSON.stringify(snapshot.implementations.filter((i) => i.systemId === system.id && i.result !== "satisfied").slice(0, 12))}`,
      900,
    );
    return result;
  });

export const briefSystem = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; focus: "system" | "evidence" | "poam" | "risk" }) => input)
  .handler(async ({ data }) => {
    const { snapshot, text: brief } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const focus =
      data.focus === "evidence"
        ? "Find missing or stale evidence. For each material control, name freshness, collector, and the job to run. Do not invent collection that did not happen."
        : data.focus === "poam"
          ? "Analyze remediation. For each open POA&M: overdue days, ticket linkage, residual risk, and a closure path. Agents do not close POA&M."
          : data.focus === "risk"
            ? "Analyze the risk register and heat map. Identify what the AO should not accept, what can be mitigated, and review dates."
            : "Analyze the information system as the RMF hub. Cover boundary, roles, inheritance, lifecycle, residual risk, and the next human action.";
    const result = await chat(
      `${AEGIS_SYSTEM}\n${focus}\nLabel unofficial. Humans authorize.`,
      `SYSTEM ${system.acronym}\n${brief}\nEVIDENCE ${JSON.stringify(snapshot.evidence.filter((e) => e.systemId === system.id).slice(0, 12))}\nRISKS ${JSON.stringify(snapshot.risks.filter((r) => r.systemId === system.id))}\nTICKETS ${JSON.stringify(snapshot.tickets.filter((t) => t.systemId === system.id))}`,
      900,
    );
    return result;
  });

export const analyzeWhatIf = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; scenario: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot, text: brief } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const q = data.scenario.trim().slice(0, 1200);
    const result = await chat(
      `${AEGIS_SYSTEM}
You are running a what-if simulator. Do not change the authorization record. Estimate effects on controls, inheritance, evidence freshness, POA&M, architecture, and whether the ATO package would need to be reopened. Be conservative. Label unofficial. Humans decide.`,
      `SYSTEM ${system.acronym}\n${brief}\nSCENARIO\n${q}`,
      900,
    );
    return result;
  });

export const reviewArchitecture = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; description: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot, text: brief } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const desc = data.description.trim().slice(0, 4000);
    if (!desc) return { ok: false as const, error: "Paste or describe the architecture." };
    const result = await chat(
      `${AEGIS_SYSTEM}
You are reviewing an architecture / data-flow description (text stand-in for Visio, draw.io, PNG, PDF, or Terraform). Identify control issues, boundary gaps, internet exposure, data handling, and map each issue to 800-53. Do not invent inventory that contradicts the snapshot.`,
      `SYSTEM ${system.acronym}\n${brief}\nARCHITECTURE\n${desc}`,
      1000,
    );
    return result;
  });

export const assessorCopilot = createServerFn({ method: "POST" })
  .validator((input: { systemId: string; controlId?: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot, text: brief } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const focus = data.controlId ? `Focus on ${data.controlId}.` : "Focus on material other-than-satisfied controls.";
    const result = await chat(
      `${AEGIS_SYSTEM}
You are the assessor copilot. Cite evidence IDs, 800-53A methods, and assessment objectives. Identify candidate findings. Recommend — the assessor retains the decision. Never mark a control satisfied.`,
      `SYSTEM ${system.acronym}\n${focus}\n${brief}\nEVIDENCE ${JSON.stringify(snapshot.evidence.filter((e) => e.systemId === system.id).slice(0, 16))}\nOBJECTIVES ${JSON.stringify(snapshot.objectives.filter((o) => o.systemId === system.id).slice(0, 16))}`,
      1000,
    );
    return result;
  });

export const policyGapAi = createServerFn({ method: "POST" })
  .validator((input: { policyText: string }) => input)
  .handler(async ({ data }) => {
    const { text: brief } = await portfolioBrief();
    const policy = data.policyText.trim().slice(0, 4000);
    if (!policy) return { ok: false as const, error: "Paste a policy." };
    const result = await chat(
      `${AEGIS_SYSTEM}
Map the pasted organizational policy to NIST SP 800-53 Rev. 5.2.0, 800-53A methods, and the directorate baseline. Identify missing requirements. Draft the missing clauses as DRAFT — not official policy.`,
      `PORTFOLIO\n${brief}\nPOLICY\n${policy}`,
      1000,
    );
    return result;
  });

export const dailyBriefing = createServerFn({ method: "POST" })
  .validator((input: { unused?: boolean }) => input)
  .handler(async () => {
    const { snapshot, text: brief } = await portfolioBrief();
    const result = await chat(
      `${AEGIS_SYSTEM}
Write the daily RMF briefing for CISO / AO / ISSO. Short numbered facts: systems changed, controls affected, high vulns, POA&M due, expired evidence, authorization attention. Unofficial. Do not authorize.`,
      `PORTFOLIO\n${brief}\nINCIDENTS ${JSON.stringify(snapshot.incidents)}\nCHANGES ${JSON.stringify(snapshot.configChanges.slice(0, 12))}`,
      800,
    );
    return result;
  });

export const mapDataFlowAi = createServerFn({ method: "POST" })
  .validator((input: { systemId: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot, text: brief } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const result = await chat(
      `${AEGIS_SYSTEM}
Produce a data-flow map: actors → edge → app → data → backup. Name sensitive data types and map each hop to 800-53. Stay inside the authorization boundary in the snapshot.`,
      `SYSTEM ${system.acronym}\n${brief}\nASSETS ${JSON.stringify(snapshot.assets.filter((a) => a.systemId === system.id))}`,
      800,
    );
    return result;
  });

export const discoverInheritanceAi = createServerFn({ method: "POST" })
  .validator((input: { systemId: string }) => input)
  .handler(async ({ data }) => {
    const { snapshot, text: brief } = await portfolioBrief();
    const system = snapshot.systems.find((s) => s.id === data.systemId);
    if (!system) return { ok: false as const, error: "System not found." };
    const result = await chat(
      `${AEGIS_SYSTEM}
Propose common-control inheritance. For each proposal: provider, control, rationale, hybrid overlay remaining on the consumer. Human must accept. Do not change origination yourself.`,
      `SYSTEM ${system.acronym}\n${brief}\nEXISTING PROPOSALS ${JSON.stringify(snapshot.inheritanceProposals.filter((x) => x.systemId === system.id))}`,
      800,
    );
    return result;
  });
