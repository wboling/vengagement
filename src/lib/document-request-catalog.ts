export interface DocumentRequestDefinition {
  type: string;
  label: string;
  description: string;
  nistRefs: string[];
  otherRefs: string[];
  recommended: {
    criticalities?: string[];
    dataTypes?: string[];
  };
  frequency: string;
}

export const DOCUMENT_REQUEST_CATALOG: DocumentRequestDefinition[] = [
  {
    type: 'SOC2Report',
    label: 'SOC 2 Type II Report',
    description: 'Independent AICPA audit of controls across Security, Availability, Processing Integrity, Confidentiality, and/or Privacy Trust Service Criteria (TSC).',
    nistRefs: ['NIST CSF ID.SC-2', 'NIST CSF ID.SC-4', 'NIST CSF GV.SC-7'],
    otherRefs: ['ISO 27001:2022 A.5.22', 'SOC 2 TSC CC9.2', 'ABA Formal Opinion 498'],
    recommended: { criticalities: ['critical', 'high'] },
    frequency: 'Annual — issued within last 12 months',
  },
  {
    type: 'ISO27001Cert',
    label: 'ISO 27001 Certificate',
    description: 'Valid ISO/IEC 27001:2022 certification from an IAF-accredited body, including the scope statement.',
    nistRefs: ['NIST CSF ID.SC-2', 'NIST CSF GV.SC-7'],
    otherRefs: ['ISO/IEC 27001:2022', 'NIST SP 800-53 SA-9'],
    recommended: { criticalities: ['critical'] },
    frequency: 'Current certificate — confirm surveillance audits are current',
  },
  {
    type: 'PenTestReport',
    label: 'Penetration Test Report',
    description: 'Annual third-party penetration test (external + web application) with all findings, CVSS scores, and remediation status.',
    nistRefs: ['NIST CSF ID.RA-5', 'NIST SP 800-115'],
    otherRefs: ['ISO 27001:2022 A.8.8', 'OWASP Testing Guide v4.2', 'SOC 2 TSC CC4.1'],
    recommended: { criticalities: ['critical', 'high'] },
    frequency: 'Annual — conducted by independent third party',
  },
  {
    type: 'BAA',
    label: 'Business Associate Agreement (BAA)',
    description: 'Executed BAA required under HIPAA §164.308(b)(1) for any vendor handling Protected Health Information on behalf of the firm.',
    nistRefs: ['NIST CSF GV.SC-6', 'NIST SP 800-66'],
    otherRefs: ['HIPAA §164.308(b)(1)', '45 CFR §164.504(e)', 'HIPAA §164.314(a)(1)'],
    recommended: { dataTypes: ['PHI'] },
    frequency: 'Once — prior to PHI access; review on material service changes',
  },
  {
    type: 'DPA',
    label: 'Data Processing Agreement (DPA)',
    description: 'Data processing addendum per GDPR Art. 28 and CCPA for vendors processing personal data on the firm\'s behalf, including sub-processor terms.',
    nistRefs: ['NIST CSF GV.SC-6', 'NIST SP 800-122'],
    otherRefs: ['GDPR Art. 28', 'CCPA §1798.100', 'ISO 27001:2022 A.5.20'],
    recommended: { dataTypes: ['PII', 'PHI'] },
    frequency: 'Once — review annually or upon service changes',
  },
  {
    type: 'NDA',
    label: 'Non-Disclosure / Confidentiality Agreement',
    description: 'Mutual NDA covering confidential firm data, client information, attorney-client privileged materials, and work product shared during service delivery.',
    nistRefs: ['NIST CSF ID.SC-3', 'NIST SP 800-53 SA-9'],
    otherRefs: ['ISO 27001:2022 A.6.6', 'ABA Model Rule 1.6', 'ABA Formal Opinion 477R'],
    recommended: { criticalities: ['critical', 'high', 'medium'] },
    frequency: 'Once — executed prior to any confidential disclosure',
  },
  {
    type: 'MSA',
    label: 'Master Services Agreement (MSA)',
    description: 'Governing contract establishing security obligations, SLAs, audit rights, incident notification requirements, and liability terms.',
    nistRefs: ['NIST CSF ID.SC-3', 'NIST CSF GV.SC-6'],
    otherRefs: ['ISO 27001:2022 A.5.20', 'ISO 27001:2022 A.5.22', 'ABA Model Rule 5.3'],
    recommended: { criticalities: ['critical', 'high', 'medium', 'low'] },
    frequency: 'Once — review at renewal or every 2–3 years',
  },
  {
    type: 'IncidentResponsePlan',
    label: 'Incident Response Plan (Summary)',
    description: 'Vendor\'s documented IR procedure including notification timelines to the firm upon confirmed breach. Must meet ≤72-hour notification standard.',
    nistRefs: ['NIST CSF RS.RP-1', 'NIST SP 800-61 Rev. 2'],
    otherRefs: ['ISO 27001:2022 A.5.24–5.26', 'HIPAA §164.410', 'GDPR Art. 33', 'SOC 2 TSC CC7.3–CC7.5'],
    recommended: { criticalities: ['critical', 'high'] },
    frequency: 'Annual — confirm < 72-hour client notification SLA',
  },
  {
    type: 'BCPDRPlan',
    label: 'Business Continuity / DR Plan',
    description: 'Business continuity and disaster recovery plan including RTOs, RPOs, and results of the most recent tabletop or full test.',
    nistRefs: ['NIST CSF RC.RP-1', 'NIST SP 800-34'],
    otherRefs: ['ISO 27001:2022 A.5.29–5.30', 'SOC 2 TSC CC9.1', 'ISO 22301'],
    recommended: { criticalities: ['critical', 'high'] },
    frequency: 'Annual — include test results and current RTO/RPO values',
  },
  {
    type: 'SubprocessorList',
    label: 'Sub-processor / Fourth-Party Disclosure',
    description: 'Complete list of all sub-processors and fourth parties that may access firm or client data, including countries/regions and data categories.',
    nistRefs: ['NIST CSF GV.SC-7', 'NIST SP 800-161'],
    otherRefs: ['GDPR Art. 28(3)(d)', 'ISO 27001:2022 A.5.19–5.22', 'ABA Formal Opinion 498'],
    recommended: { criticalities: ['critical', 'high'], dataTypes: ['PII', 'PHI', 'ConfidentialClientData'] },
    frequency: 'Annual — or upon any material change in sub-processors',
  },
  {
    type: 'DataFlowDiagram',
    label: 'Data Flow Diagram',
    description: 'Architecture diagram showing how firm and client data flows through the vendor\'s systems, including all storage locations and cross-border transfers.',
    nistRefs: ['NIST CSF ID.AM-3', 'NIST SP 800-122'],
    otherRefs: ['ISO 27001:2022 A.5.12', 'GDPR Art. 30', 'ABA Formal Opinion 477R'],
    recommended: { criticalities: ['critical'], dataTypes: ['PII', 'PHI', 'ConfidentialClientData'] },
    frequency: 'Annual — or upon significant architecture changes',
  },
  {
    type: 'DataResidencyStatement',
    label: 'Data Residency Statement',
    description: 'Written statement identifying all countries and cloud regions where firm/client data may be stored or processed, including cross-border transfer mechanisms (SCCs, BCRs, adequacy decisions).',
    nistRefs: ['NIST SP 800-171 3.1.3', 'NIST CSF ID.AM-3'],
    otherRefs: ['GDPR Art. 44–49', 'CCPA §1798.140', 'ABA Formal Opinion 498', 'ABA Formal Opinion 503'],
    recommended: { criticalities: ['critical', 'high'], dataTypes: ['PII', 'PHI', 'ConfidentialClientData', 'ConfidentialFirmData'] },
    frequency: 'Upon onboarding — review annually or upon infrastructure changes',
  },
  {
    type: 'CyberInsuranceCert',
    label: 'Cyber Liability Insurance Certificate',
    description: 'Current certificate of cyber liability insurance showing coverage limits, policy period, and named insured. Minimum $1M per occurrence recommended for critical vendors.',
    nistRefs: ['NIST CSF GV.RM-6'],
    otherRefs: ['ISO 27001:2022 A.5.36', 'NIST SP 800-53 SA-9'],
    recommended: { criticalities: ['critical', 'high'] },
    frequency: 'Annual — must be current and meet contractual minimums',
  },
  {
    type: 'VulnerabilityDisclosurePolicy',
    label: 'Vulnerability Disclosure Policy',
    description: 'Documented policy for identifying, triaging, and disclosing security vulnerabilities including responsible disclosure timelines and CVE/CVSS handling.',
    nistRefs: ['NIST CSF ID.RA-1', 'NIST SP 800-40'],
    otherRefs: ['ISO 27001:2022 A.8.8', 'OWASP ASVS 14.2', 'CISA VDP Guidance'],
    recommended: { criticalities: ['critical', 'high'] },
    frequency: 'Upon onboarding — confirm no changes annually',
  },
];

// Extended doc type labels for types not in the core VendorDocument catalog
export const EXTENDED_DOC_TYPE_LABELS: Record<string, string> = {
  IncidentResponsePlan: 'Incident Response Plan',
  BCPDRPlan: 'BCP / DR Plan',
  SubprocessorList: 'Sub-processor List',
  DataFlowDiagram: 'Data Flow Diagram',
  CyberInsuranceCert: 'Cyber Insurance Certificate',
  VulnerabilityDisclosurePolicy: 'Vulnerability Disclosure Policy',
  DataResidencyStatement: 'Data Residency Statement',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  received: 'Received',
  waived: 'Waived',
  overdue: 'Overdue',
};
