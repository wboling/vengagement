'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Download, CheckCircle, AlertCircle, Clock, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate, DOC_TYPE_LABELS } from '@/lib/utils';

interface Document {
  id: string;
  documentType: string;
  name: string;
  description: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  documentDate: string | null;
  expiresAt: string | null;
  renewalDate: string | null;
  uploadedAt: string;
  aiReviewStatus: string;
  reviewStatus: string;
  isApproved: boolean;
  vendor: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
}


function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const REVIEW_STATUS_CLASSES: Record<string, string> = {
  approved:       'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  needs_revision: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  rejected:       'text-rose-400 bg-rose-400/10 border-rose-400/20',
  pending:        'text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] border-[var(--color-border)]',
};

const AI_STATUS_CLASSES: Record<string, string> = {
  approved:    'text-emerald-400',
  flagged:     'text-rose-400',
  in_progress: 'text-[var(--color-accent)]',
  pending:     'text-[var(--color-text-muted)]',
  not_reviewed:'text-[var(--color-text-muted)]',
  failed:      'text-rose-400',
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', reviewStatus: '' });

  useEffect(() => { load(); }, [filters]);

  async function load() {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.reviewStatus) params.set('reviewStatus', filters.reviewStatus);
    const res = await fetch(`/api/documents?${params}`);
    const data = await res.json();
    setDocuments(data.documents ?? []);
    setLoading(false);
  }

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const d = new Date(expiresAt);
    return d > new Date() && d < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Documents</h2>
        <p className="text-sm text-[var(--color-text-muted)]">{documents.length} document{documents.length !== 1 ? 's' : ''} across all vendors</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap">Document Type</label>
            <div className="relative">
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="h-8 text-xs w-40 pr-7 appearance-none cursor-pointer"
              >
                <option value="">All Types</option>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap">Review Status</label>
            <div className="relative">
              <select
                value={filters.reviewStatus}
                onChange={(e) => setFilters({ ...filters, reviewStatus: e.target.value })}
                className="h-8 text-xs w-40 pr-7 appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                {['pending', 'approved', 'needs_revision', 'rejected'].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            </div>
          </div>
          {(filters.type || filters.reviewStatus) && (
            <button
              onClick={() => setFilters({ type: '', reviewStatus: '' })}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : documents.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <FileText size={28} className="mx-auto text-[var(--color-text-muted)] mb-3 opacity-40" />
            <p className="text-sm text-[var(--color-text-muted)]">No documents found.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="py-3 px-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center">
                    <FileText size={14} className="text-[var(--color-text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{doc.name}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)] font-mono">
                        {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                      </span>
                      {doc.vendor && (
                        <Link href={`/vendors/${doc.vendor.id}`} className="text-xs text-[var(--color-accent)] hover:underline">
                          {doc.vendor.name}
                        </Link>
                      )}
                      {doc.client && (
                        <Link href={`/clients/${doc.client.id}`} className="text-xs text-[var(--color-teal)] hover:underline">
                          {doc.client.name}
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${REVIEW_STATUS_CLASSES[doc.reviewStatus] ?? REVIEW_STATUS_CLASSES.pending}`}>
                        {doc.reviewStatus.replace(/_/g, ' ')}
                      </span>

                      {doc.aiReviewStatus !== 'not_reviewed' && (
                        <span className={`text-xs flex items-center gap-1 ${AI_STATUS_CLASSES[doc.aiReviewStatus] ?? ''}`}>
                          {doc.aiReviewStatus === 'approved' && <CheckCircle size={10} />}
                          {doc.aiReviewStatus === 'flagged' && <AlertCircle size={10} />}
                          {(doc.aiReviewStatus === 'in_progress' || doc.aiReviewStatus === 'pending') && <Clock size={10} />}
                          AI: {doc.aiReviewStatus.replace(/_/g, ' ')}
                        </span>
                      )}

                      {doc.expiresAt && (
                        <span className={`text-xs ${isExpired(doc.expiresAt) ? 'text-rose-400 font-medium' : isExpiringSoon(doc.expiresAt) ? 'text-amber-400' : 'text-[var(--color-text-muted)]'}`}>
                          {isExpired(doc.expiresAt) ? 'Expired' : 'Expires'} {formatDate(doc.expiresAt)}
                        </span>
                      )}

                      {doc.renewalDate && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          Renewal {formatDate(doc.renewalDate)}
                        </span>
                      )}

                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDate(doc.uploadedAt)}
                        {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors flex-shrink-0 mt-0.5"
                    title="Download"
                  >
                    <Download size={14} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
