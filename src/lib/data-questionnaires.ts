import type { QuestionnaireSection } from '@/types';

// ─── SIG Lite ────────────────────────────────────────────────────────────────
// Derived from Shared Assessments SIG Lite structure.
// Representative questions across key domains.

export const SIG_LITE_SECTIONS: QuestionnaireSection[] = [
  {
    id: 'A',
    title: 'A. Enterprise Risk Management',
    questions: [
      { id: 'A.1.1', text: 'Does the organization have a documented enterprise risk management (ERM) framework?', type: 'yes-no-na', required: true },
      { id: 'A.1.2', text: 'Is the ERM program reviewed and approved by executive management at least annually?', type: 'yes-no-na', required: true },
      { id: 'A.1.3', text: 'Are information security risks included in the ERM program?', type: 'yes-no-na', required: true },
      { id: 'A.2.1', text: 'Has the organization defined risk appetite and tolerance levels?', type: 'yes-no-na', required: true },
    ],
  },
  {
    id: 'B',
    title: 'B. Security Policy',
    questions: [
      { id: 'B.1.1', text: 'Does the organization have a documented information security policy?', type: 'yes-no-na', required: true },
      { id: 'B.1.2', text: 'Is the information security policy reviewed and updated at least annually?', type: 'yes-no-na', required: true },
      { id: 'B.1.3', text: 'Is the security policy approved by executive management?', type: 'yes-no-na', required: true },
      { id: 'B.2.1', text: 'Are employees required to acknowledge the security policy?', type: 'yes-no-na', required: true },
    ],
  },
  {
    id: 'C',
    title: 'C. Organizational Security',
    questions: [
      { id: 'C.1.1', text: 'Has the organization designated a person responsible for information security (e.g., CISO)?', type: 'yes-no-na', required: true },
      { id: 'C.1.2', text: 'Is there a security steering committee or equivalent governance body?', type: 'yes-no-na', required: true },
      { id: 'C.2.1', text: 'Are security roles and responsibilities defined and documented?', type: 'yes-no-na', required: true },
      { id: 'C.2.2', text: 'Are background checks performed on employees with access to sensitive data?', type: 'yes-no-na', required: true, helpText: 'Include contractors and third parties with privileged access.' },
    ],
  },
  {
    id: 'D',
    title: 'D. Asset Management',
    questions: [
      { id: 'D.1.1', text: 'Does the organization maintain an inventory of information assets?', type: 'yes-no-na', required: true },
      { id: 'D.1.2', text: 'Are information assets classified according to sensitivity?', type: 'yes-no-na', required: true },
      { id: 'D.2.1', text: 'Are data handling procedures defined for each classification level?', type: 'yes-no-na', required: true },
      { id: 'D.3.1', text: 'Are media containing sensitive data securely disposed of?', type: 'yes-no-na', required: true },
    ],
  },
  {
    id: 'G',
    title: 'G. IT Operations Management',
    questions: [
      { id: 'G.1.1', text: 'Are change management procedures in place for IT systems?', type: 'yes-no-na', required: true },
      { id: 'G.1.2', text: 'Is there a documented patch management program?', type: 'yes-no-na', required: true },
      { id: 'G.2.1', text: 'Are system logs monitored for security events?', type: 'yes-no-na', required: true },
      { id: 'G.2.2', text: 'Is audit logging enabled for systems handling sensitive data?', type: 'yes-no-na', required: true },
      { id: 'G.3.1', text: 'Is there a documented backup and recovery procedure?', type: 'yes-no-na', required: true },
      { id: 'G.3.2', text: 'Are backups tested at least annually?', type: 'yes-no-na', required: true },
    ],
  },
  {
    id: 'H',
    title: 'H. Access Control',
    questions: [
      { id: 'H.1.1', text: 'Is access to systems and data based on the principle of least privilege?', type: 'yes-no-na', required: true },
      { id: 'H.1.2', text: 'Is multi-factor authentication (MFA) enforced for remote access?', type: 'yes-no-na', required: true },
      { id: 'H.1.3', text: 'Is MFA enforced for access to cloud services containing sensitive data?', type: 'yes-no-na', required: true },
      { id: 'H.2.1', text: 'Are user access rights reviewed at least annually?', type: 'yes-no-na', required: true },
      { id: 'H.2.2', text: 'Is privileged access management (PAM) in place for administrative accounts?', type: 'yes-no-na', required: true },
      { id: 'H.3.1', text: 'Are generic/shared accounts prohibited or tightly controlled?', type: 'yes-no-na', required: true },
    ],
  },
  {
    id: 'I',
    title: 'I. Application Security',
    questions: [
      { id: 'I.1.1', text: 'Are secure coding practices documented and followed?', type: 'yes-no-na', required: true },
      { id: 'I.1.2', text: 'Is security testing (e.g., SAST, DAST, pen testing) performed on applications?', type: 'yes-no-na', required: true },
      { id: 'I.2.1', text: 'Are software components scanned for known vulnerabilities?', type: 'yes-no-na', required: true },
      { id: 'I.2.2', text: 'Is a web application firewall (WAF) deployed for internet-facing applications?', type: 'yes-no-na', required: true },
    ],
  },
  {
    id: 'J',
    title: 'J. Cybersecurity Incident Management',
    questions: [
      { id: 'J.1.1', text: 'Does the organization have a documented incident response plan?', type: 'yes-no-na', required: true },
      { id: 'J.1.2', text: 'Is the incident response plan tested at least annually?', type: 'yes-no-na', required: true },
      { id: 'J.2.1', text: 'Are customers notified of security incidents that may affect their data within 72 hours?', type: 'yes-no-na', required: true },
      { id: 'J.2.2', text: 'Has the organization experienced a security breach in the last 24 months?', type: 'yes-no-na', required: true,
        helpText: 'If yes, please describe the incident and remediation in the comments.' },
    ],
  },
  {
    id: 'K',
    title: 'K. Operational Resilience',
    questions: [
      { id: 'K.1.1', text: 'Does the organization have a Business Continuity Plan (BCP)?', type: 'yes-no-na', required: true },
      { id: 'K.1.2', text: 'Does the organization have a Disaster Recovery Plan (DRP)?', type: 'yes-no-na', required: true },
      { id: 'K.2.1', text: 'Are BCP/DRP exercises conducted at least annually?', type: 'yes-no-na', required: true },
      { id: 'K.2.2', text: 'What is the organization\'s documented RTO (Recovery Time Objective)?', type: 'text', required: false },
      { id: 'K.2.3', text: 'What is the organization\'s documented RPO (Recovery Point Objective)?', type: 'text', required: false },
    ],
  },
  {
    id: 'L',
    title: 'L. Compliance, Regulatory & Privacy',
    questions: [
      { id: 'L.1.1', text: 'Does the organization maintain a compliance program to address applicable laws and regulations?', type: 'yes-no-na', required: true },
      { id: 'L.1.2', text: 'Has the organization undergone an independent security assessment (SOC 2, ISO 27001, PCI DSS, etc.) in the last 24 months?', type: 'yes-no-na', required: true },
      { id: 'L.1.3', text: 'If yes, please list certifications/reports available:', type: 'text', required: false },
      { id: 'L.2.1', text: 'Does the organization have a documented privacy policy?', type: 'yes-no-na', required: true },
      { id: 'L.2.2', text: 'Has a Data Protection Impact Assessment (DPIA) been conducted where required?', type: 'yes-no-na', required: false },
    ],
  },
  {
    id: 'M',
    title: 'M. Vendor/Third-Party Management',
    questions: [
      { id: 'M.1.1', text: 'Does the organization have a third-party risk management program?', type: 'yes-no-na', required: true },
      { id: 'M.1.2', text: 'Are security requirements included in contracts with third-party vendors?', type: 'yes-no-na', required: true },
      { id: 'M.2.1', text: 'Are third-party vendors periodically assessed for security compliance?', type: 'yes-no-na', required: true },
      { id: 'M.2.2', text: 'Are data processors/subprocessors required to maintain equivalent security standards?', type: 'yes-no-na', required: true },
    ],
  },
  {
    id: 'N',
    title: 'N. Infrastructure Management',
    questions: [
      { id: 'N.1.1', text: 'Is network segmentation implemented to separate sensitive systems from general networks?', type: 'yes-no-na', required: true },
      { id: 'N.1.2', text: 'Is encryption used for data in transit (e.g., TLS 1.2+)?', type: 'yes-no-na', required: true },
      { id: 'N.1.3', text: 'Is encryption used for data at rest for sensitive/confidential data?', type: 'yes-no-na', required: true },
      { id: 'N.2.1', text: 'Is vulnerability scanning performed on infrastructure at least monthly?', type: 'yes-no-na', required: true },
      { id: 'N.2.2', text: 'Is penetration testing performed on infrastructure at least annually?', type: 'yes-no-na', required: true },
    ],
  },
];

// ─── SIG Core ─────────────────────────────────────────────────────────────────
// Extended version of SIG Lite with additional depth per domain.

export const SIG_CORE_SECTIONS: QuestionnaireSection[] = [
  ...SIG_LITE_SECTIONS.map((section) => ({
    ...section,
    questions: [
      ...section.questions,
    ],
  })),
  {
    id: 'O',
    title: 'O. Cloud Hosting Services',
    questions: [
      { id: 'O.1.1', text: 'Does the organization use cloud service providers (AWS, Azure, GCP, etc.)?', type: 'yes-no-na', required: true },
      { id: 'O.1.2', text: 'Are cloud configurations reviewed against CIS Benchmarks or equivalent?', type: 'yes-no-na', required: false },
      { id: 'O.2.1', text: 'Is data residency defined and enforced for cloud-hosted data?', type: 'yes-no-na', required: true },
      { id: 'O.2.2', text: 'Are cloud access keys and secrets managed through a secrets management solution?', type: 'yes-no-na', required: true },
      { id: 'O.3.1', text: 'Are cloud environments monitored with CSPM (Cloud Security Posture Management) tooling?', type: 'yes-no-na', required: false },
      { id: 'O.3.2', text: 'List the cloud providers and regions used for storing/processing client data:', type: 'text', required: false },
    ],
  },
  {
    id: 'P',
    title: 'P. Multi-Tenant Organizations',
    questions: [
      { id: 'P.1.1', text: 'Is data belonging to different customers logically separated?', type: 'yes-no-na', required: true },
      { id: 'P.1.2', text: 'Are controls in place to prevent cross-tenant data access?', type: 'yes-no-na', required: true },
      { id: 'P.1.3', text: 'Is customer data encryption performed with separate keys per customer?', type: 'yes-no-na', required: false },
    ],
  },
  {
    id: 'V',
    title: 'V. Privacy',
    questions: [
      { id: 'V.1.1', text: 'Does the organization have a designated Data Protection Officer (DPO) or privacy officer?', type: 'yes-no-na', required: false },
      { id: 'V.1.2', text: 'Does the organization maintain records of processing activities (ROPA) as required by GDPR?', type: 'yes-no-na', required: false },
      { id: 'V.2.1', text: 'Does the organization honor data subject rights requests (access, deletion, portability)?', type: 'yes-no-na', required: true },
      { id: 'V.2.2', text: 'What is the organization\'s process and timeframe for responding to data subject requests?', type: 'text', required: false },
      { id: 'V.3.1', text: 'Are standard contractual clauses (SCCs) or equivalent used for cross-border data transfers?', type: 'yes-no-na', required: false },
    ],
  },
];

// ─── Data Processing Questionnaire ────────────────────────────────────────────

export const DPA_SECTIONS: QuestionnaireSection[] = [
  {
    id: 'DPA-1',
    title: '1. Data Processing Overview',
    questions: [
      { id: 'DPA-1.1', text: 'What categories of personal data does your organization process on behalf of our company?', type: 'text', required: true },
      { id: 'DPA-1.2', text: 'For what purposes do you process this personal data?', type: 'text', required: true },
      { id: 'DPA-1.3', text: 'In which countries is the personal data stored or processed?', type: 'text', required: true },
      { id: 'DPA-1.4', text: 'Do you transfer personal data to third countries outside the EEA/UK?', type: 'yes-no-na', required: true },
    ],
  },
  {
    id: 'DPA-2',
    title: '2. Data Subject Rights',
    questions: [
      { id: 'DPA-2.1', text: 'Do you have processes to support data subject access requests (DSARs)?', type: 'yes-no-na', required: true },
      { id: 'DPA-2.2', text: 'Can you support the right to erasure (right to be forgotten)?', type: 'yes-no-na', required: true },
      { id: 'DPA-2.3', text: 'Can you support data portability requests?', type: 'yes-no-na', required: true },
      { id: 'DPA-2.4', text: 'What is your SLA for responding to DSAR requests?', type: 'text', required: false },
    ],
  },
  {
    id: 'DPA-3',
    title: '3. Security & Breach Notification',
    questions: [
      { id: 'DPA-3.1', text: 'Do you encrypt personal data in transit and at rest?', type: 'yes-no-na', required: true },
      { id: 'DPA-3.2', text: 'What is your data breach notification timeline to clients?', type: 'text', required: true },
      { id: 'DPA-3.3', text: 'Have you experienced a personal data breach in the last 24 months?', type: 'yes-no-na', required: true },
    ],
  },
  {
    id: 'DPA-4',
    title: '4. Sub-processors',
    questions: [
      { id: 'DPA-4.1', text: 'Do you use sub-processors to process personal data on our behalf?', type: 'yes-no-na', required: true },
      { id: 'DPA-4.2', text: 'Provide a list of material sub-processors used:', type: 'text', required: false },
      { id: 'DPA-4.3', text: 'Do you notify clients of changes to sub-processors in advance?', type: 'yes-no-na', required: true },
    ],
  },
  {
    id: 'DPA-5',
    title: '5. Compliance & Certifications',
    questions: [
      { id: 'DPA-5.1', text: 'Does your organization have a privacy program aligned with GDPR and/or CCPA?', type: 'yes-no-na', required: true },
      { id: 'DPA-5.2', text: 'List applicable certifications (ISO 27701, SOC 2 Type II, etc.):', type: 'text', required: false },
      { id: 'DPA-5.3', text: 'Do you conduct Data Protection Impact Assessments (DPIAs)?', type: 'yes-no-na', required: false },
    ],
  },
];

// ─── Basic Vendor Security Assessment ─────────────────────────────────────────

export const SECURITY_ASSESSMENT_SECTIONS: QuestionnaireSection[] = [
  {
    id: 'SA-1',
    title: '1. Organization & Governance',
    questions: [
      { id: 'SA-1.1', text: 'How many full-time employees does your organization have?', type: 'select', options: [{ value: '1-50', label: '1–50' }, { value: '51-250', label: '51–250' }, { value: '251-1000', label: '251–1,000' }, { value: '1001+', label: '1,001+' }], required: true },
      { id: 'SA-1.2', text: 'Does your organization have dedicated security personnel?', type: 'yes-no-na', required: true },
      { id: 'SA-1.3', text: 'Is your organization subject to any industry-specific regulations? (HIPAA, PCI DSS, SOX, etc.)', type: 'text', required: false },
    ],
  },
  {
    id: 'SA-2',
    title: '2. Access & Authentication',
    questions: [
      { id: 'SA-2.1', text: 'Is multi-factor authentication required for all users accessing production systems?', type: 'yes-no-na', required: true },
      { id: 'SA-2.2', text: 'Is SSO/SAML used for application access?', type: 'yes-no-na', required: false },
      { id: 'SA-2.3', text: 'How frequently are access rights reviewed?', type: 'select', options: [{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annually', label: 'Annually' }, { value: 'never', label: 'Not currently reviewed' }], required: true },
    ],
  },
  {
    id: 'SA-3',
    title: '3. Data Protection',
    questions: [
      { id: 'SA-3.1', text: 'How is data classified within your organization?', type: 'text', required: false },
      { id: 'SA-3.2', text: 'Is all data in transit encrypted with TLS 1.2 or higher?', type: 'yes-no-na', required: true },
      { id: 'SA-3.3', text: 'Is sensitive/confidential data encrypted at rest?', type: 'yes-no-na', required: true },
      { id: 'SA-3.4', text: 'What is your data retention and deletion policy?', type: 'text', required: false },
    ],
  },
  {
    id: 'SA-4',
    title: '4. Vulnerability Management',
    questions: [
      { id: 'SA-4.1', text: 'How frequently do you perform vulnerability scans?', type: 'select', options: [{ value: 'continuous', label: 'Continuously' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly or less' }], required: true },
      { id: 'SA-4.2', text: 'Do you have a penetration testing program?', type: 'yes-no-na', required: true },
      { id: 'SA-4.3', text: 'When was the last penetration test conducted?', type: 'text', required: false },
    ],
  },
  {
    id: 'SA-5',
    title: '5. Certifications & Compliance',
    questions: [
      { id: 'SA-5.1', text: 'Does your organization hold a SOC 2 Type II report?', type: 'yes-no-na', required: true },
      { id: 'SA-5.2', text: 'Does your organization hold an ISO 27001 certification?', type: 'yes-no-na', required: true },
      { id: 'SA-5.3', text: 'List any other security certifications or compliance reports:', type: 'text', required: false },
      { id: 'SA-5.4', text: 'Are certification reports available for sharing under NDA?', type: 'yes-no-na', required: true },
    ],
  },
];

// ─── Built-in questionnaire catalog ───────────────────────────────────────────

export const BUILT_IN_QUESTIONNAIRES = [
  {
    id: 'builtin-sig-lite',
    name: 'SIG Lite',
    description: 'Abbreviated Standardized Information Gathering (SIG) questionnaire covering key security domains. Suitable for medium-risk vendors.',
    type: 'sig-lite' as const,
    version: '2024.1',
    sections: SIG_LITE_SECTIONS,
    isBuiltIn: true,
  },
  {
    id: 'builtin-sig-core',
    name: 'SIG Core',
    description: 'Comprehensive Standardized Information Gathering (SIG) questionnaire. Recommended for critical and high-risk vendors.',
    type: 'sig-core' as const,
    version: '2024.1',
    sections: SIG_CORE_SECTIONS,
    isBuiltIn: true,
  },
  {
    id: 'builtin-dpa',
    name: 'Data Processing Questionnaire',
    description: 'Data protection and privacy questionnaire aligned with GDPR and CCPA. Required for vendors processing personal data.',
    type: 'dpa' as const,
    version: '2024.1',
    sections: DPA_SECTIONS,
    isBuiltIn: true,
  },
  {
    id: 'builtin-security-assessment',
    name: 'Vendor Security Assessment',
    description: 'Concise security assessment for low-to-medium risk vendors. Covers key controls without the full SIG framework.',
    type: 'security-assessment' as const,
    version: '2024.1',
    sections: SECURITY_ASSESSMENT_SECTIONS,
    isBuiltIn: true,
  },
];
