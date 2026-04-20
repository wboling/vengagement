import type { RiskLevel, RiskFactors } from '@/types';

interface RiskInput {
  vendor: {
    criticality: string;
    processesPII: boolean;
    processesPHI: boolean;
    processesFinancial: boolean;
    contractEndDate: Date | string | null;
    isExempt: boolean;
  };
  documents: { documentType: string; reviewStatus: string; expiresAt: Date | string | null; aiReviewResult: string | null }[];
  assignments: { status: string; score: number | null; responses: string | null }[];
}

// Returns 0-100 (higher = more risk)
export function calculateVendorRiskScore(input: RiskInput): {
  score: number;
  level: RiskLevel;
  factors: RiskFactors;
} {
  const { vendor, documents, assignments } = input;

  // ── Factor 1: Data Access Risk (weight: 0.25) ────────────────────────────
  let dataAccessScore = 20; // baseline
  if (vendor.processesPII) dataAccessScore += 25;
  if (vendor.processesPHI) dataAccessScore += 35;
  if (vendor.processesFinancial) dataAccessScore += 20;
  dataAccessScore = Math.min(dataAccessScore, 100);

  // ── Factor 2: Criticality (weight: 0.20) ─────────────────────────────────
  const criticalityScores: Record<string, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  };
  const criticalityScore = criticalityScores[vendor.criticality] ?? 50;

  // ── Factor 3: Contractual Risk (weight: 0.15) ─────────────────────────────
  let contractualScore = 50;
  if (vendor.contractEndDate) {
    const daysUntilExpiry = Math.ceil(
      (new Date(vendor.contractEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry < 0) contractualScore = 90;
    else if (daysUntilExpiry < 30) contractualScore = 75;
    else if (daysUntilExpiry < 90) contractualScore = 60;
    else contractualScore = 30;
  }

  // ── Factor 4: Compliance / Document Status (weight: 0.20) ─────────────────
  const requiredDocs = ['BAA', 'NDA', 'MSA', 'DPA'];
  let complianceScore = 100;
  let docPenalty = 0;

  // Check which required docs exist and are approved
  for (const docType of requiredDocs) {
    const relevantDocs = documents.filter((d) => d.documentType === docType);
    if (relevantDocs.length === 0) {
      // PHI vendors must have BAA
      if (docType === 'BAA' && vendor.processesPHI) docPenalty += 30;
      else docPenalty += 10;
    } else {
      const approved = relevantDocs.some((d) => d.reviewStatus === 'approved');
      if (!approved) docPenalty += 8;

      // Check for expiring/expired docs
      const expired = relevantDocs.some(
        (d) => d.expiresAt && new Date(d.expiresAt) < new Date()
      );
      if (expired) docPenalty += 15;
    }
  }

  // Check for flagged AI reviews
  const flaggedCount = documents.filter((d) => {
    if (!d.aiReviewResult) return false;
    const result = typeof d.aiReviewResult === 'string'
      ? JSON.parse(d.aiReviewResult)
      : d.aiReviewResult;
    return result?.riskFlags?.some(
      (f: { severity: string }) => f.severity === 'critical' || f.severity === 'high'
    );
  }).length;
  docPenalty += flaggedCount * 12;

  complianceScore = Math.max(0, 100 - Math.min(docPenalty, 100));

  // ── Factor 5: Security Posture (weight: 0.10) ─────────────────────────────
  // Based on presence of security reports (SOC2, ISO, PenTest)
  const securityDocs = documents.filter(
    (d) =>
      d.documentType === 'SOC2Report' ||
      d.documentType === 'ISO27001Cert' ||
      d.documentType === 'PenTestReport'
  );
  let securityScore: number;
  if (securityDocs.length === 0) {
    securityScore = 80;
  } else if (securityDocs.length === 1) {
    securityScore = 50;
  } else {
    securityScore = 20;
  }
  // Penalize if all security docs are expired
  const allExpired =
    securityDocs.length > 0 &&
    securityDocs.every((d) => d.expiresAt && new Date(d.expiresAt) < new Date());
  if (allExpired) securityScore = Math.min(securityScore + 30, 100);

  // ── Factor 6: Questionnaire Score (weight: 0.10) ──────────────────────────
  let questionnaireScore = 70; // default: no questionnaire completed
  const completedAssignments = assignments.filter(
    (a) => a.status === 'approved' || a.status === 'reviewed'
  );
  if (completedAssignments.length > 0) {
    const latest = completedAssignments[completedAssignments.length - 1];
    if (latest.score != null) {
      // score from questionnaire: lower compliance score = higher risk
      questionnaireScore = 100 - latest.score;
    } else {
      questionnaireScore = 30; // completed but no formal score — lower risk
    }
  } else {
    const pending = assignments.filter((a) => a.status === 'pending' || a.status === 'in_progress');
    if (pending.length > 0) questionnaireScore = 50;
  }

  // ── Weighted composite ────────────────────────────────────────────────────
  const weights = {
    dataAccess: 0.25,
    criticality: 0.20,
    contractual: 0.15,
    compliance: 0.20,
    securityPosture: 0.10,
    questionnaireScore: 0.10,
  };

  const factors: RiskFactors = {
    dataAccess: Math.round(dataAccessScore),
    criticality: Math.round(criticalityScore),
    contractual: Math.round(contractualScore),
    compliance: Math.round(100 - complianceScore), // invert: high compliance = low risk
    securityPosture: Math.round(securityScore),
    questionnaireScore: Math.round(questionnaireScore),
  };

  const score = Math.round(
    dataAccessScore * weights.dataAccess +
    criticalityScore * weights.criticality +
    contractualScore * weights.contractual +
    (100 - complianceScore) * weights.compliance +
    securityScore * weights.securityPosture +
    questionnaireScore * weights.questionnaireScore
  );

  let level: RiskLevel;
  if (score >= 75) level = 'critical';
  else if (score >= 50) level = 'high';
  else if (score >= 25) level = 'medium';
  else level = 'low';

  // Exempt vendors always get low risk
  if (vendor.isExempt) {
    return { score: 10, level: 'low', factors };
  }

  return { score: Math.min(score, 100), level, factors };
}
