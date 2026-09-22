import type { ImpactLevel, RiskLevel, SystemRecord } from "./types";

export interface DiscoverySource {
  id: string;
  name: string;
  family: "itsm" | "cloud" | "identity" | "security" | "devsecops" | "network";
  finds: string;
}

export const DISCOVERY_SOURCES: DiscoverySource[] = [
  { id: "cmdb", name: "CMDB", family: "itsm", finds: "Configuration items, owners, environments" },
  { id: "aws", name: "AWS", family: "cloud", finds: "Accounts, VPCs, IAM, Config inventory" },
  { id: "azure", name: "Azure", family: "cloud", finds: "Subscriptions, Policy, resource graph" },
  { id: "gcp", name: "GCP", family: "cloud", finds: "Projects, SCC assets" },
  { id: "k8s", name: "Kubernetes", family: "cloud", finds: "Clusters, namespaces, workloads" },
  { id: "terraform", name: "Terraform", family: "devsecops", finds: "State resources and modules" },
  { id: "servicenow", name: "ServiceNow", family: "itsm", finds: "CIs, change, incidents" },
  { id: "ad", name: "Active Directory", family: "identity", finds: "Hybrid domain objects" },
  { id: "entra", name: "Entra ID", family: "identity", finds: "Users, groups, app registrations" },
  { id: "tenable", name: "Vulnerability scanners", family: "security", finds: "Authenticated hosts and apps" },
  { id: "defender", name: "Endpoint management", family: "security", finds: "Managed devices and sensors" },
  { id: "network", name: "Network discovery", family: "network", finds: "Subnets, routes, listeners" },
  { id: "github", name: "GitHub / GitLab", family: "devsecops", finds: "Repos, pipelines, IaC" },
];

export const PHASE1_ARTIFACTS = [
  { id: "sys-reg", name: "System Registration Record", nistTask: "P-18", controlIds: ["PL-2"], kind: "ssp" as const },
  { id: "sys-desc", name: "System Description", nistTask: "P-18", controlIds: ["PL-2"], kind: "ssp" as const },
  { id: "inventory", name: "System Inventory", nistTask: "P-10", controlIds: ["CM-8"], kind: "architecture" as const },
  { id: "components", name: "System Component Inventory", nistTask: "P-10", controlIds: ["CM-8"], kind: "architecture" as const },
  { id: "info-inv", name: "Information Inventory", nistTask: "P-12", controlIds: ["RA-2"], kind: "worksheet" as const },
  { id: "dataflow", name: "Data Flow Diagram", nistTask: "P-11", controlIds: ["PL-8", "SC-7"], kind: "architecture" as const },
  { id: "network", name: "Network Diagram", nistTask: "P-11", controlIds: ["SC-7"], kind: "architecture" as const },
  { id: "arch", name: "Architecture Diagram", nistTask: "P-16", controlIds: ["PL-8", "SA-8"], kind: "architecture" as const },
  { id: "boundary", name: "Authorization Boundary", nistTask: "P-11", controlIds: ["PL-2"], kind: "architecture" as const },
  { id: "isa", name: "System Interconnection Inventory", nistTask: "P-11", controlIds: ["CA-3"], kind: "isa" as const },
  { id: "mission", name: "Mission/Business Process Description", nistTask: "P-8", controlIds: ["PM-11"], kind: "worksheet" as const },
  { id: "info-types", name: "Information Types Inventory", nistTask: "P-12", controlIds: ["RA-2"], kind: "worksheet" as const },
  { id: "roles", name: "System Roles", nistTask: "P-9", controlIds: ["PM-10"], kind: "worksheet" as const },
  { id: "deps", name: "External Dependencies", nistTask: "P-10", controlIds: ["SA-9", "SR-3"], kind: "isa" as const },
  { id: "ccp", name: "Common-Control Inventory", nistTask: "P-5", controlIds: ["PM-1"], kind: "overlay" as const },
] as const;

export interface DiscoveryAsset {
  name: string;
  kind: string;
  environment: string;
  criticality: RiskLevel;
  internetExposed: boolean;
  sourceId: string;
}

export interface DiscoveryHit {
  sourceId: string;
  status: "connected" | "empty" | "unavailable";
  summary: string;
  assetCount: number;
}

export interface DiscoveryArtifact {
  kind: string;
  title: string;
  body: string;
  controlIds: string[];
  nistTask: string;
}

export interface DiscoveryDraft {
  name: string;
  acronym: string;
  owner: string;
  mission: string;
  businessFunction: string;
  hosting: string;
  cloudProvider: string;
  dataTypes: string[];
  users: string;
  geographicLocations: string[];
  interfaces: number;
  applications: string[];
  infrastructure: string[];
  dependencies: string[];
  authorizationBoundary: string;
  impactLevel: ImpactLevel;
  assets: DiscoveryAsset[];
  artifacts: DiscoveryArtifact[];
  hits: DiscoveryHit[];
  unofficial: true;
}

interface Profile {
  keys: string[];
  name: string;
  acronym: string;
  owner: string;
  mission: string;
  businessFunction: string;
  hosting: string;
  cloudProvider: string;
  dataTypes: string[];
  users: string;
  geographicLocations: string[];
  applications: string[];
  infrastructure: string[];
  dependencies: string[];
  authorizationBoundary: string;
  impactLevel: ImpactLevel;
  sources: string[];
  assets: DiscoveryAsset[];
}

const PROFILES: Profile[] = [
  {
    keys: ["aether", "c2", "command"],
    name: "Aether Command Platform",
    acronym: "AETHER-C2",
    owner: "Mission Owner, Aether Program",
    mission: "Tactical mission command, common operational picture, and order dissemination for field units.",
    businessFunction: "Mission command",
    hosting: "Cloud",
    cloudProvider: "AWS GovCloud",
    dataTypes: ["CUI", "PII", "Mission operational data"],
    users: "2,400 organizational + 180 coalition partners",
    geographicLocations: ["us-gov-west-1", "tactical edge enclaves"],
    applications: ["aether-api", "cop-ui", "order-svc"],
    infrastructure: ["EKS", "Aurora", "API Gateway", "Transit Gateway"],
    dependencies: ["ARGUS-ID", "VANGUARD-EDR", "Cross-domain guard"],
    authorizationBoundary:
      "GovCloud VPC, EKS cluster, Aurora, S3 mission stores, transit gateway to the classified cross-domain guard (out of boundary), and Entra-federated users.",
    impactLevel: "high",
    sources: ["cmdb", "aws", "k8s", "terraform", "entra", "tenable", "network", "github", "servicenow"],
    assets: [
      { name: "aether-eks-prod", kind: "Kubernetes", environment: "GovCloud", criticality: "critical", internetExposed: false, sourceId: "k8s" },
      { name: "aether-api-gw", kind: "API Gateway", environment: "GovCloud", criticality: "high", internetExposed: true, sourceId: "aws" },
      { name: "aether-aurora", kind: "Database", environment: "GovCloud", criticality: "critical", internetExposed: false, sourceId: "aws" },
      { name: "aether-tgw", kind: "Transit gateway", environment: "GovCloud", criticality: "high", internetExposed: false, sourceId: "network" },
      { name: "aether-repo", kind: "Source repo", environment: "GitHub", criticality: "moderate", internetExposed: false, sourceId: "github" },
    ],
  },
  {
    keys: ["argus", "icam", "identity"],
    name: "Argus Identity Broker",
    acronym: "ARGUS-ID",
    owner: "ICAM Program Owner",
    mission: "Enterprise identity, credential, and access management for internal systems and federation.",
    businessFunction: "Enterprise ICAM",
    hosting: "Cloud",
    cloudProvider: "Azure Government",
    dataTypes: ["PII", "Authentication assertions"],
    users: "18,000",
    geographicLocations: ["AzureGov", "enterprise enclave"],
    applications: ["entra-tenant", "pim", "app-proxy"],
    infrastructure: ["Entra ID", "Key Vault", "hybrid DCs"],
    dependencies: ["Active Directory"],
    authorizationBoundary:
      "Entra ID tenant, Privileged Identity Management, Application Proxy, Key Vault, and hybrid domain controllers in the enterprise enclave.",
    impactLevel: "moderate",
    sources: ["cmdb", "azure", "entra", "ad", "defender", "servicenow"],
    assets: [
      { name: "entra-tenant", kind: "IdP", environment: "AzureGov", criticality: "critical", internetExposed: true, sourceId: "entra" },
      { name: "pim-control-plane", kind: "PIM", environment: "AzureGov", criticality: "high", internetExposed: false, sourceId: "azure" },
      { name: "hybrid-dc-01", kind: "Domain controller", environment: "On-prem", criticality: "critical", internetExposed: false, sourceId: "ad" },
    ],
  },
  {
    keys: ["helios", "lake", "analytics", "kafka"],
    name: "Helios CUI Analytics Lake",
    acronym: "HELIOS-LAKE",
    owner: "Analytics Program Owner",
    mission: "Ingest, catalog, and analyze CUI mission datasets for analytic cells.",
    businessFunction: "Mission analytics",
    hosting: "Hybrid",
    cloudProvider: "AWS GovCloud + on-prem",
    dataTypes: ["CUI", "PII"],
    users: "320",
    geographicLocations: ["us-gov-west-1", "ANMA DC-1"],
    applications: ["lake-catalog", "athena-workgroup", "analyst-ui"],
    infrastructure: ["S3", "Glue", "Kafka", "private API"],
    dependencies: ["AETHER-C2", "ARGUS-ID"],
    authorizationBoundary:
      "S3 data lake, Glue/Athena, on-prem Kafka, restricted analyst workstations, and a private API to Aether-C2.",
    impactLevel: "moderate",
    sources: ["cmdb", "aws", "terraform", "tenable", "network", "github", "servicenow"],
    assets: [
      { name: "helios-s3-cui", kind: "Object storage", environment: "GovCloud", criticality: "high", internetExposed: false, sourceId: "aws" },
      { name: "kafka-onprem-01", kind: "Broker", environment: "On-prem", criticality: "high", internetExposed: false, sourceId: "network" },
      { name: "helios-glue", kind: "ETL", environment: "GovCloud", criticality: "moderate", internetExposed: false, sourceId: "terraform" },
      { name: "helios-athena", kind: "Query engine", environment: "GovCloud", criticality: "moderate", internetExposed: false, sourceId: "aws" },
      { name: "ci-helios-lake", kind: "CMDB CI", environment: "ServiceNow", criticality: "high", internetExposed: false, sourceId: "cmdb" },
    ],
  },
  {
    keys: ["vanguard", "edr", "endpoint"],
    name: "Vanguard Endpoint Detection",
    acronym: "VANGUARD-EDR",
    owner: "CISO Operations",
    mission: "Enterprise endpoint detection, response, and telemetry for the agency fleet.",
    businessFunction: "Endpoint security",
    hosting: "SaaS",
    cloudProvider: "FedRAMP High authorized SaaS",
    dataTypes: ["Endpoint telemetry", "CUI (limited)"],
    users: "SOC analysts + fleet",
    geographicLocations: ["FedRAMP region", "agency workstations"],
    applications: ["vanguard-console"],
    infrastructure: ["SaaS tenant", "sensor fleet"],
    dependencies: ["ARGUS-ID", "Sentinel"],
    authorizationBoundary:
      "SaaS tenant plus agency-managed sensor configuration, log forwarding to Sentinel, and admin workstations.",
    impactLevel: "low",
    sources: ["cmdb", "defender", "entra", "servicenow"],
    assets: [
      { name: "vanguard-tenant", kind: "SaaS", environment: "FedRAMP", criticality: "moderate", internetExposed: true, sourceId: "defender" },
    ],
  },
  {
    keys: ["harbor", "exchange", "cui exchange"],
    name: "Harbor CUI Exchange",
    acronym: "HARBOR",
    owner: "System owner (to be assigned)",
    mission: "Controlled exchange of CUI packages between mission cells and coalition partners.",
    businessFunction: "CUI dissemination",
    hosting: "Hybrid",
    cloudProvider: "AWS GovCloud",
    dataTypes: ["CUI"],
    users: "140 analysts + 12 operators",
    geographicLocations: ["us-gov-west-1", "ANMA DC-1"],
    applications: ["harbor-api", "harbor-ui", "drop-box"],
    infrastructure: ["EKS", "RDS", "Transit Gateway", "S3"],
    dependencies: ["ARGUS-ID", "VANGUARD-EDR"],
    authorizationBoundary:
      "GovCloud VPC hosting Harbor API and UI, RDS for transfer metadata, S3 for packages, and a private interconnect to Argus. Partner ingress is API-gateway only. Discovery is unofficial until the system owner confirms the boundary.",
    impactLevel: "moderate",
    sources: ["cmdb", "aws", "k8s", "terraform", "entra", "tenable", "network", "github"],
    assets: [
      { name: "harbor-eks", kind: "Kubernetes", environment: "GovCloud", criticality: "high", internetExposed: false, sourceId: "k8s" },
      { name: "harbor-api-gw", kind: "API Gateway", environment: "GovCloud", criticality: "high", internetExposed: true, sourceId: "aws" },
      { name: "harbor-rds", kind: "Database", environment: "GovCloud", criticality: "high", internetExposed: false, sourceId: "aws" },
      { name: "harbor-s3", kind: "Object storage", environment: "GovCloud", criticality: "high", internetExposed: false, sourceId: "terraform" },
      { name: "harbor-repo", kind: "Source repo", environment: "GitHub", criticality: "moderate", internetExposed: false, sourceId: "github" },
      { name: "harbor-scan-host", kind: "Scanner target", environment: "GovCloud", criticality: "moderate", internetExposed: false, sourceId: "tenable" },
      { name: "ci-harbor", kind: "CMDB CI", environment: "ServiceNow", criticality: "high", internetExposed: false, sourceId: "cmdb" },
    ],
  },
];

function pickProfile(input: { name?: string; acronym?: string; mission?: string; existing?: SystemRecord }): Profile {
  const hay = `${input.existing?.acronym ?? ""} ${input.existing?.name ?? ""} ${input.acronym ?? ""} ${input.name ?? ""} ${input.mission ?? ""}`.toLowerCase();
  const found = PROFILES.find((p) => p.keys.some((k) => hay.includes(k)));
  if (found) {
    if (input.name || input.acronym || input.mission) {
      return {
        ...found,
        name: input.name?.trim() || found.name,
        acronym: input.acronym?.trim().toUpperCase() || found.acronym,
        mission: input.mission?.trim() || found.mission,
      };
    }
    return found;
  }
  const harbor = PROFILES[PROFILES.length - 1];
  return {
    ...harbor,
    name: input.name?.trim() || harbor.name,
    acronym: input.acronym?.trim().toUpperCase() || harbor.acronym,
    mission: input.mission?.trim() || harbor.mission,
  };
}

function hitsFor(profile: Profile): DiscoveryHit[] {
  return DISCOVERY_SOURCES.map((s) => {
    const connected = profile.sources.includes(s.id);
    const assetCount = profile.assets.filter((a) => a.sourceId === s.id).length;
    if (!connected) {
      return { sourceId: s.id, status: "unavailable" as const, summary: "Not bound for this boundary.", assetCount: 0 };
    }
    if (assetCount === 0) {
      return { sourceId: s.id, status: "empty" as const, summary: `${s.finds}. No new CIs in this pass.`, assetCount: 0 };
    }
    return {
      sourceId: s.id,
      status: "connected" as const,
      summary: `${assetCount} CI(s) · ${s.finds}`,
      assetCount,
    };
  });
}

function artifactsFor(profile: Profile): DiscoveryArtifact[] {
  const inventory = profile.assets.map((a) => `${a.name} (${a.kind}, ${a.environment})`).join("; ");
  const bodies: Record<string, string> = {
    "sys-reg": `${profile.acronym} registered. Owner ${profile.owner}. Hosting ${profile.hosting}. Unofficial until the system owner confirms. Not an ATO.`,
    "sys-desc": `${profile.name} (${profile.acronym}). Mission: ${profile.mission} Business function: ${profile.businessFunction}. Users: ${profile.users}.`,
    inventory: `CM-8 inventory from discovery: ${inventory || "none"}. Human confirms. Engine does not issue an ATO.`,
    components: `Components: ${profile.assets.map((a) => a.kind).join(", ") || "none"}. Infrastructure: ${profile.infrastructure.join(", ")}.`,
    "info-inv": `Information inventory: ${profile.dataTypes.join(", ")}. Locations: ${profile.geographicLocations.join(", ")}.`,
    dataflow: `Applications ${profile.applications.join(", ")}. Dependencies ${profile.dependencies.join(", ")}. Hosting ${profile.hosting} / ${profile.cloudProvider}.`,
    network: `Network discovery for ${profile.acronym}: ${profile.geographicLocations.join(", ")}. Transit and listeners are unofficial until ISSO confirms.`,
    arch: `Architecture: ${profile.infrastructure.join(", ")}. Trust via ${profile.dependencies.join(", ")}.`,
    boundary: profile.authorizationBoundary,
    isa: `Interconnections / dependencies: ${profile.dependencies.join(", ") || "none"}. Confirm ISA before authorize.`,
    mission: `Mission: ${profile.mission} Business function: ${profile.businessFunction}.`,
    "info-types": `Information types: ${profile.dataTypes.join(", ")}. Feeds FIPS 199. Not a categorization decision.`,
    roles: `System owner: ${profile.owner}. ISSO and AO assigned from the component. Engine is not a role.`,
    deps: `External dependencies: ${profile.dependencies.join(", ") || "none"}.`,
    ccp: `Common-control candidates: ARGUS-ID (ICAM), VANGUARD-EDR (endpoint). Allocation is unofficial until Select.`,
  };
  return PHASE1_ARTIFACTS.map((a) => ({
    kind: a.kind,
    title: `${a.name} — ${profile.acronym}`,
    body: bodies[a.id] ?? `${a.name} drafted from discovery for ${profile.acronym}. Unofficial.`,
    controlIds: [...a.controlIds],
    nistTask: a.nistTask,
  }));
}

export function discoverInventory(input: {
  name?: string;
  acronym?: string;
  mission?: string;
  existing?: SystemRecord;
}): DiscoveryDraft {
  const profile = pickProfile(input);
  const hits = hitsFor(profile);
  return {
    name: profile.name,
    acronym: profile.acronym,
    owner: profile.owner,
    mission: profile.mission,
    businessFunction: profile.businessFunction,
    hosting: profile.hosting,
    cloudProvider: profile.cloudProvider,
    dataTypes: profile.dataTypes,
    users: profile.users,
    geographicLocations: profile.geographicLocations,
    interfaces: profile.dependencies.length + profile.applications.length,
    applications: profile.applications,
    infrastructure: profile.infrastructure,
    dependencies: profile.dependencies,
    authorizationBoundary: profile.authorizationBoundary,
    impactLevel: profile.impactLevel,
    assets: profile.assets,
    artifacts: artifactsFor(profile),
    hits,
    unofficial: true,
  };
}

export function extraFromDiscovery(
  extra: SystemRecord["extra"],
  draft: DiscoveryDraft,
): SystemRecord["extra"] {
  return {
    ...extra,
    users: draft.users,
    components: draft.assets.length,
    interfaces: draft.interfaces,
    businessFunction: draft.businessFunction,
    geographicLocations: draft.geographicLocations,
    applications: draft.applications,
    infrastructure: draft.infrastructure,
    dependencies: draft.dependencies,
    discoverySources: draft.hits.filter((h) => h.status === "connected").map((h) => h.sourceId),
    discoveryAt: new Date().toISOString(),
  };
}
