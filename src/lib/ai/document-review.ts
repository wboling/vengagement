import type { AiReviewResult, RiskLevel } from '@/types';
import { prisma } from '@/lib/db/prisma';
import { calculateVendorRiskScore } from '@/lib/risk-calculator';

function parseAiJson(content: string): AiReviewResult {
  // Strip markdown code fences if the model wrapped the JSON
  const stripped = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  return JSON.parse(stripped) as AiReviewResult;
}

interface AiConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

async function getTenantAiConfig(tenantId: string): Promise<AiConfig | null> {
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } });

  if (settings?.aiEnabled && settings.aiProvider && settings.aiApiKey) {
    return {
      provider: settings.aiProvider,
      apiKey: settings.aiApiKey,
      model: settings.aiModel ?? getDefaultModel(settings.aiProvider),
      baseUrl: settings.aiBaseUrl ?? undefined,
    };
  }

  if (process.env.AI_API_KEY && process.env.AI_PROVIDER) {
    return {
      provider: process.env.AI_PROVIDER,
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL ?? getDefaultModel(process.env.AI_PROVIDER),
    };
  }

  return null;
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'claude':       return 'claude-sonnet-4-6';
    case 'openai':       return 'gpt-4o';
    case 'azure-openai': return 'gpt-4o';
    default:             return 'gpt-4o';
  }
}

function buildSystemPrompt(documentType: string): string {
  const baseSchema = `{
  "summary": "1-3 sentence plain-language summary",
  "documentType": "identified document type",
  "effectiveDate": "YYYY-MM-DD or null",
  "expirationDate": "YYYY-MM-DD or null",
  "renewalDate": "YYYY-MM-DD or null",
  "parties": ["list of party names"],
  "keyProvisions": ["5-10 important provisions and terms"],
  "riskFlags": [
    { "severity": "critical|high|medium|low", "description": "specific risk", "mitigation": "how to address this risk" }
  ],
  "riskContributors": [
    { "item": "specific clause or provision", "impact": "how this increases risk", "mitigation": "recommended action" }
  ],
  "missingClauses": ["expected clauses that are absent"],
  "recommendations": ["3-5 actionable recommendations"],
  "overallRisk": "critical|high|medium|low"
}`;

  if (documentType === 'Contract' || documentType === 'MSA' || documentType === 'SLA') {
    return `You are a legal contract analyst for a law firm. Analyze this contract and respond with JSON only:
${baseSchema}

STANDARDS BENCHMARK: Evaluate this contract against common best-practice contract standards. Flag deviations as risks.
- Liability caps should be present and mutual; uncapped vendor liability exposure is a critical risk.
- Termination for convenience should allow reasonable notice (30–90 days is standard); shorter is adverse.
- Auto-renewal opt-out windows shorter than 60 days are high risk.
- Data processing terms should align with GDPR Article 28 and CCPA requirements if applicable.
- SLAs should specify uptime guarantees (≥99.9% is typical for SaaS), remedies, and credits.
- Governing law should be a favorable jurisdiction; arbitration-only clauses limiting court access are a risk.

keyProvisions MUST include:
- Termination rights and required notice periods
- Auto-renewal clauses and opt-out deadlines
- Price escalation or unilateral change-of-terms provisions
- Liability caps and indemnification scope
- SLA commitments and penalty/credit provisions
- Governing law and dispute resolution mechanism
- IP ownership and data rights
- Data security and breach notification obligations

riskContributors: identify specific clauses that deviate from the above standards and quantify the risk exposure.

Respond with only the JSON object, no markdown.`;
  }

  if (documentType === 'OCG') {
    const ocgSchema = baseSchema.replace(
      '"overallRisk": "critical|high|medium|low"',
      `"overallRisk": "critical|high|medium|low",
  "aiUsageRestrictions": {
    "detected": true,
    "summary": "1-2 sentence description of AI/GenAI restrictions, or null if none detected",
    "restrictions": ["specific restriction text from the OCG"],
    "permittedUses": ["any explicitly permitted AI uses"],
    "prohibitedUses": ["explicitly prohibited AI uses, tools, or platforms"],
    "requiresDisclosure": true,
    "requiresClientConsent": false
  }`
    );

    return `You are a legal billing and compliance analyst specializing in Outside Counsel Guidelines for law firms. Analyze this OCG and respond with JSON only:
${ocgSchema}

STANDARDS BENCHMARK: Evaluate this OCG against ABA Model Rules (1.5 reasonable fees, 1.6 confidentiality, 5.3 supervision of non-lawyers), ABA Formal Opinions 477R, 498, 503, and 512 on technology and AI use, applicable state bar rules, and common industry security standards (NIST CSF, ISO 27001, SOC 2). Flag any requirements that conflict with these standards or create undue compliance burden.

keyProvisions MUST cover:
BILLING:
- Timekeeper rate approval requirements and caps
- Billing increment restrictions (0.1-hour increments are standard; smaller increments are unusual)
- Prohibited practices (block billing, excessive conferencing, overhead charges)
- Budget approval thresholds and pre-approval requirements
- Invoice submission format and deadlines
- Expense reimbursement limitations

SECURITY & CONFIDENTIALITY:
- Required security certifications (SOC 2 Type II, ISO 27001) — flag if absent as high risk
- Data handling, storage, and transmission restrictions
- Breach notification requirements and timeline (flag if shorter than 72 hours as operationally difficult)
- Subcontractor and vendor approval requirements
- Encryption standards required

AI / GENERATIVE AI USAGE (CRITICAL — analyze thoroughly):
Search the entire document for any language related to: artificial intelligence, generative AI, AI tools, large language models, LLMs, ChatGPT, Copilot, machine learning, automated tools, technology-assisted review, e-discovery AI, or similar terms. Extract ALL such provisions verbatim.

For aiUsageRestrictions:
- "detected": set to true if ANY AI-related language exists, false if completely absent
- "summary": plain-language description of the client's AI stance, or null if not addressed
- "restrictions": verbatim quotes or close paraphrases of each restriction
- "permittedUses": any AI uses the client explicitly allows (e.g., "technology-assisted review for e-discovery is permitted")
- "prohibitedUses": specific tools, platforms, or use cases that are banned (e.g., "use of ChatGPT or similar consumer-grade LLMs is prohibited")
- "requiresDisclosure": true if the OCG requires the firm to disclose AI usage to the client
- "requiresClientConsent": true if the OCG requires the client's prior written consent before using AI tools

Common AI restriction patterns to look for:
- Blanket prohibition on generative AI tools
- Prohibition on inputting client confidential information into AI systems
- Requirements to disclose AI-generated work product
- Prohibition on billing AI-generated time
- Requirements to obtain client consent before using AI
- Requirements that AI-generated content be reviewed by a licensed attorney
- Restrictions on specific named tools (ChatGPT, Copilot, Harvey, etc.)

RISK FLAGS (assess against standards):
- Insurance requirements exceeding standard professional liability coverage — flag amounts
- Indemnification obligations broader than ABA Model Rules contemplate
- Unlimited or uncapped liability provisions
- Audit rights allowing unannounced access — flag as operational risk
- Requirements mandating specific software, hardware, or certifications not tied to a recognized standard
- AI restrictions that could conflict with firm-wide technology investments or efficiency initiatives — flag as operational risk

Respond with only the JSON object, no markdown.`;
  }

  if (documentType === 'BAA') {
    return `You are a HIPAA compliance analyst. Analyze this Business Associate Agreement and respond with JSON only:
${baseSchema}

STANDARDS BENCHMARK: Evaluate against HIPAA Privacy Rule (45 CFR §164.504), HIPAA Security Rule (45 CFR §164.308–§164.312), and HITECH Act requirements. Flag every deviation from these requirements.

Required elements — flag as CRITICAL if missing:
- Permitted and required uses and disclosures of PHI (must be limited to contract purpose)
- Breach notification obligation within 60 days of discovery (HITECH §13402) — flag longer timelines as critical
- Subcontractor BAA requirement (must flow down to all subcontractors handling PHI)
- PHI return or destruction upon termination (required by §164.504(e)(2)(ii)(J))
- Individual rights support (access, amendment, accounting of disclosures per §164.524–§164.528)
- Minimum necessary standard compliance (§164.514(d))

Security Rule safeguards to verify:
- Administrative safeguards: security officer designation, workforce training, access management
- Physical safeguards: facility controls, workstation security, device controls
- Technical safeguards: access controls, audit controls, integrity controls, transmission security (encryption)

Flag as critical: breach notification > 60 days, no subcontractor BAA requirement, no destruction obligation at termination, no encryption requirement for data in transit.
Flag as high: no defined audit rights, missing individual rights support, vague "appropriate safeguards" language without specifics.

Respond with only the JSON object, no markdown.`;
  }

  if (documentType === 'DPA') {
    return `You are a data privacy compliance analyst. Analyze this Data Processing Agreement and respond with JSON only:
${baseSchema}

STANDARDS BENCHMARK: Evaluate against GDPR Article 28 (processor obligations), Article 32 (security measures), Article 33 (breach notification 72-hour rule), Article 46 (international transfer mechanisms), and CCPA/CPRA service provider requirements. Flag every gap against these specific articles.

GDPR Article 28 required elements — flag as CRITICAL if missing:
- Processing only on documented instructions from the controller
- Confidentiality obligations on authorized personnel
- Technical and organizational security measures (Article 32)
- Sub-processor approval requirement (prior written consent of controller)
- Data subject rights assistance obligations (Articles 15–22)
- Controller audit assistance obligations
- Data deletion or return at end of service

International transfers — flag as CRITICAL if applicable but absent:
- Standard Contractual Clauses (SCCs — 2021 EU version) for transfers outside EEA
- Adequacy decision reliance — verify country is still on adequacy list
- Binding Corporate Rules documentation

Security measures (Article 32) — flag gaps against NIST CSF and ISO 27001 Annex A:
- Pseudonymisation and encryption of personal data
- Ongoing confidentiality, integrity, availability assurances
- Ability to restore data after incident
- Regular testing and evaluation of security measures

CCPA/CPRA: verify prohibition on selling/sharing personal information and service provider restrictions.

Flag as critical: breach notification > 72 hours, no SCC for international transfers, no sub-processor controls.
Flag as high: vague security measures lacking specifics, no deletion timeline, no audit rights.

Respond with only the JSON object, no markdown.`;
  }

  if (documentType === 'SOC2Report') {
    return `You are a security compliance analyst specializing in SOC 2 attestation reports. Analyze this SOC 2 report and respond with JSON only:
${baseSchema}

STANDARDS BENCHMARK: Evaluate against AICPA Trust Services Criteria (TSC) 2017. For each Trust Services Category present, assess completeness and flag gaps or qualifications.

Assess coverage across applicable Trust Services Categories:
- CC (Common Criteria / Security) — always required: logical access, change management, risk assessment, incident response, monitoring
- A (Availability) — if in scope: uptime commitments, DR/BCP, capacity planning
- C (Confidentiality) — if in scope: data classification, encryption, disposal
- PI (Processing Integrity) — if in scope: completeness, accuracy, timeliness of processing
- P (Privacy) — if in scope: notice, consent, collection limitation, GDPR/CCPA alignment

Key risk signals to surface:
- Type I vs. Type II: Type I only tests design, not operating effectiveness — flag as medium risk if this is the firm's sole assurance
- Report period: flag if older than 12 months as high risk (assurance may be stale)
- Qualified opinion or exceptions: any auditor-noted exceptions are high/critical risks — describe them explicitly
- Subservice organizations carved out using the carve-out method: flag if critical subservice organizations (cloud hosting, payment processors) are excluded
- Complementary User Entity Controls (CUECs): list any controls the customer must implement — gaps here are the firm's responsibility
- Complementary Subservice Organization Controls (CSOCs)

keyProvisions should include: report type, period covered, auditor firm, opinion type, Trust Services Categories in scope, and all noted exceptions or qualifications.

Flag as critical: qualified opinion, exceptions in CC6 (logical access) or CC7 (system operations), missing SOC 2 Type II where Type I was expected.
Flag as high: report older than 12 months, critical subservice organizations carved out, significant CUECs not addressed by the firm.

Respond with only the JSON object, no markdown.`;
  }

  if (documentType === 'ISO27001Cert') {
    return `You are an information security compliance analyst specializing in ISO 27001 certification. Analyze this ISO 27001 certificate or audit report and respond with JSON only:
${baseSchema}

STANDARDS BENCHMARK: Evaluate against ISO/IEC 27001:2022 (the current standard; 27001:2013 is superseded). Flag any gaps, exclusions, or areas of concern.

Key elements to assess:
- Standard version: ISO 27001:2022 is current; 2013-certified organizations must transition by October 2025 — flag 2013 certs approaching deadline as medium risk
- Certification body: verify it is an IAF-accredited Certification Body (CB); unaccredited certs carry no assurance value — flag as critical
- Certificate validity period: typically 3 years with annual surveillance audits; flag expired or near-expiry certificates
- Scope: identify what is and is not in scope — narrow scopes (e.g., only one system or office) may not cover services provided to the firm — flag scope gaps as high risk
- Statement of Applicability (SoA): if available, note any Annex A controls excluded and whether justifications are reasonable

ISO 27001:2022 Annex A control domains to check coverage:
- A.5 Organizational controls (policies, roles, threat intelligence, supply chain security)
- A.6 People controls (screening, training, disciplinary process)
- A.7 Physical controls (perimeter, entry controls, equipment security)
- A.8 Technological controls (access management, malware protection, logging, encryption, SDLC security, vulnerability management, cloud security)

Notable 2022 additions — flag if not addressed:
- Threat intelligence (A.5.7)
- Cloud services security (A.5.23)
- ICT supply chain security (A.5.19–A.5.22)
- Data leakage prevention (A.8.12)
- Web filtering (A.8.23)
- Secure coding (A.8.28)

Flag as critical: unaccredited certification body, expired certificate, scope excludes services provided to the firm.
Flag as high: 2013 certification without documented transition plan, narrow scope gaps, significant Annex A exclusions without justification.

Respond with only the JSON object, no markdown.`;
  }

  if (documentType === 'PenTestReport') {
    return `You are a security analyst specializing in penetration test report review. Analyze this penetration test report and respond with JSON only:
${baseSchema}

STANDARDS BENCHMARK: Evaluate findings against OWASP Top 10 (web/API), NIST SP 800-115 (technical guide to penetration testing), CVSS v3.1 scoring, and PTES (Penetration Testing Execution Standard). Flag any methodology gaps and unaddressed high/critical findings.

Assess the following:
SCOPE AND METHODOLOGY:
- Scope coverage: what systems, applications, or networks were tested — flag if scope appears narrow for the vendor's services
- Test type: black-box, gray-box, or white-box — note methodology
- Date of testing: flag reports older than 12 months as high risk; older than 24 months as critical
- Testing firm credentials: note if tester is OSCP/CREST/GPEN certified; uncredentialed testers reduce assurance value

FINDINGS ASSESSMENT (map to CVSS and OWASP):
- Critical/High findings (CVSS ≥ 7.0): list each finding, its CVSS score, and remediation status
- OWASP Top 10 coverage: flag if injection (A03), broken access control (A01), cryptographic failures (A02), or security misconfiguration (A05) are present as unresolved
- Findings marked "accepted risk" without documented business justification: flag as high risk
- Findings without remediation status or timeline: flag as high risk

REMEDIATION TRACKING:
- Were previously identified findings retested and confirmed remediated?
- Outstanding critical/high findings with no remediation date: critical risk
- Remediation timeline > 90 days for critical findings: high risk

Flag as critical: unresolved critical/high CVSS findings, no remediation timeline for critical issues, report older than 24 months.
Flag as high: report older than 12 months, findings accepted without justification, no retest evidence for previously reported criticals.

Respond with only the JSON object, no markdown.`;
  }

  if (documentType === 'TrustCenterReport') {
    return `You are a vendor security compliance analyst. Analyze this trust center report or security overview document and respond with JSON only:
${baseSchema}

STANDARDS BENCHMARK: Evaluate claims against recognized security frameworks: SOC 2 Type II (AICPA TSC), ISO 27001:2022, NIST CSF v2.0, GDPR/CCPA compliance assertions, and CSA STAR (for cloud vendors). Cross-reference vendor claims against what third-party audit evidence is cited.

Key areas to assess:
CERTIFICATIONS AND ATTESTATIONS:
- List all claimed certifications; flag any without a named third-party auditor or certification body as unverified
- Note certificate expiry dates if mentioned; flag missing dates as inability to verify currency
- Distinguish marketing claims ("we take security seriously") from audited attestations (SOC 2 Type II report available)

SECURITY CONTROLS (benchmark against NIST CSF and ISO 27001 Annex A):
- Identify (asset management, risk assessment, supply chain risk)
- Protect (access control, data security, training, maintenance, protective technology)
- Detect (monitoring, detection processes)
- Respond (incident response, communications plan)
- Recover (recovery planning, improvements)

DATA HANDLING AND PRIVACY:
- Data residency and transfer restrictions — flag if EU data can leave EEA without stated SCCs
- Retention and deletion policies — flag if undefined
- Sub-processor list availability — flag absence as medium risk
- Breach notification timeline commitment — flag > 72 hours as high risk

GAPS RELATIVE TO INDUSTRY STANDARDS:
- Missing SOC 2 Type II or ISO 27001 for a SaaS vendor handling firm or client data: high risk
- No published vulnerability disclosure or bug bounty program: medium risk
- No stated encryption standards (in transit and at rest): high risk
- No mention of employee background checks or security training: medium risk

Flag as critical: no third-party audit evidence for a vendor handling sensitive data, data residency in non-adequate jurisdiction without SCCs.
Flag as high: self-attested-only security claims, missing encryption commitments, no incident response SLA.

Respond with only the JSON object, no markdown.`;
  }

  if (documentType === 'InternalPolicy') {
    return `You are a compliance analyst for a law firm. Analyze this internal policy document and respond with JSON only:
${baseSchema}

STANDARDS BENCHMARK: Evaluate this policy against the following frameworks as applicable. Explicitly identify gaps for each relevant standard.
- NIST CSF v2.0 (Govern, Identify, Protect, Detect, Respond, Recover)
- NIST SP 800-53 Rev 5 (for technical/security policies)
- ISO 27001:2022 Annex A (for information security policies)
- ABA Model Rules of Professional Conduct (Rules 1.1, 1.6, 5.1, 5.3 for law firm context)
- Applicable state bar rules on confidentiality and competence
- GDPR Article 5 principles (lawfulness, purpose limitation, data minimization, accuracy, storage limitation, integrity/confidentiality) for policies touching personal data
- CCPA/CPRA for policies involving California residents' data
- HIPAA (if policy addresses PHI or healthcare data)

Assess required policy elements:
- Named policy owner or responsible role
- Effective date and scheduled review cycle (annual is standard best practice)
- Defined scope (who and what systems are covered)
- Clear obligations with measurable requirements (not just aspirational language)
- Enforcement mechanisms and consequences for non-compliance
- Exception handling process
- Escalation path for policy violations

For riskFlags, benchmark against the above standards and flag:
- Policies lacking a review date or last reviewed > 12 months ago: medium risk
- Vague language ("appropriate measures", "reasonable security") without defined specifics: medium risk
- Absence of enforcement or accountability mechanisms: high risk
- Requirements that conflict with ABA Model Rules or state bar obligations: critical risk
- Missing required elements for GDPR/CCPA/HIPAA compliance if the policy is relevant to those regimes: high/critical

Respond with only the JSON object, no markdown.`;
  }

  if (documentType === 'NDA') {
    return `You are a legal contract analyst for a law firm. Analyze this Non-Disclosure Agreement and respond with JSON only:
${baseSchema}

STANDARDS BENCHMARK: Evaluate against typical NDA best practices and ABA guidance on confidentiality obligations. Flag deviations.

Key elements to assess:
- Definition of "Confidential Information": overly broad or vague definitions are medium risk; carve-outs should include publicly available information, independently developed information, and information received from third parties
- Term and survival: confidentiality obligations should survive termination for a defined period (2–5 years standard; perpetual is unusual for commercial NDAs but common for trade secrets)
- Mutual vs. one-way: one-way NDA favoring the other party with no reciprocal protection is medium risk
- Permitted disclosures: verify required disclosures (court orders, regulators) are addressed with notice obligation
- Standard of care: "reasonable care" is standard; a higher standard may be operationally burdensome
- Return or destruction of materials upon termination
- Governing law and jurisdiction
- Injunctive relief provision (standard in NDAs)
- Exclusion of consequential damages

Law firm specific risks:
- NDA obligations that may conflict with attorney-client privilege or mandatory disclosure obligations
- Overly broad definitions that could restrict the firm from working with other clients in the same space
- Provisions purporting to restrict regulatory cooperation or bar admission disclosures

Respond with only the JSON object, no markdown.`;
  }

  // Generic / other document types
  return `You are a legal document analyst for a law firm specializing in vendor risk management. Analyze this document and respond with JSON only:
${baseSchema}

STANDARDS BENCHMARK: Evaluate this document against applicable best practices and flag gaps. Consider:
- NIST CSF v2.0 for security-related provisions
- GDPR Article 28/32 and CCPA for data handling provisions
- ISO 27001:2022 Annex A for information security controls
- ABA Model Rules for any provisions affecting attorney-client obligations
- Common contract law standards for vendor agreements

Focus on:
- Indemnification and liability caps (flag uncapped exposure)
- Data breach notification requirements and timelines (flag > 72 hours)
- Data retention and deletion obligations (flag if undefined)
- Governing law and dispute resolution
- Termination and exit rights
- Intellectual property ownership
- Audit rights
- Subprocessor and subcontractor restrictions
- Unusual or one-sided terms

For riskContributors, identify specific document language that increases risk relative to the above standards and explain the gap.

Respond with only the JSON object, no markdown.`;
}

async function callClaude(config: AiConfig, text: string, documentType: string): Promise<AiReviewResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      system: buildSystemPrompt(documentType),
      messages: [{ role: 'user', content: `Review the following document:\n\n${text.slice(0, 80000)}` }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text ?? '';
  return parseAiJson(content);
}

async function callOpenAI(config: AiConfig, text: string, documentType: string): Promise<AiReviewResult> {
  const baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: buildSystemPrompt(documentType) },
        { role: 'user', content: `Review the following document:\n\n${text.slice(0, 80000)}` },
      ],
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  return parseAiJson(content);
}

export async function reviewDocument(
  documentId: string,
  tenantId: string,
  fileText: string
): Promise<AiReviewResult> {
  const config = await getTenantAiConfig(tenantId);
  if (!config) throw new Error('AI review not configured for this tenant');

  const document = await prisma.vendorDocument.findUnique({ where: { id: documentId } });
  if (!document) throw new Error('Document not found');

  await prisma.vendorDocument.update({
    where: { id: documentId },
    data: { aiReviewStatus: 'in_progress' },
  });

  let result: AiReviewResult;
  try {
    if (config.provider === 'claude') {
      result = await callClaude(config, fileText, document.documentType);
    } else {
      result = await callOpenAI(config, fileText, document.documentType);
    }

    if (!result.summary || !result.overallRisk) {
      throw new Error('AI response missing required fields');
    }

    // Determine expiry from AI result if not already set
    const newExpiresAt = !document.expiresAt && result.expirationDate
      ? new Date(result.expirationDate)
      : undefined;

    const newRenewalDate = !document.renewalDate && result.renewalDate
      ? new Date(result.renewalDate)
      : undefined;

    const isFlagged = result.riskFlags?.some(
      (f) => f.severity === 'critical' || f.severity === 'high'
    );

    await prisma.vendorDocument.update({
      where: { id: documentId },
      data: {
        aiReviewStatus: isFlagged ? 'flagged' : 'approved',
        aiReviewResult: JSON.stringify(result),
        aiReviewedAt: new Date(),
        aiProvider: config.provider,
        ...(newExpiresAt ? { expiresAt: newExpiresAt } : {}),
        ...(newRenewalDate ? { renewalDate: newRenewalDate } : {}),
      },
    });

    // Recalculate vendor risk score with new AI findings
    if (document.vendorId) {
      await recalculateVendorRisk(document.vendorId, tenantId);
    }

    return result;
  } catch (err) {
    await prisma.vendorDocument.update({
      where: { id: documentId },
      data: { aiReviewStatus: 'failed' },
    });
    throw err;
  }
}

async function recalculateVendorRisk(vendorId: string, tenantId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      documents: { select: { documentType: true, reviewStatus: true, expiresAt: true, aiReviewResult: true } },
      questionnaireAssignments: { select: { status: true, score: true, responses: true } },
    },
  });
  if (!vendor) return;

  const { score, level, factors } = calculateVendorRiskScore({
    vendor: {
      criticality: vendor.criticality,
      processesPII: vendor.processesPII,
      processesPHI: vendor.processesPHI,
      processesFinancial: vendor.processesFinancial,
      contractEndDate: vendor.contractEndDate,
      isExempt: vendor.isExempt,
    },
    documents: vendor.documents,
    assignments: vendor.questionnaireAssignments,
  });

  // Collect risk contributors from AI reviews
  const riskContributors: Array<{ source: string; item: string; impact: string; mitigation: string; severity: string }> = [];
  for (const doc of vendor.documents) {
    if (!doc.aiReviewResult) continue;
    try {
      const reviewResult = JSON.parse(doc.aiReviewResult);
      if (reviewResult.riskContributors) {
        for (const rc of reviewResult.riskContributors) {
          riskContributors.push({
            source: `${doc.documentType} document`,
            item: rc.item,
            impact: rc.impact,
            mitigation: rc.mitigation,
            severity: 'medium',
          });
        }
      }
      if (reviewResult.riskFlags) {
        for (const rf of reviewResult.riskFlags) {
          if (rf.severity === 'critical' || rf.severity === 'high') {
            riskContributors.push({
              source: `${doc.documentType} document`,
              item: rf.description,
              impact: `${rf.severity.toUpperCase()} risk flag identified during AI review`,
              mitigation: rf.mitigation ?? 'Review with legal counsel',
              severity: rf.severity,
            });
          }
        }
      }
    } catch {}
  }

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { riskScore: score, riskLevel: level },
  });

  await prisma.vendorRiskAssessment.create({
    data: {
      vendorId,
      tenantId,
      riskScore: score,
      riskLevel: level,
      riskFactors: JSON.stringify(factors),
      riskContributors: JSON.stringify(riskContributors),
      assessedBy: 'ai-review',
      status: 'finalized',
    },
  });
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return data.text;
    } catch {
      throw new Error('Could not extract text from PDF');
    }
  }

  if (mimeType === 'text/plain' || mimeType.startsWith('text/')) {
    return buffer.toString('utf-8');
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // .docx is a ZIP archive; extract text from word/document.xml
    try {
      const unzipper = await import('unzipper');
      const directory = await unzipper.Open.buffer(buffer);
      const docFile = directory.files.find((f) => f.path === 'word/document.xml');
      if (!docFile) throw new Error('word/document.xml not found in docx');
      const xmlBuffer = await docFile.buffer();
      const xml = xmlBuffer.toString('utf-8');

      // Each <w:p> is a paragraph; each <w:t> inside it is a text run
      const paragraphs = xml.split(/<w:p[ >]/).map((para) => {
        const runs = para.match(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g) ?? [];
        return runs.map((r) => r.replace(/<[^>]+>/g, '')).join('');
      }).filter((p) => p.trim());

      const text = paragraphs.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      if (!text) throw new Error('No text content found in Word document');
      return text;
    } catch (err) {
      throw new Error(`Could not extract text from Word document: ${(err as Error).message}`);
    }
  }

  if (mimeType === 'application/msword') {
    throw new Error('Legacy .doc format is not supported for AI review. Please convert to .docx or PDF and re-upload.');
  }

  throw new Error(`Unsupported file type for AI review: ${mimeType}`);
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}
