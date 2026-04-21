import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RiskLevel, VendorCriticality } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function riskLevelColor(level: RiskLevel | string | null | undefined): string {
  switch (level) {
    case 'critical': return 'text-rose-400';
    case 'high':     return 'text-orange-400';
    case 'medium':   return 'text-amber-400';
    case 'low':      return 'text-emerald-400';
    default:         return 'text-slate-400';
  }
}

export function riskLevelBg(level: RiskLevel | string | null | undefined): string {
  switch (level) {
    case 'critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'high':     return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'medium':   return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'low':      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default:         return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

export function criticalityColor(level: VendorCriticality | string | null | undefined): string {
  switch (level) {
    case 'critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'high':     return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'medium':   return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'low':      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default:         return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'approved':
    case 'completed':  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'pending':
    case 'submitted':  return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'in_progress':
    case 'under_review': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'inactive':
    case 'offboarded': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    case 'offboarding':
    case 'needs_revision': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'rejected':
    case 'expired':
    case 'failed':     return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'flagged':    return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    default:           return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

export const DOC_TYPE_LABELS: Record<string, string> = {
  BAA: 'BAA',
  NDA: 'NDA',
  MSA: 'MSA',
  SLA: 'SLA',
  DPA: 'DPA',
  SOC2Report: 'SOC 2 Report',
  ISO27001Cert: 'ISO 27001 Cert',
  PenTestReport: 'Pen Test Report',
  OCG: 'Outside Counsel Guidelines',
  Contract: 'Contract',
  TrustCenterReport: 'Trust Center Report',
  InternalPolicy: 'Internal Policy',
  Questionnaire: 'Questionnaire',
  IncidentResponsePlan: 'Incident Response Plan',
  BCPDRPlan: 'BCP / DR Plan',
  SubprocessorList: 'Sub-processor List',
  DataFlowDiagram: 'Data Flow Diagram',
  CyberInsuranceCert: 'Cyber Insurance Certificate',
  VulnerabilityDisclosurePolicy: 'Vulnerability Disclosure Policy',
  DataResidencyStatement: 'Data Residency Statement',
  Other: 'Other',
};

export function docRequestStatusColor(status: string): string {
  switch (status) {
    case 'received': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'pending':  return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'overdue':  return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'waived':   return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    default:         return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function parseJsonSafe<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function getDaysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(date: Date | string | null | undefined, leadDays = 30): boolean {
  const days = getDaysUntil(date);
  if (days == null) return false;
  return days >= 0 && days <= leadDays;
}

export function isExpired(date: Date | string | null | undefined): boolean {
  const days = getDaysUntil(date);
  if (days == null) return false;
  return days < 0;
}
