import type { AssessmentResult, RiskLevel } from "./types";
import { cachedScan, firstMatchingScript } from "./scan-cache";

export const SCA_ORIGIN = "https://06-sca-platform.vercel.app";
export const SCA_SCAN = `${SCA_ORIGIN}/scan`;
export const IAC_ORIGIN = "https://10-iac-security-platform.vercel.app";
export const IAC_SCAN = `${IAC_ORIGIN}/scan`;

/** Connectors that always run when the system under assessment is Assessed / ConMon'd. */
export const AUTO_SCAN_FEEDS = ["axiom", "axiom-sca", "axiom-iac"] as const;

export interface SuiteFinding {
  id: string;
  title: string;
  severity: string;
  plugin: string;
  description: string;
  cve?: string;
  packageName?: string;
  resource?: string;
  controls: string[];
}

export const SCA_FALLBACK: SuiteFinding[] = [
  {
    id: "SCA-001",
    title: "log4j-core 2.14.1 — Log4Shell RCE",
    severity: "Critical",
    plugin: "SCA",
    cve: "CVE-2021-44228",
    packageName: "log4j-core",
    description: "JNDI injection in log messages. Remote class load. Patch 2.15.0+.",
    controls: ["RA-5", "SI-2", "SR-3", "SA-15"],
  },
  {
    id: "SCA-002",
    title: "spring-webmvc 5.3.17 — Spring4Shell RCE",
    severity: "Critical",
    plugin: "SCA",
    cve: "CVE-2022-22965",
    packageName: "spring-webmvc",
    description: "Data-binding RCE on JDK 9+ Tomcat. Patch 5.3.18+.",
    controls: ["RA-5", "SI-2", "SA-11"],
  },
  {
    id: "SCA-003",
    title: "lodash 4.17.15 — prototype pollution",
    severity: "High",
    plugin: "SCA",
    cve: "CVE-2020-8203",
    packageName: "lodash",
    description: "zipObjectDeep pollutes Object.prototype. Patch 4.17.21.",
    controls: ["RA-5", "SI-2", "SA-11"],
  },
  {
    id: "SCA-004",
    title: "axios 0.21.1 — ReDoS in URL parse",
    severity: "High",
    plugin: "SCA",
    cve: "CVE-2021-3749",
    packageName: "axios",
    description: "Crafted URL causes catastrophic backtracking. Patch 0.21.4.",
    controls: ["RA-5", "SI-2"],
  },
  {
    id: "SCA-005",
    title: "PyYAML 5.3.1 — unsafe yaml.load RCE",
    severity: "Critical",
    plugin: "SCA",
    cve: "CVE-2020-14343",
    packageName: "PyYAML",
    description: "Arbitrary object instantiation via yaml.load(). Patch 5.4.",
    controls: ["RA-5", "SI-2", "SI-10"],
  },
  {
    id: "SCA-006",
    title: "gpl-library 3.2.1 — GPL-3.0 copyleft",
    severity: "High",
    plugin: "SCA",
    packageName: "gpl-library",
    description: "GPL-3.0 in a closed-source product. Supply-chain license risk.",
    controls: ["SR-3", "SA-15", "CM-8"],
  },
  {
    id: "SCA-007",
    title: "org.apache.xmlrpc 3.1.3 — unsafe deserialization",
    severity: "Medium",
    plugin: "SCA",
    cve: "CVE-2019-17570",
    packageName: "org.apache.xmlrpc",
    description: "XMLRPC client deserializes arbitrary server objects. No fix.",
    controls: ["RA-5", "SI-2", "SI-10"],
  },
  {
    id: "SCA-008",
    title: "Pillow 8.2.0 — Convert.c buffer overflow",
    severity: "Critical",
    plugin: "SCA",
    cve: "CVE-2021-34552",
    packageName: "Pillow",
    description: "Crafted image RCE. Patch 8.3.0.",
    controls: ["RA-5", "SI-2", "SA-11"],
  },
];

export const IAC_FALLBACK: SuiteFinding[] = [
  {
    id: "IAC-001",
    title: "CKV_AWS_20 aws_s3_bucket.customer_data — public ACL",
    severity: "Critical",
    plugin: "Checkov",
    resource: "aws_s3_bucket.customer_data",
    description: "Public ACL on CUI bucket. SC-7 / AC-3 failure.",
    controls: ["AC-3", "SC-7", "SC-28"],
  },
  {
    id: "IAC-002",
    title: "CKV_AWS_25 aws_security_group_rule.ssh_ingress — SSH 0.0.0.0/0",
    severity: "Critical",
    plugin: "Checkov",
    resource: "aws_security_group_rule.ssh_ingress",
    description: "SSH open to the world.",
    controls: ["SC-7", "AC-17", "CM-6"],
  },
  {
    id: "IAC-003",
    title: "CKV_AWS_17 aws_db_instance.customer_postgres — storage unencrypted",
    severity: "Critical",
    plugin: "Checkov",
    resource: "aws_db_instance.customer_postgres",
    description: "RDS storage_encrypted=false.",
    controls: ["SC-28", "SC-8", "CM-6"],
  },
  {
    id: "IAC-004",
    title: "aws_iam_policy.app_policy — wildcard action",
    severity: "High",
    plugin: "tfsec",
    resource: "aws_iam_policy.app_policy",
    description: "IAM policy allows * on all resources.",
    controls: ["AC-6", "AC-3", "CM-6"],
  },
  {
    id: "IAC-005",
    title: "aws_cloudtrail.main — multi-region trail disabled",
    severity: "High",
    plugin: "tfsec",
    resource: "aws_cloudtrail.main",
    description: "CloudTrail not multi-region.",
    controls: ["AU-12", "AU-2", "AU-3"],
  },
  {
    id: "IAC-006",
    title: "aws_instance.api_server — IMDSv1 enabled",
    severity: "High",
    plugin: "Terrascan",
    resource: "aws_instance.api_server",
    description: "Instance metadata v1 (SSRF credential theft pattern).",
    controls: ["AC-3", "SC-7", "CM-6"],
  },
  {
    id: "IAC-007",
    title: "aws_vpc.production — VPC flow logs not enabled",
    severity: "Medium",
    plugin: "OPA",
    resource: "aws_vpc.production",
    description: "No VPC flow logs.",
    controls: ["AU-12", "SC-7"],
  },
];

export function suiteSeverity(raw: string): RiskLevel {
  const s = raw.toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high") return "high";
  if (s === "medium" || s === "moderate") return "moderate";
  return "low";
}

export function suiteResult(f: SuiteFinding): AssessmentResult {
  const sev = suiteSeverity(f.severity);
  if (sev === "critical" || sev === "high" || sev === "moderate") return "other";
  return "satisfied";
}

function parseSca(js: string): SuiteFinding[] {
  const out: SuiteFinding[] = [];
  const re =
    /id:"(SCA-\d+)",packageName:"([^"]+)",packageVersion:"([^"]+)",ecosystem:"([^"]+)",severity:"([^"]+)"/g;
  for (const m of js.matchAll(re)) {
    const cve = js.slice(m.index ?? 0, (m.index ?? 0) + 400).match(/CVE-\d{4}-\d+/)?.[0];
    const pkg = m[2]!;
    const sev = m[5]!;
    out.push({
      id: m[1]!,
      title: `${pkg} ${m[3]} — ${cve ?? sev}`,
      severity: sev,
      plugin: "SCA",
      cve,
      packageName: pkg,
      description: `${m[4]} ${pkg}@${m[3]}. ${cve ?? "license/supply-chain"}.`,
      controls: cve ? ["RA-5", "SI-2", "SR-3", "SA-15"] : ["SR-3", "SA-15", "CM-8"],
    });
  }
  return out;
}

function parseIac(js: string): SuiteFinding[] {
  const out: SuiteFinding[] = [];
  let n = 1;
  const re = /(?:CKV_AWS_\d+|HIGH|MEDIUM|CRITICAL):\s*([a-z0-9_]+(?:\.[a-z0-9_]+)?)[^\n"]{0,160}/gi;
  for (const m of js.matchAll(re)) {
    const line = m[0]!.replace(/\\u[0-9a-fA-F]{4}/g, " ").slice(0, 180);
    const resource = m[1]!;
    const sev = /CKV_AWS_2[05]|CKV_AWS_17|CRITICAL/i.test(line) ? "Critical" : /HIGH/i.test(line) ? "High" : "Medium";
    const controls = resource.includes("s3")
      ? ["AC-3", "SC-7", "SC-28"]
      : resource.includes("security_group") || resource.includes("ssh")
        ? ["SC-7", "AC-17"]
        : resource.includes("db_instance")
          ? ["SC-28", "SC-8"]
          : resource.includes("iam")
            ? ["AC-6", "AC-3"]
            : resource.includes("cloudtrail")
              ? ["AU-12", "AU-2"]
              : resource.includes("instance")
                ? ["AC-3", "SC-7", "CM-6"]
                : ["CM-6", "SC-7"];
    out.push({
      id: `IAC-${String(n).padStart(3, "0")}`,
      title: line.slice(0, 120),
      severity: sev,
      plugin: "IaC",
      resource,
      description: line,
      controls,
    });
    n += 1;
    if (n > 12) break;
  }
  return out;
}

export async function fetchAxiomSca(): Promise<{ findings: SuiteFinding[]; live: boolean; source: string }> {
  return cachedScan("axiom-sca", async () => {
    const hit = await firstMatchingScript(SCA_SCAN, SCA_ORIGIN, (js) => js.includes("SCA-001"));
    if (hit) {
      const parsed = parseSca(hit.js);
      if (parsed.length) return { findings: parsed, live: true, source: hit.src };
    }
    return { findings: SCA_FALLBACK, live: false, source: "embedded AXIOM SCA catalog" };
  });
}

export async function fetchAxiomIac(): Promise<{ findings: SuiteFinding[]; live: boolean; source: string }> {
  return cachedScan("axiom-iac", async () => {
    const hit = await firstMatchingScript(
      IAC_SCAN,
      IAC_ORIGIN,
      (js) => js.includes("CKV_AWS") || js.includes("Checkov"),
    );
    if (hit) {
      const parsed = parseIac(hit.js);
      if (parsed.length) return { findings: parsed, live: true, source: hit.src };
    }
    return { findings: IAC_FALLBACK, live: false, source: "embedded AXIOM IaC catalog" };
  });
}

export async function prefetchAutoScanCatalogs(): Promise<void> {
  await Promise.all([
    import("./axiom").then((m) => m.fetchAxiomFindings()),
    fetchAxiomSca(),
    fetchAxiomIac(),
  ]);
}

export function controlHits(findings: SuiteFinding[]): Map<string, SuiteFinding[]> {
  const map = new Map<string, SuiteFinding[]>();
  for (const f of findings) {
    for (const c of f.controls) {
      const list = map.get(c) ?? [];
      list.push(f);
      map.set(c, list);
    }
  }
  return map;
}
