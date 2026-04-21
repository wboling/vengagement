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

// ─── Comprehensive Third-Party Security Assessment (TPSA) ─────────────────────
// Custom questionnaire combining SIG Core with extended data residency, law-firm
// specific controls, and explicit compliance framework references.
// References: NIST CSF 2.0, ISO 27001:2022, SOC 2 TSC, HIPAA, GDPR,
//             CCPA, ABA Model Rules, ABA Formal Opinions 477R / 498 / 503.

export const TPSA_SECTIONS: QuestionnaireSection[] = [
  {
    id: 'TPSA-1',
    title: '1. Enterprise Risk & Governance',
    questions: [
      {
        id: 'TPSA-1.1',
        text: 'Does the organization have a documented enterprise risk management (ERM) framework approved by executive leadership?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.RM-01; ISO 27001:2022 §6.1; SIG Lite A.1.1',
      },
      {
        id: 'TPSA-1.2',
        text: 'Is information security risk formally included within the ERM program and reviewed at least annually?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.RM-02; ISO 27001:2022 §6.1.2',
      },
      {
        id: 'TPSA-1.3',
        text: 'Has the organization defined and documented risk appetite and tolerance levels specific to information security?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.RM-06; ISO 27001:2022 §6.1.1',
      },
      {
        id: 'TPSA-1.4',
        text: 'Is there a designated information security leader (CISO or equivalent) with documented authority and board-level reporting?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.RR-02; ISO 27001:2022 §5.3; SOC 2 TSC CC1.3',
      },
      {
        id: 'TPSA-1.5',
        text: 'Does the organization conduct a formal risk assessment of its own operations and supply chain at least annually?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF ID.RA-01; ISO 27001:2022 §8.2; NIST SP 800-30',
      },
    ],
  },
  {
    id: 'TPSA-2',
    title: '2. Security Policy & Program Management',
    questions: [
      {
        id: 'TPSA-2.1',
        text: 'Does the organization maintain a documented information security policy reviewed and approved by management at least annually?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.PO-01; ISO 27001:2022 §5.2; SIG Lite B.1.1',
      },
      {
        id: 'TPSA-2.2',
        text: 'Are employees required to formally acknowledge security policies upon hire and after each revision?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.PO-02; ISO 27001:2022 §7.3; SOC 2 TSC CC1.4',
      },
      {
        id: 'TPSA-2.3',
        text: 'Is security awareness training provided to all employees at least annually, with role-based training for those handling sensitive data?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.AT-01; ISO 27001:2022 Annex A 6.3; HIPAA §164.308(a)(5)',
      },
      {
        id: 'TPSA-2.4',
        text: 'Are background checks (criminal, employment history, reference) performed on personnel with access to confidential or privileged information?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.PO; ISO 27001:2022 Annex A 6.1; ABA Formal Opinion 498 (due diligence on service providers)',
      },
    ],
  },
  {
    id: 'TPSA-3',
    title: '3. Asset Management & Data Classification',
    questions: [
      {
        id: 'TPSA-3.1',
        text: 'Does the organization maintain an up-to-date inventory of all information assets (hardware, software, data repositories)?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF ID.AM-01; ISO 27001:2022 Annex A 5.9; SIG Lite D.1.1',
      },
      {
        id: 'TPSA-3.2',
        text: 'Are all information assets classified according to sensitivity (e.g., Public / Internal / Confidential / Restricted)?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF ID.AM-05; ISO 27001:2022 Annex A 5.12; SOC 2 TSC CC6.1',
      },
      {
        id: 'TPSA-3.3',
        text: 'Are defined data handling procedures enforced for each classification level, including for attorney-client privileged and confidential client data?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.DS; ISO 27001:2022 Annex A 5.13; ABA Model Rule 1.6',
      },
      {
        id: 'TPSA-3.4',
        text: 'Is media containing sensitive or confidential data securely sanitized (NIST 800-88 or equivalent) prior to disposal or reuse?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.DS-03; NIST SP 800-88; ISO 27001:2022 Annex A 7.14',
      },
      {
        id: 'TPSA-3.5',
        text: 'Does the organization maintain a records of processing activities (ROPA) identifying what data is processed, for what purpose, and on whose behalf?',
        type: 'yes-no-na', required: false,
        helpText: 'Ref: GDPR Art. 30; ISO 27001:2022 Annex A 5.12; NIST SP 800-122',
      },
    ],
  },
  {
    id: 'TPSA-4',
    title: '4. Access Control & Identity Management',
    questions: [
      {
        id: 'TPSA-4.1',
        text: 'Is access to systems and data granted on the basis of least privilege and need-to-know?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.AA-05; ISO 27001:2022 Annex A 5.15; SOC 2 TSC CC6.3',
      },
      {
        id: 'TPSA-4.2',
        text: 'Is multi-factor authentication (MFA) enforced for all remote access, privileged accounts, and cloud services hosting confidential data?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.AA-03; ISO 27001:2022 Annex A 8.5; HIPAA §164.312(d); SOC 2 TSC CC6.1',
      },
      {
        id: 'TPSA-4.3',
        text: 'Is privileged access managed through a Privileged Access Management (PAM) solution with session recording for high-privilege accounts?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.AA-05; ISO 27001:2022 Annex A 8.18; CIS Control 5',
      },
      {
        id: 'TPSA-4.4',
        text: 'Are user access rights reviewed at least quarterly for privileged accounts and annually for standard accounts?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.AA-05; ISO 27001:2022 Annex A 5.18; SOC 2 TSC CC6.2',
      },
      {
        id: 'TPSA-4.5',
        text: 'Are access provisioning and de-provisioning processes tied to HR onboarding and offboarding workflows with defined SLAs?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.AA-02; ISO 27001:2022 Annex A 5.17; SOC 2 TSC CC6.2',
      },
      {
        id: 'TPSA-4.6',
        text: 'Are generic, shared, or default accounts prohibited or subject to strict compensating controls?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: ISO 27001:2022 Annex A 5.16; NIST SP 800-53 AC-2; SIG Lite H.3.1',
      },
    ],
  },
  {
    id: 'TPSA-5',
    title: '5. Data Residency, Sovereignty & Retention',
    questions: [
      {
        id: 'TPSA-5.1',
        text: 'In which countries and cloud regions is firm or client data stored, processed, or backed up? Please list all locations.',
        type: 'text', required: true,
        helpText: 'Ref: NIST SP 800-171 §3.1.3; GDPR Art. 44–49; ABA Formal Opinion 498; ABA Formal Opinion 503 — Vendors must disclose all data locations to enable firms to comply with client confidentiality obligations.',
      },
      {
        id: 'TPSA-5.2',
        text: 'Can data residency be contractually restricted to specific jurisdictions (e.g., US-only) upon request?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF ID.AM-03; GDPR Art. 28; ABA Formal Opinion 498 — Some clients require data remain in specific jurisdictions; vendor must be able to accommodate.',
      },
      {
        id: 'TPSA-5.3',
        text: 'If data is transferred outside the EEA or UK, what legal transfer mechanism is used (SCCs, adequacy decision, BCRs)?',
        type: 'text', required: false,
        helpText: 'Ref: GDPR Art. 44–49; UK GDPR §46; ISO 27001:2022 Annex A 5.33',
      },
      {
        id: 'TPSA-5.4',
        text: 'Does the organization have a documented data retention schedule that defines minimum and maximum retention periods by data category?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.DS-04; ISO 27001:2022 Annex A 5.33; HIPAA §164.530(j); GDPR Art. 5(1)(e)',
      },
      {
        id: 'TPSA-5.5',
        text: 'Upon contract termination, what is the vendor\'s process and timeline for returning or securely destroying client data? Is a certificate of destruction provided?',
        type: 'text', required: true,
        helpText: 'Ref: NIST CSF PR.DS-03; GDPR Art. 28(3)(g); NIST SP 800-88; ABA Model Rule 1.16 — Firms have duties to return client property; vendors must support secure data return/deletion.',
      },
      {
        id: 'TPSA-5.6',
        text: 'Are backup copies of data stored in geographically separate locations, and are those backup locations subject to the same residency and access controls as primary data?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.DS-11; ISO 27001:2022 Annex A 8.13; HIPAA §164.310(a)(2)(i)',
      },
      {
        id: 'TPSA-5.7',
        text: 'Does the organization maintain immutable, air-gapped, or offline backups to protect against ransomware?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF RC.RP; NIST SP 800-209; CIS Control 11 — Critical for ransomware resilience protecting client and privileged matter files.',
      },
    ],
  },
  {
    id: 'TPSA-6',
    title: '6. Encryption & Cryptographic Controls',
    questions: [
      {
        id: 'TPSA-6.1',
        text: 'Is all data in transit encrypted using TLS 1.2 or higher? Is TLS 1.0/1.1 disabled?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.DS-02; NIST SP 800-52; ISO 27001:2022 Annex A 5.14; HIPAA §164.312(e)(2)(ii)',
      },
      {
        id: 'TPSA-6.2',
        text: 'Is confidential and sensitive data encrypted at rest using AES-256 or equivalent? Does this include backups and archived data?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.DS-01; ISO 27001:2022 Annex A 8.24; HIPAA §164.312(a)(2)(iv); SOC 2 TSC CC6.1',
      },
      {
        id: 'TPSA-6.3',
        text: 'Are encryption keys managed through a dedicated key management system (KMS) with separation of duties between key custodians?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.DS-01; NIST SP 800-57; ISO 27001:2022 Annex A 8.24',
      },
      {
        id: 'TPSA-6.4',
        text: 'Is customer data encrypted with separate, customer-specific keys (tenant-level encryption)?',
        type: 'yes-no-na', required: false,
        helpText: 'Ref: ISO 27001:2022 Annex A 8.24; CSA STAR CCM DS-07 — Preferred for cloud services handling attorney-client privileged materials.',
      },
      {
        id: 'TPSA-6.5',
        text: 'Does the organization have a cryptographic algorithm policy prohibiting deprecated algorithms (MD5, SHA-1, DES, 3DES)?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST SP 800-131A; ISO 27001:2022 Annex A 8.24; NIST CSF PR.DS',
      },
    ],
  },
  {
    id: 'TPSA-7',
    title: '7. Network & Infrastructure Security',
    questions: [
      {
        id: 'TPSA-7.1',
        text: 'Is network segmentation implemented to isolate production systems, payment systems, and sensitive data environments from corporate networks?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.IR-01; ISO 27001:2022 Annex A 8.22; SOC 2 TSC CC6.6',
      },
      {
        id: 'TPSA-7.2',
        text: 'Is a next-generation firewall (NGFW) or equivalent in place with documented rule review and approval processes?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.IR-01; ISO 27001:2022 Annex A 8.20; CIS Control 12',
      },
      {
        id: 'TPSA-7.3',
        text: 'Is an intrusion detection or prevention system (IDS/IPS) deployed on network segments carrying sensitive data?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF DE.CM-01; ISO 27001:2022 Annex A 8.16; SOC 2 TSC CC7.2',
      },
      {
        id: 'TPSA-7.4',
        text: 'Is a SIEM (Security Information and Event Management) solution in place with 24/7 monitoring and defined escalation procedures?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF DE.CM-03; ISO 27001:2022 Annex A 8.15–8.16; SOC 2 TSC CC7.2',
      },
      {
        id: 'TPSA-7.5',
        text: 'Is vulnerability scanning performed on infrastructure at least monthly and are critical findings remediated within defined SLAs (e.g., critical/high within 30 days)?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF ID.RA-01; ISO 27001:2022 Annex A 8.8; CIS Control 7',
      },
      {
        id: 'TPSA-7.6',
        text: 'Is a formal patch management program in place with defined timelines for critical patches (vendor SLA for critical CVEs)?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF ID.RA-01; ISO 27001:2022 Annex A 8.8; NIST SP 800-40',
      },
      {
        id: 'TPSA-7.7',
        text: 'What is the vendor\'s SLA for patching Critical (CVSS 9.0+) and High (CVSS 7.0–8.9) severity vulnerabilities?',
        type: 'text', required: true,
        helpText: 'Ref: NIST SP 800-40; ISO 27001:2022 Annex A 8.8 — Firms require evidence of timely patching to satisfy client data protection duties.',
      },
    ],
  },
  {
    id: 'TPSA-8',
    title: '8. Application Security & Secure Development',
    questions: [
      {
        id: 'TPSA-8.1',
        text: 'Is a formal Secure Development Lifecycle (SDLC) in place with security requirements integrated from design through deployment?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF ID.AM; PR.IP-02; ISO 27001:2022 Annex A 8.25–8.26; OWASP SAMM',
      },
      {
        id: 'TPSA-8.2',
        text: 'Is static application security testing (SAST) and/or dynamic application security testing (DAST) integrated into the CI/CD pipeline?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.IP-02; ISO 27001:2022 Annex A 8.29; OWASP ASVS L2/L3',
      },
      {
        id: 'TPSA-8.3',
        text: 'Are third-party and open-source components tracked in a software bill of materials (SBOM) and scanned for known vulnerabilities (CVEs)?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF ID.AM-08; NIST SP 800-161; Executive Order 14028 — Supply chain software risk management is a regulatory priority.',
      },
      {
        id: 'TPSA-8.4',
        text: 'Is a Web Application Firewall (WAF) deployed for all internet-facing applications?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.IR; ISO 27001:2022 Annex A 8.21; OWASP Top 10',
      },
      {
        id: 'TPSA-8.5',
        text: 'Does the organization follow OWASP Top 10 guidance or equivalent for web application security, and is this verified through independent testing?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.IP-02; ISO 27001:2022 Annex A 8.28; OWASP Top 10',
      },
      {
        id: 'TPSA-8.6',
        text: 'Is code review (manual or automated) performed on security-sensitive components prior to production deployment?',
        type: 'yes-no-na', required: false,
        helpText: 'Ref: ISO 27001:2022 Annex A 8.28; NIST SP 800-53 SA-11; OWASP Code Review Guide',
      },
    ],
  },
  {
    id: 'TPSA-9',
    title: '9. Cloud Services & Multi-Tenancy',
    questions: [
      {
        id: 'TPSA-9.1',
        text: 'Which cloud service providers (AWS, Azure, GCP, etc.) and which geographic regions are used to host or process firm or client data? List all.',
        type: 'text', required: true,
        helpText: 'Ref: NIST CSF ID.AM-03; ISO 27001:2022 Annex A 5.23; ABA Formal Opinion 498 — Firms must understand where cloud-hosted data resides to satisfy client confidentiality obligations.',
      },
      {
        id: 'TPSA-9.2',
        text: 'Are cloud environments configured against a recognized hardening benchmark (CIS Benchmarks, DISA STIGs, or vendor-specific security baseline)?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.IP-01; ISO 27001:2022 Annex A 8.9; CIS Benchmarks',
      },
      {
        id: 'TPSA-9.3',
        text: 'Is Cloud Security Posture Management (CSPM) tooling in place with automated alerts for misconfigurations?',
        type: 'yes-no-na', required: false,
        helpText: 'Ref: NIST CSF DE.CM; ISO 27001:2022 Annex A 5.23; CSA STAR Level 2',
      },
      {
        id: 'TPSA-9.4',
        text: 'Is client/firm data logically isolated from other customers\' data at the storage and compute layer?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.DS; ISO 27001:2022 Annex A 5.10; CSA CCM DS-04 — Attorney-client privileged data must be isolated from other tenants.',
      },
      {
        id: 'TPSA-9.5',
        text: 'Does the shared responsibility model clearly document what security controls the vendor provides vs. what the firm must implement?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.SC; ISO 27001:2022 Annex A 5.23; CSA STAR',
      },
      {
        id: 'TPSA-9.6',
        text: 'Are cloud access keys, secrets, and credentials managed through a dedicated secrets management solution (e.g., HashiCorp Vault, AWS Secrets Manager)?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.AA; ISO 27001:2022 Annex A 8.12; CIS Control 16',
      },
    ],
  },
  {
    id: 'TPSA-10',
    title: '10. Incident Response & Breach Notification',
    questions: [
      {
        id: 'TPSA-10.1',
        text: 'Does the organization have a documented and tested Incident Response Plan (IRP) reviewed at least annually?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF RS.RP-01; ISO 27001:2022 Annex A 5.24; NIST SP 800-61 Rev. 2; SOC 2 TSC CC7.3',
      },
      {
        id: 'TPSA-10.2',
        text: 'Is the incident response plan tested via tabletop exercises or simulations at least annually, with results documented?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF RS.IM-01; ISO 27001:2022 Annex A 5.26; SOC 2 TSC CC7.5',
      },
      {
        id: 'TPSA-10.3',
        text: 'What is the vendor\'s contractual commitment for notifying the firm of a confirmed security incident affecting firm or client data? Provide the specific timeframe.',
        type: 'text', required: true,
        helpText: 'Ref: NIST CSF RS.CO-03; HIPAA §164.410 (60 days); GDPR Art. 33 (72 hours to supervisory authority); ABA Formal Opinion 483 — Law firms have affirmative duties to notify clients of breaches.',
      },
      {
        id: 'TPSA-10.4',
        text: 'Does the notification obligation extend to suspected incidents (not just confirmed breaches), and does it include incidents at sub-processors?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF RS.CO-03; GDPR Art. 33; ABA Formal Opinion 483 — Firms need early notice to fulfill their own client notification obligations.',
      },
      {
        id: 'TPSA-10.5',
        text: 'Has the organization experienced a security breach, ransomware incident, or unauthorized access to client data in the last 24 months?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: SOC 2 TSC CC7.4; ISO 27001:2022 Annex A 5.26 — If yes, describe the incident, scope, and remediation steps in the comments.',
      },
      {
        id: 'TPSA-10.6',
        text: 'Does the organization maintain a security incident log, and are post-incident reviews (PIRs) conducted to identify root cause and prevent recurrence?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF RS.IM-02; ISO 27001:2022 Annex A 5.26–5.27; SOC 2 TSC CC7.5',
      },
    ],
  },
  {
    id: 'TPSA-11',
    title: '11. Business Continuity & Resilience',
    questions: [
      {
        id: 'TPSA-11.1',
        text: 'Does the organization have a formally documented Business Continuity Plan (BCP) and Disaster Recovery Plan (DRP)?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF RC.RP; ISO 27001:2022 Annex A 5.29; NIST SP 800-34; SOC 2 TSC A1.2',
      },
      {
        id: 'TPSA-11.2',
        text: 'What are the vendor\'s documented Recovery Time Objective (RTO) and Recovery Point Objective (RPO) for services handling firm or client data?',
        type: 'text', required: true,
        helpText: 'Ref: NIST CSF RC.RP-01; ISO 27001:2022 Annex A 5.30; SOC 2 TSC A1.2 — RTOs directly impact a firm\'s ability to serve clients during a vendor outage.',
      },
      {
        id: 'TPSA-11.3',
        text: 'Are BCP/DRP tests conducted at least annually, with test results and identified gaps documented?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF RC.RP-02; ISO 27001:2022 Annex A 5.29; SOC 2 TSC A1.3; ISO 22301',
      },
      {
        id: 'TPSA-11.4',
        text: 'Is the production environment replicated to a geographically separate secondary site or availability zone with automated failover capability?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF PR.IR-04; ISO 27001:2022 Annex A 8.14; SOC 2 TSC A1.2',
      },
    ],
  },
  {
    id: 'TPSA-12',
    title: '12. Third & Fourth-Party Risk Management',
    questions: [
      {
        id: 'TPSA-12.1',
        text: 'Does the organization have a formal third-party risk management program covering supplier assessment, due diligence, and ongoing monitoring?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.SC-01; ISO 27001:2022 Annex A 5.19; NIST SP 800-161',
      },
      {
        id: 'TPSA-12.2',
        text: 'Are security requirements (including data protection, breach notification, and audit rights) contractually required from all sub-processors and fourth parties with access to firm or client data?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.SC-06; ISO 27001:2022 Annex A 5.20; GDPR Art. 28(3); ABA Formal Opinion 498',
      },
      {
        id: 'TPSA-12.3',
        text: 'Provide a complete list of sub-processors and fourth parties that may access, store, or process firm or client data, including their countries of operation.',
        type: 'text', required: true,
        helpText: 'Ref: NIST CSF GV.SC-07; GDPR Art. 28(3)(d); ISO 27001:2022 Annex A 5.22; ABA Formal Opinion 498 — Firms must be able to assess the full supply chain.',
      },
      {
        id: 'TPSA-12.4',
        text: 'Are sub-processors assessed for security compliance at least annually using questionnaires, audits, or review of certifications?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.SC-04; ISO 27001:2022 Annex A 5.22; SOC 2 TSC CC9.2',
      },
      {
        id: 'TPSA-12.5',
        text: 'Does the organization notify clients in advance of adding or replacing material sub-processors, with an objection period?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: GDPR Art. 28(3)(d); ISO 27001:2022 Annex A 5.19; ABA Formal Opinion 498 — Advance notice enables firms to assess downstream risk.',
      },
    ],
  },
  {
    id: 'TPSA-13',
    title: '13. Compliance, Certifications & Regulatory',
    questions: [
      {
        id: 'TPSA-13.1',
        text: 'Does the organization hold a current SOC 2 Type II report? If yes, which Trust Service Criteria are covered, and when was the most recent report issued?',
        type: 'text', required: true,
        helpText: 'Ref: NIST CSF GV.OC; SOC 2 (AICPA TSC); ISO 27001:2022 Annex A 5.36 — SOC 2 Type II is the primary attestation requested by law firms assessing vendor controls.',
      },
      {
        id: 'TPSA-13.2',
        text: 'Does the organization hold a current ISO/IEC 27001:2022 certification from an IAF-accredited body? If yes, what is the scope?',
        type: 'yes-no-na', required: false,
        helpText: 'Ref: ISO/IEC 27001:2022; NIST CSF ID.SC-2',
      },
      {
        id: 'TPSA-13.3',
        text: 'If subject to HIPAA, does the organization have documented HIPAA compliance policies and a Privacy and Security Officer?',
        type: 'yes-no-na', required: false,
        helpText: 'Ref: HIPAA §164.308(a)(2); 45 CFR Part 164 — Required when vendor handles PHI on behalf of a covered entity or business associate.',
      },
      {
        id: 'TPSA-13.4',
        text: 'Does the organization have a program to track and comply with applicable state privacy laws (CCPA, CPRA, Virginia CDPA, Colorado CPA, etc.)?',
        type: 'yes-no-na', required: false,
        helpText: 'Ref: CCPA §1798.100; CPRA; NIST Privacy Framework — Multi-state privacy compliance is increasingly required for vendors serving US enterprises.',
      },
      {
        id: 'TPSA-13.5',
        text: 'Has the organization undergone an independent penetration test by a qualified third party within the last 12 months? Is the report available under NDA?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF ID.RA-06; NIST SP 800-115; SOC 2 TSC CC4.1; ISO 27001:2022 Annex A 8.8',
      },
      {
        id: 'TPSA-13.6',
        text: 'Does the organization hold cyber liability insurance? What is the coverage limit per occurrence and in aggregate?',
        type: 'text', required: true,
        helpText: 'Ref: NIST CSF GV.RM-06; ISO 27001:2022 Annex A 5.36 — Cyber insurance provides recourse for breach-related losses including law firm client notification costs.',
      },
      {
        id: 'TPSA-13.7',
        text: 'Are internal audits of the information security management system (ISMS) or security controls performed at least annually?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: ISO 27001:2022 §9.2; NIST CSF GV.OC-04; SOC 2 TSC CC4.1',
      },
    ],
  },
  {
    id: 'TPSA-14',
    title: '14. Legal Industry & Professional Service Controls',
    questions: [
      {
        id: 'TPSA-14.1',
        text: 'Does the organization understand that it may handle attorney-client privileged communications and work product, and are specific controls in place to protect such materials from disclosure?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: ABA Model Rule 1.6 (confidentiality of client information); ABA Formal Opinion 477R — Service providers to law firms must understand and protect privilege.',
      },
      {
        id: 'TPSA-14.2',
        text: 'Has the organization reviewed and agreed to comply with applicable bar association guidance on cloud computing and outsourcing (e.g., ABA Formal Opinions 477R, 498, 503)?',
        type: 'yes-no-na', required: false,
        helpText: 'Ref: ABA Formal Opinion 477R (cybersecurity); ABA Formal Opinion 498 (virtual practice); ABA Formal Opinion 503 (cloud storage) — Demonstrates vendor awareness of legal industry obligations.',
      },
      {
        id: 'TPSA-14.3',
        text: 'Does the organization\'s legal/compliance team receive regular training on the confidentiality obligations applicable to law firm clients?',
        type: 'yes-no-na', required: false,
        helpText: 'Ref: ABA Model Rule 5.3 (responsibilities regarding non-lawyer assistance); NIST CSF PR.AT',
      },
      {
        id: 'TPSA-14.4',
        text: 'Does the vendor\'s incident response plan include specific procedures for incidents involving attorney-client privileged data, including escalation to the firm\'s general counsel?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: ABA Formal Opinion 483 (lawyer obligations after electronic breach); ABA Model Rule 1.4 — Firms must promptly inform clients of material data incidents.',
      },
      {
        id: 'TPSA-14.5',
        text: 'Does the organization support legal hold and litigation hold requests, including the ability to place specific data under hold to prevent deletion?',
        type: 'yes-no-na', required: false,
        helpText: 'Ref: FRCP Rule 37(e); ABA Model Rule 3.4 — Legal holds are a routine requirement for law firm clients involved in litigation.',
      },
      {
        id: 'TPSA-14.6',
        text: 'Does the organization agree to allow the firm to conduct security audits or assessments (directly or through a qualified third party) with reasonable notice?',
        type: 'yes-no-na', required: true,
        helpText: 'Ref: NIST CSF GV.SC-04; ISO 27001:2022 Annex A 5.22; ABA Formal Opinion 498 — Audit rights are a standard requirement in law firm vendor contracts.',
      },
      {
        id: 'TPSA-14.7',
        text: 'Can the organization provide evidence of compliance with any client-specific security requirements (e.g., client security requirements letters, outside counsel guidelines)?',
        type: 'yes-no-na', required: false,
        helpText: 'Ref: ABA Model Rule 1.6; Outside Counsel Guidelines (OCGs) — Many law firm clients impose security requirements that flow down to the firm\'s vendors.',
      },
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
  {
    id: 'builtin-tpsa',
    name: 'Comprehensive Third-Party Security Assessment (TPSA)',
    description: 'Custom law-firm security questionnaire combining SIG Core with extended data residency controls, cloud security, and legal industry obligations. All questions reference NIST CSF 2.0, ISO 27001:2022, SOC 2 TSC, HIPAA, GDPR, and ABA guidance. Recommended for critical and high-risk vendors.',
    type: 'custom' as const,
    version: '2025.1',
    sections: TPSA_SECTIONS,
    isBuiltIn: true,
  },
];
