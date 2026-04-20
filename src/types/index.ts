// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'company_admin' | 'responder' | 'viewer';
export type AuthType = 'local' | 'saml';
export type MfaType = 'totp' | 'duo' | 'email';

export interface DbUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  authType: AuthType;
  mustChangePw: boolean;
  mfaEnabled: boolean;
  mfaType: MfaType | null;
  lastLogin: Date | null;
  createdAt: Date;
}

export interface DbTenant {
  id: string;
  name: string;
  industry: string | null;
  primaryContact: string | null;
  logoUrl: string | null;
  authMode: string;
  forceSso: boolean;
  samlDomain: string | null;
  enableVendors: boolean;
  enableQuestionnaires: boolean;
  enableDocuments: boolean;
  enableReports: boolean;
  enableLifecycle: boolean;
  enableAiReview: boolean;
  createdAt: Date;
}

export interface SessionUser {
  userId: string;
  tenantId: string;
  user: DbUser;
  tenant: DbTenant;
  mfaVerified: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  mfaEnabled: boolean;
  mustChangePw: boolean;
}

export interface AuthTenant {
  id: string;
  name: string;
  industry: string | null;
  logoUrl: string | null;
  enableVendors: boolean;
  enableQuestionnaires: boolean;
  enableDocuments: boolean;
  enableReports: boolean;
  enableLifecycle: boolean;
  enableAiReview: boolean;
}

// ─── Vendor ───────────────────────────────────────────────────────────────────

export type VendorCriticality = 'critical' | 'high' | 'medium' | 'low';
export type VendorStatus = 'active' | 'inactive' | 'pending' | 'offboarding' | 'offboarded';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export type VendorCategory =
  | 'SaaS'
  | 'IaaS'
  | 'PaaS'
  | 'Professional Services'
  | 'Hardware'
  | 'Managed Services'
  | 'Financial Services'
  | 'Legal'
  | 'HR'
  | 'Marketing'
  | 'Other';

export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  legalName: string | null;
  website: string | null;
  description: string | null;
  category: VendorCategory | null;
  criticality: VendorCriticality;
  status: VendorStatus;
  isExempt: boolean;
  exemptReason: string | null;
  trustCenterUrl: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  riskOverride: boolean;
  lastReviewDate: Date | null;
  nextReviewDate: Date | null;
  processesPII: boolean;
  processesPHI: boolean;
  processesFinancial: boolean;
  dataRetentionDays: number | null;
  dataLocation: string | null;
  contractStartDate: Date | null;
  contractEndDate: Date | null;
  contractValue: number | null;
  tags: string[];
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorApplication {
  id: string;
  vendorId: string;
  tenantId: string;
  name: string;
  description: string | null;
  appType: string | null;
  url: string | null;
  dataClassification: string;
  containsPII: boolean;
  containsPHI: boolean;
  containsFinancial: boolean;
  userCount: number | null;
  businessCriticality: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentType =
  | 'BAA'
  | 'NDA'
  | 'MSA'
  | 'SLA'
  | 'DPA'
  | 'SOC2Report'
  | 'ISO27001Cert'
  | 'PenTestReport'
  | 'OCG'
  | 'Contract'
  | 'Questionnaire'
  | 'TrustCenterReport'
  | 'InternalPolicy'
  | 'Other';

export type AiReviewStatus = 'not_reviewed' | 'pending' | 'in_progress' | 'approved' | 'flagged' | 'failed';
export type DocumentReviewStatus = 'pending' | 'approved' | 'needs_revision' | 'rejected';

export interface AiReviewResult {
  summary: string;
  documentType: string;
  effectiveDate?: string;
  expirationDate?: string;
  renewalDate?: string;
  parties?: string[];
  keyProvisions: string[];
  riskFlags: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    mitigation?: string;
  }>;
  missingClauses?: string[];
  recommendations: string[];
  overallRisk: RiskLevel;
  riskContributors?: Array<{ item: string; impact: string; mitigation: string }>;
}

export interface VendorDocument {
  id: string;
  vendorId: string | null;
  tenantId: string;
  documentType: DocumentType;
  name: string;
  description: string | null;
  fileKey: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  documentDate: Date | null;
  expiresAt: Date | null;
  uploadedAt: Date;
  uploadedBy: string | null;
  aiReviewStatus: AiReviewStatus;
  aiReviewResult: AiReviewResult | null;
  aiReviewedAt: Date | null;
  aiProvider: string | null;
  reviewStatus: DocumentReviewStatus;
  isApproved: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;
  approvalNotes: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Questionnaires ───────────────────────────────────────────────────────────

export type QuestionType = 'yes-no-na' | 'yes-no-partial-na' | 'text' | 'select' | 'multiselect' | 'scale' | 'date';
export type QuestionnaireType = 'sig-core' | 'sig-lite' | 'dpa' | 'security-assessment' | 'custom';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  helpText?: string;
  options?: QuestionOption[];
  subQuestions?: Question[];
  tags?: string[];
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Questionnaire {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  type: QuestionnaireType;
  version: string;
  sections: QuestionnaireSection[];
  isBuiltIn: boolean;
  isActive: boolean;
  isPublic: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AssignmentStatus = 'pending' | 'in_progress' | 'submitted' | 'reviewed' | 'approved' | 'expired' | 'cancelled';

export interface QuestionResponse {
  response: string;
  comments?: string;
}

export interface QuestionnaireAssignment {
  id: string;
  vendorId: string;
  tenantId: string;
  questionnaireId: string;
  assignedBy: string | null;
  assignedAt: Date;
  dueDate: Date | null;
  vendorContactName: string | null;
  vendorContactEmail: string | null;
  accessToken: string | null;
  accessTokenExpiry: Date | null;
  status: AssignmentStatus;
  reminderCount: number;
  lastReminderSent: Date | null;
  cycle: string;
  yearCycle: number | null;
  responses: Record<string, QuestionResponse> | null;
  completedAt: Date | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  score: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Risk ─────────────────────────────────────────────────────────────────────

export interface RiskFactor {
  name: string;
  score: number;     // 0-100
  weight: number;    // 0-1 (total of all weights = 1)
  notes?: string;
}

export interface RiskFactors {
  dataAccess: number;
  criticality: number;
  contractual: number;
  compliance: number;
  securityPosture: number;
  questionnaireScore: number;
}

export interface VendorRiskAssessment {
  id: string;
  vendorId: string;
  tenantId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactors;
  assessedBy: string | null;
  assessedAt: Date;
  status: string;
  notes: string | null;
  nextAssessmentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export type LifecycleStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'onboarding'
  | 'completed';

export type LifecycleStep =
  | 'submission'
  | 'security_review'
  | 'legal_review'
  | 'exec_approval'
  | 'document_collection'
  | 'questionnaire'
  | 'complete';

export interface LifecycleApproval {
  role: string;
  userId?: string;
  userName?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  actionedAt?: string;
}

export interface VendorLifecycleRequest {
  id: string;
  tenantId: string;
  vendorName: string;
  vendorLegalName: string | null;
  vendorWebsite: string | null;
  vendorDescription: string | null;
  vendorCategory: string | null;
  businessJustification: string | null;
  estimatedDataTypes: string[];
  estimatedCriticality: VendorCriticality;
  applications: string[];
  requestedBy: string | null;
  requestedAt: Date;
  status: LifecycleStatus;
  currentStep: LifecycleStep;
  approvals: LifecycleApproval[];
  rejectionReason: string | null;
  adminNotes: string | null;
  vendorId: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Tenant Settings ──────────────────────────────────────────────────────────

export interface RiskThresholds {
  critical: number;
  high: number;
  medium: number;
}

export interface TenantBranding {
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
}

export interface TenantSettings {
  tenantId: string;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpFrom: string | null;
  aiEnabled: boolean;
  aiProvider: string | null;
  aiApiKey: string | null;
  aiModel: string | null;
  aiBaseUrl: string | null;
  riskThresholds: RiskThresholds;
  annualReviewMonth: number;
  documentExpiryLeadDays: number;
  notifyDocumentExpiry: boolean;
  notifyQuestionnairesDue: boolean;
  notifyNewVendorRequests: boolean;
  requireSecurityReview: boolean;
  requireLegalReview: boolean;
  requireExecApproval: boolean;
  defaultQuestionnaireIds: string[];
  allowGuestQuestionnaire: boolean;
  guestLinkExpireDays: number;
  branding: TenantBranding | null;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Permissions ──────────────────────────────────────────────────────────────

export interface Permissions {
  viewDashboard: boolean;
  manageVendors: boolean;
  viewVendors: boolean;
  uploadDocuments: boolean;
  reviewDocuments: boolean;
  manageQuestionnaires: boolean;
  manageLifecycle: boolean;
  approveLifecycle: boolean;
  viewReports: boolean;
  exportReports: boolean;
  manageUsers: boolean;
  manageSettings: boolean;
  manageAdmin: boolean;
}
