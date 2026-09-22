import type { ControlFamily, FamilyMeta } from "./types";

export const FAMILY_META: Record<ControlFamily, FamilyMeta> = {
  AC: {
    id: "AC",
    name: "Access Control",
    summary: "Limit system access to authorized users, processes, and devices.",
  },
  AT: {
    id: "AT",
    name: "Awareness and Training",
    summary: "Ensure personnel understand security and privacy responsibilities.",
  },
  AU: {
    id: "AU",
    name: "Audit and Accountability",
    summary: "Create, protect, and review system audit records.",
  },
  CA: {
    id: "CA",
    name: "Assessment, Authorization, and Monitoring",
    summary: "Assess controls, authorize systems, and monitor continuously.",
  },
  CM: {
    id: "CM",
    name: "Configuration Management",
    summary: "Establish and maintain baseline configurations and inventories.",
  },
  CP: {
    id: "CP",
    name: "Contingency Planning",
    summary: "Plan for emergency response, backup, and recovery.",
  },
  IA: {
    id: "IA",
    name: "Identification and Authentication",
    summary: "Identify and authenticate users, devices, and processes.",
  },
  IR: {
    id: "IR",
    name: "Incident Response",
    summary: "Prepare for, detect, analyze, and respond to incidents.",
  },
  MA: {
    id: "MA",
    name: "Maintenance",
    summary: "Perform and control system maintenance.",
  },
  MP: {
    id: "MP",
    name: "Media Protection",
    summary: "Protect system media and sanitize before disposal.",
  },
  PE: {
    id: "PE",
    name: "Physical and Environmental Protection",
    summary: "Limit physical access and protect the environment.",
  },
  PL: {
    id: "PL",
    name: "Planning",
    summary: "Develop security and privacy plans, including the SSP.",
  },
  PM: {
    id: "PM",
    name: "Program Management",
    summary: "Manage the organization-wide information security program.",
  },
  PS: {
    id: "PS",
    name: "Personnel Security",
    summary: "Screen, onboard, transfer, and terminate personnel securely.",
  },
  PT: {
    id: "PT",
    name: "PII Processing and Transparency",
    summary: "Manage PII processing with notice, consent, and minimization.",
  },
  RA: {
    id: "RA",
    name: "Risk Assessment",
    summary: "Assess risk, scan for vulnerabilities, and update assessments.",
  },
  SA: {
    id: "SA",
    name: "System and Services Acquisition",
    summary: "Allocate resources and apply security engineering to acquisition.",
  },
  SC: {
    id: "SC",
    name: "System and Communications Protection",
    summary: "Protect communications and isolate critical system components.",
  },
  SI: {
    id: "SI",
    name: "System and Information Integrity",
    summary: "Identify, report, and correct flaws; protect against malware.",
  },
  SR: {
    id: "SR",
    name: "Supply Chain Risk Management",
    summary: "Manage supply chain risk across products and services.",
  },
};

export const FAMILY_ORDER: ControlFamily[] = [
  "AC",
  "AT",
  "AU",
  "CA",
  "CM",
  "CP",
  "IA",
  "IR",
  "MA",
  "MP",
  "PE",
  "PL",
  "PM",
  "PS",
  "PT",
  "RA",
  "SA",
  "SC",
  "SI",
  "SR",
];
