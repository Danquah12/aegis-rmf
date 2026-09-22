export interface CompliancePack {
  id: string;
  name: string;
  authority: string;
  version: string;
  installed: boolean;
  controls: number;
  summary: string;
}

export const COMPLIANCE_PACKS: CompliancePack[] = [
  { id: "nist-800-53", name: "NIST SP 800-53 Rev. 5.2.0", authority: "NIST", version: "5.2.0", installed: true, controls: 124, summary: "Canonical catalog. Baselines low / moderate / high per 800-53B." },
  { id: "fedramp", name: "FedRAMP", authority: "FedRAMP PMO", version: "Rev 5 High", installed: true, controls: 421, summary: "Cloud overlay on 800-53. Used for VANGUARD inheritance." },
  { id: "csf", name: "NIST CSF 2.0", authority: "NIST", version: "2.0", installed: true, controls: 6, summary: "Govern, Identify, Protect, Detect, Respond, Recover functions." },
  { id: "800-171", name: "NIST SP 800-171 Rev. 3", authority: "NIST", version: "3", installed: true, controls: 110, summary: "CUI protection requirements mapped from 800-53." },
  { id: "cmmc", name: "CMMC 2.0", authority: "DoD", version: "2.0 L2", installed: false, controls: 110, summary: "Level 2 practices aligned to 800-171." },
  { id: "iso27001", name: "ISO/IEC 27001:2022", authority: "ISO", version: "2022", installed: false, controls: 93, summary: "Annex A controls, crosswalked to 800-53 families." },
  { id: "cis", name: "CIS Controls v8", authority: "CIS", version: "8.1", installed: true, controls: 18, summary: "Safeguards used as implementation overlays." },
  { id: "hipaa", name: "HIPAA Security Rule", authority: "HHS", version: "2023", installed: false, controls: 54, summary: "Administrative / physical / technical safeguards." },
  { id: "pci", name: "PCI DSS 4.0", authority: "PCI SSC", version: "4.0", installed: false, controls: 12, summary: "Payment card overlay — not selected for this directorate." },
  { id: "zt-cisa", name: "CISA Zero Trust", authority: "CISA", version: "Maturity 2", installed: true, controls: 7, summary: "Seven pillars mapped to 800-53 High." },
  { id: "oscal-profile-md", name: "Mission Directorate profile", authority: "Agency", version: "2026.3", installed: true, controls: 187, summary: "High + agency + mission + cloud + ZT." },
  { id: "k8s-800-53", name: "Kubernetes overlay", authority: "NSA/CISA", version: "1.2", installed: true, controls: 42, summary: "Admission, NetworkPolicy, PSA, images." },
  { id: "c-scrm", name: "C-SCRM pack", authority: "NIST 800-161", version: "1", installed: false, controls: 36, summary: "Vendor, SBOM, and contract obligations." },
];

export interface CrosswalkHit {
  pack: string;
  ref: string;
  title: string;
}

export const CROSSWALKS: Record<string, CrosswalkHit[]> = {
  "AC-2": [
    { pack: "CSF 2.0", ref: "PR.AA-01", title: "Identities and credentials are managed" },
    { pack: "800-171", ref: "3.1.1", title: "Limit system access to authorized users" },
    { pack: "CMMC L2", ref: "AC.L2-3.1.1", title: "Authorized access control" },
    { pack: "CIS v8", ref: "5.1", title: "Establish and maintain an inventory of accounts" },
    { pack: "ISO 27001", ref: "A.5.16", title: "Identity management" },
    { pack: "FedRAMP", ref: "AC-2", title: "Account management (High)" },
  ],
  "IA-2": [
    { pack: "CSF 2.0", ref: "PR.AA-03", title: "Users are authenticated" },
    { pack: "800-171", ref: "3.5.1", title: "Identify users" },
    { pack: "CMMC L2", ref: "IA.L2-3.5.1", title: "Identification and authentication" },
    { pack: "CIS v8", ref: "6.3", title: "Require MFA" },
  ],
  "SC-7": [
    { pack: "CSF 2.0", ref: "PR.IR-01", title: "Networks are segmented" },
    { pack: "800-171", ref: "3.13.1", title: "Boundary protection" },
    { pack: "CIS v8", ref: "13.4", title: "Perform traffic filtering" },
    { pack: "FedRAMP", ref: "SC-7", title: "Boundary protection (High)" },
  ],
  "SI-2": [
    { pack: "CSF 2.0", ref: "ID.RA-01", title: "Vulnerabilities are identified" },
    { pack: "800-171", ref: "3.14.1", title: "Flaw remediation" },
    { pack: "CIS v8", ref: "7.3", title: "Perform automated operating system patch management" },
  ],
  "RA-5": [
    { pack: "CSF 2.0", ref: "ID.RA-01", title: "Vulnerabilities are identified" },
    { pack: "800-171", ref: "3.11.2", title: "Scan for vulnerabilities" },
    { pack: "CIS v8", ref: "7.5", title: "Perform automated vulnerability scans" },
  ],
  "AU-6": [
    { pack: "CSF 2.0", ref: "DE.CM-01", title: "Networks are monitored" },
    { pack: "800-171", ref: "3.3.5", title: "Correlate audit records" },
    { pack: "CIS v8", ref: "8.11", title: "Conduct audit log reviews" },
  ],
  "CM-6": [
    { pack: "CSF 2.0", ref: "PR.PS-01", title: "Configuration management" },
    { pack: "800-171", ref: "3.4.1", title: "Establish configuration baselines" },
    { pack: "CIS v8", ref: "4.1", title: "Establish and maintain a secure configuration process" },
  ],
  "CA-7": [
    { pack: "CSF 2.0", ref: "GV.OV-01", title: "Outcomes are reviewed" },
    { pack: "FedRAMP", ref: "CA-7", title: "Continuous monitoring" },
  ],
};

export function crosswalkFor(controlId: string): CrosswalkHit[] {
  const base = controlId.replace(/\([^)]+\)$/, "");
  return CROSSWALKS[controlId] ?? CROSSWALKS[base] ?? [];
}
