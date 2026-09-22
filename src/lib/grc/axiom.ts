import type { AssessmentResult, RiskLevel } from "./types";
import { cachedScan, firstMatchingScript, getTextFast } from "./scan-cache";

export const AXIOM_ORIGIN = "https://11-dast-security-platform.vercel.app";
export const AXIOM_PORTAL = `${AXIOM_ORIGIN}/app/?standalone=1`;
export const AXIOM_DASHBOARD = AXIOM_ORIGIN;
export const AXIOM_EVIDENCE = `${AXIOM_ORIGIN}/evidence`;

export interface AxiomFinding {
  id: string;
  title: string;
  severity: string;
  confidence: string;
  plugin: string;
  url: string;
  parameter: string;
  method: string;
  owaspRef: string;
  cweId: string;
  description: string;
}

/** Published AXIOM catalog (S2 DAST). Used if the live site cannot be reached. */
export const AXIOM_FALLBACK: AxiomFinding[] = [
  {
    id: "F-001",
    title: "SQL Injection — UNION-based via 'q' parameter",
    severity: "Critical",
    confidence: "Confirmed",
    plugin: "SQLi",
    url: "https://app.target.local/api/products/search",
    parameter: "q",
    method: "GET",
    owaspRef: "A03:2021",
    cweId: "CWE-89",
    description: "Product search concatenates user input into SQL. UNION extracted the users table.",
  },
  {
    id: "F-002",
    title: "Stored XSS — Profile displayName reflected without sanitization",
    severity: "Critical",
    confidence: "Confirmed",
    plugin: "XSS",
    url: "https://app.target.local/api/profile/update",
    parameter: "displayName",
    method: "PUT",
    owaspRef: "A03:2021",
    cweId: "CWE-79",
    description: "displayName stored and rendered unsanitized across profile pages.",
  },
  {
    id: "F-003",
    title: "SSRF — Webhook endpoint fetches internal AWS metadata",
    severity: "Critical",
    confidence: "Confirmed",
    plugin: "SSRF",
    url: "https://app.target.local/api/webhooks/test",
    parameter: "url",
    method: "POST",
    owaspRef: "A10:2021",
    cweId: "CWE-918",
    description: "Webhook test fetches any URL, including the EC2 metadata service.",
  },
  {
    id: "F-004",
    title: "IDOR — Unauthenticated access to arbitrary user records",
    severity: "High",
    confidence: "Confirmed",
    plugin: "IDOR",
    url: "https://app.target.local/api/users/{id}",
    parameter: "id",
    method: "GET",
    owaspRef: "A01:2021",
    cweId: "CWE-639",
    description: "Sequential user IDs. Authentication without object-level authorization.",
  },
  {
    id: "F-005",
    title: "CSRF — Password change accepts cross-origin requests",
    severity: "High",
    confidence: "Confirmed",
    plugin: "CSRF",
    url: "https://app.target.local/api/account/change-password",
    parameter: "csrf_token",
    method: "POST",
    owaspRef: "A01:2021",
    cweId: "CWE-352",
    description: "Password change has no CSRF token and accepts arbitrary origins.",
  },
  {
    id: "F-006",
    title: "Path Traversal — Read arbitrary filesystem files",
    severity: "High",
    confidence: "Confirmed",
    plugin: "PathTraversal",
    url: "https://app.target.local/files/download",
    parameter: "path",
    method: "GET",
    owaspRef: "A01:2021",
    cweId: "CWE-22",
    description: "Traversal sequences not stripped. Reads files outside the intended base.",
  },
  {
    id: "F-007",
    title: "Open Redirect — Login next parameter redirects to external URL",
    severity: "Medium",
    confidence: "Confirmed",
    plugin: "OpenRedirect",
    url: "https://app.target.local/login",
    parameter: "next",
    method: "GET",
    owaspRef: "A01:2021",
    cweId: "CWE-601",
    description: "Login next parameter redirects to any URL after authentication.",
  },
  {
    id: "F-008",
    title: "Missing Security Headers — CSP, HSTS, X-Frame-Options absent",
    severity: "Medium",
    confidence: "Confirmed",
    plugin: "Header",
    url: "https://app.target.local/",
    parameter: "Response Headers",
    method: "GET",
    owaspRef: "A05:2021",
    cweId: "CWE-693",
    description: "Production missing CSP, HSTS, and X-Frame-Options.",
  },
];

const CWE_CONTROLS: Record<string, string[]> = {
  "CWE-89": ["SA-11", "SI-10", "SI-2"],
  "CWE-79": ["SA-11", "SI-10"],
  "CWE-918": ["SA-11", "SC-7", "SA-9"],
  "CWE-639": ["AC-3", "AC-6", "SA-11"],
  "CWE-352": ["AC-3", "SC-8", "SA-11"],
  "CWE-22": ["AC-3", "SI-10", "SA-11"],
  "CWE-601": ["SC-7", "SI-10"],
  "CWE-693": ["SC-8", "CM-6", "SC-7"],
};

export function controlsForCwe(cwe: string): string[] {
  return CWE_CONTROLS[cwe] ?? ["SA-11"];
}

export function axiomSeverity(raw: string): RiskLevel {
  const s = raw.toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high") return "high";
  if (s === "medium" || s === "moderate") return "moderate";
  return "low";
}

export function axiomResult(f: AxiomFinding): AssessmentResult {
  const sev = axiomSeverity(f.severity);
  if (sev === "critical" || sev === "high" || sev === "moderate") return "other";
  return "satisfied";
}

function parseCatalog(js: string): AxiomFinding[] {
  const out: AxiomFinding[] = [];
  const re =
    /id:"(F-\d+)",title:"([^"]+)",severity:"([^"]+)",confidence:"([^"]+)",plugin:"([^"]+)",url:"([^"]+)",parameter:"([^"]*)",method:"([^"]+)",owaspRef:"([^"]+)",cweId:"([^"]+)",description:"([^"]*)"/g;
  for (const m of js.matchAll(re)) {
    out.push({
      id: m[1]!,
      title: m[2]!,
      severity: m[3]!,
      confidence: m[4]!,
      plugin: m[5]!,
      url: m[6]!,
      parameter: m[7]!,
      method: m[8]!,
      owaspRef: m[9]!,
      cweId: m[10]!,
      description: m[11]!,
    });
  }
  return out;
}

export async function fetchAxiomFindings(): Promise<{ findings: AxiomFinding[]; live: boolean; source: string }> {
  return cachedScan("axiom-dast", async () => {
    const hit = await firstMatchingScript(AXIOM_EVIDENCE, AXIOM_ORIGIN, (js) => js.includes('id:"F-001"'));
    if (hit) {
      const parsed = parseCatalog(hit.js);
      if (parsed.length) return { findings: parsed, live: true, source: `${AXIOM_EVIDENCE} → ${hit.src}` };
    }
    const html = await getTextFast(AXIOM_EVIDENCE);
    const inline = html ? parseCatalog(html) : [];
    if (inline.length) return { findings: inline, live: true, source: AXIOM_EVIDENCE };
    return { findings: AXIOM_FALLBACK, live: false, source: "embedded AXIOM catalog" };
  });
}

export function axiomControlHits(findings: AxiomFinding[]): Map<string, AxiomFinding[]> {
  const map = new Map<string, AxiomFinding[]>();
  for (const f of findings) {
    for (const c of controlsForCwe(f.cweId)) {
      const list = map.get(c) ?? [];
      list.push(f);
      map.set(c, list);
    }
  }
  return map;
}
