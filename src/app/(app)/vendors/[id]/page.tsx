'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Building2, FileText, ClipboardList, ShieldCheck, Settings,
  ExternalLink, Edit, Plus, Trash2, AlertCircle, CheckCircle, Download, RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { riskLevelBg, criticalityColor, statusColor, formatDate, formatCurrency, formatFileSize, DOC_TYPE_LABELS } from '@/lib/utils';
import { useToast } from '@/lib/store';
import { useAuth } from '@/lib/auth/context';

type Tab = 'overview' | 'documents' | 'questionnaires' | 'risk' | 'applications';

interface VendorDetail {
  id: string; name: string; legalName: string | null; website: string | null;
  description: string | null; category: string | null; criticality: string; status: string;
  isExempt: boolean; exemptReason: string | null; trustCenterUrl: string | null;
  primaryContactName: string | null; primaryContactEmail: string | null; primaryContactPhone: string | null;
  riskScore: number | null; riskLevel: string | null;
  processesPII: boolean; processesPHI: boolean; processesFinancial: boolean;
  dataLocation: string | null;
  contractStartDate: string | null; contractEndDate: string | null; contractValue: number | null;
  lastReviewDate: string | null; nextReviewDate: string | null;
  tags: string; notes: string | null;
  applications: Array<{ id: string; name: string; appType: string | null; status: string; containsPII: boolean }>;
  documents: Array<{
    id: string; name: string; documentType: string; reviewStatus: string;
    aiReviewStatus: string; aiReviewResult?: string | null;
    expiresAt: string | null; renewalDate?: string | null;
    fileSize: number | null; uploadedAt: string; fileUrl?: string | null;
  }>;
  questionnaireAssignments: Array<{ id: string; status: string; dueDate: string | null; questionnaire: { name: string; type: string } }>;
  riskAssessments: Array<{ id: string; riskScore: number; riskLevel: string; assessedAt: string; status: string; riskContributors?: string }>;
}

// Document types for vendors — OCG is excluded (OCGs belong to clients)
const VENDOR_DOC_TYPES = [
  'BAA', 'NDA', 'MSA', 'SLA', 'DPA', 'SOC2Report', 'ISO27001Cert',
  'PenTestReport', 'Contract', 'TrustCenterReport', 'InternalPolicy', 'Other',
];

const VENDOR_CATEGORIES = [
  'SaaS', 'IaaS', 'PaaS', 'Professional Services', 'Hardware',
  'Managed Services', 'Legal Tech', 'eDiscovery', 'CRM', 'Cloud',
  'Security', 'Productivity', 'Other',
];

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [editOpen, setEditOpen] = useState(false);

  async function load() {
    const res = await fetch(`/api/vendors/${id}`);
    if (res.ok) {
      const data = await res.json();
      setVendor(data.vendor);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="skeleton h-48 rounded-xl" />;
  if (!vendor) return <div className="text-sm text-[var(--color-text-muted)]">Vendor not found.</div>;

  const tags = JSON.parse(vendor.tags || '[]') as string[];
  let categories: string[] = [];
  try { categories = JSON.parse(vendor.category || '[]'); } catch { categories = vendor.category ? [vendor.category] : []; }

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview',       label: 'Overview' },
    { id: 'documents',      label: 'Documents',      count: vendor.documents.length },
    { id: 'questionnaires', label: 'Questionnaires', count: vendor.questionnaireAssignments.length },
    { id: 'risk',           label: 'Risk' },
    { id: 'applications',   label: 'Applications',   count: vendor.applications.length },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center">
            <Building2 size={20} className="text-[var(--color-text-muted)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{vendor.name}</h2>
              {vendor.isExempt && <Badge variant="info">Exempt</Badge>}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(vendor.status)}`}>{vendor.status}</span>
            </div>
            {vendor.legalName && <p className="text-xs text-[var(--color-text-muted)]">{vendor.legalName}</p>}
            {vendor.website && (
              <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 mt-0.5">
                {vendor.website} <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {vendor.isExempt && vendor.trustCenterUrl && (
            <a href={vendor.trustCenterUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" icon={ExternalLink}>Trust Center</Button>
            </a>
          )}
          <Button variant="secondary" size="sm" icon={Edit} onClick={() => setEditOpen(true)}>Edit</Button>
        </div>
      </div>

      {/* Risk banner */}
      {vendor.riskScore != null && (
        <div className={`flex items-center gap-4 p-4 rounded-xl border ${riskLevelBg(vendor.riskLevel)}`}>
          <div className="text-center">
            <p className="text-3xl font-bold">{vendor.riskScore}</p>
            <p className="text-xs opacity-70">Risk Score</p>
          </div>
          <div className="h-10 w-px bg-current opacity-20" />
          <div>
            <p className="font-semibold capitalize">{vendor.riskLevel} Risk</p>
            <p className="text-xs opacity-70 mt-0.5">
              Criticality: {vendor.criticality} · {vendor.processesPHI ? 'PHI · ' : ''}{vendor.processesPII ? 'PII · ' : ''}{vendor.processesFinancial ? 'Financial' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-[var(--color-bg-elevated)]">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview'       && <OverviewTab vendor={vendor} tags={tags} categories={categories} />}
      {tab === 'documents'      && <DocumentsTab vendorId={id} documents={vendor.documents} onRefresh={load} />}
      {tab === 'questionnaires' && <QuestionnairesTab vendorId={id} assignments={vendor.questionnaireAssignments} onRefresh={load} />}
      {tab === 'risk'           && <RiskTab assessments={vendor.riskAssessments} vendorId={id} onRefresh={load} />}
      {tab === 'applications'   && <ApplicationsTab applications={vendor.applications} vendorId={id} onRefresh={load} />}
    </div>
  );
}

function OverviewTab({ vendor, tags, categories }: { vendor: VendorDetail; tags: string[]; categories: string[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card>
        <CardTitle className="mb-4">Vendor Information</CardTitle>
        <dl className="space-y-3">
          <Row label="Categories" value={
            categories.length > 0
              ? <div className="flex flex-wrap gap-1 justify-end">{categories.map((c) => <span key={c} className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">{c}</span>)}</div>
              : '—'
          } />
          <Row label="Legal Name" value={vendor.legalName ?? '—'} />
          <Row label="Criticality" value={<span className={`text-xs px-2 py-0.5 rounded-full border ${criticalityColor(vendor.criticality)}`}>{vendor.criticality}</span>} />
          {vendor.description && <Row label="Description" value={<span className="text-xs">{vendor.description}</span>} />}
        </dl>
      </Card>
      <Card>
        <CardTitle className="mb-4">Contract Details</CardTitle>
        <dl className="space-y-3">
          <Row label="Start Date" value={vendor.contractStartDate ? formatDate(vendor.contractStartDate) : '—'} />
          <Row label="End Date" value={vendor.contractEndDate ? formatDate(vendor.contractEndDate) : '—'} />
          <Row label="Value" value={vendor.contractValue ? formatCurrency(vendor.contractValue) : '—'} />
          <Row label="Last Review" value={vendor.lastReviewDate ? formatDate(vendor.lastReviewDate) : '—'} />
          <Row label="Next Review" value={vendor.nextReviewDate ? formatDate(vendor.nextReviewDate) : '—'} />
        </dl>
      </Card>
      <Card>
        <CardTitle className="mb-4">Contact</CardTitle>
        <dl className="space-y-3">
          <Row label="Name" value={vendor.primaryContactName ?? '—'} />
          <Row label="Email" value={vendor.primaryContactEmail ?? '—'} />
          <Row label="Phone" value={vendor.primaryContactPhone ?? '—'} />
        </dl>
      </Card>
      <Card>
        <CardTitle className="mb-4">Data Handling</CardTitle>
        <dl className="space-y-3">
          <Row label="Processes PII" value={<FlagBadge active={vendor.processesPII} />} />
          <Row label="Processes PHI" value={<FlagBadge active={vendor.processesPHI} />} />
          <Row label="Financial Data" value={<FlagBadge active={vendor.processesFinancial} />} />
          {vendor.dataLocation && <Row label="Data Location" value={vendor.dataLocation} />}
        </dl>
      </Card>
      {vendor.notes && (
        <Card className="lg:col-span-2">
          <CardTitle className="mb-3">Notes</CardTitle>
          <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{vendor.notes}</p>
        </Card>
      )}
    </div>
  );
}

function DocumentsTab({
  vendorId, documents, onRefresh,
}: {
  vendorId: string;
  documents: VendorDetail['documents'];
  onRefresh: () => void;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'company_admin';
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<VendorDetail['documents'][0] | null>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<VendorDetail['documents'][0] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reReviewing, setReReviewing] = useState(false);
  const [form, setForm] = useState({
    name: '', documentType: 'BAA', expiresAt: '', renewalDate: '', description: '', triggerAiReview: false,
  });

  async function handleDelete() {
    if (!confirmDeleteDoc) return;
    setDeleting(true);
    const res = await fetch(`/api/documents/${confirmDeleteDoc.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Document deleted');
      setSelectedDoc(null);
      setConfirmDeleteDoc(null);
      onRefresh();
    } else {
      toast.error('Failed to delete document');
    }
    setDeleting(false);
  }

  async function handleReReview(docId: string) {
    setReReviewing(true);
    const res = await fetch(`/api/documents/${docId}/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });
    if (res.ok) {
      toast.success('AI review started — refresh in a moment');
      onRefresh();
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      toast.error(data.error ?? 'Failed to start AI review');
    }
    setReReviewing(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const input = document.getElementById('vendor-doc-file') as HTMLInputElement;
    if (!input?.files?.[0]) { toast.error('Select a file first'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', input.files[0]);
    fd.append('vendorId', vendorId);
    fd.append('documentType', form.documentType);
    fd.append('name', form.name || input.files[0].name);
    fd.append('description', form.description);
    if (form.expiresAt) fd.append('expiresAt', form.expiresAt);
    if (form.renewalDate) fd.append('renewalDate', form.renewalDate);
    fd.append('triggerAiReview', String(form.triggerAiReview));
    const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
    if (res.ok) {
      toast.success('Document uploaded');
      onRefresh();
      setUploadOpen(false);
      setForm({ name: '', documentType: 'BAA', expiresAt: '', renewalDate: '', description: '', triggerAiReview: false });
    } else {
      toast.error('Upload failed');
    }
    setUploading(false);
  }

  const aiResult = selectedDoc?.aiReviewResult
    ? (() => { try { return JSON.parse(selectedDoc.aiReviewResult!); } catch { return null; } })()
    : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" icon={Plus} onClick={() => setUploadOpen(true)}>Upload Document</Button>
      </div>

      {documents.length === 0 ? (
        <Card><p className="text-sm text-[var(--color-text-muted)] text-center py-6">No documents yet.</p></Card>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <Card
              key={d.id}
              className="py-3 px-4 cursor-pointer hover:border-[var(--color-accent)]/40 transition-colors"
              onClick={() => setSelectedDoc(d)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0">
                    <FileText size={12} className="text-[var(--color-text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{d.name}</p>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                        {DOC_TYPE_LABELS[d.documentType] ?? d.documentType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${d.reviewStatus === 'approved' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] border-[var(--color-border)]'}`}>
                        {d.reviewStatus.replace(/_/g, ' ')}
                      </span>
                      {d.aiReviewStatus !== 'not_reviewed' && (
                        <span className={`text-xs flex items-center gap-1 ${d.aiReviewStatus === 'approved' ? 'text-emerald-400' : d.aiReviewStatus === 'flagged' ? 'text-rose-400' : 'text-[var(--color-text-muted)]'}`}>
                          {d.aiReviewStatus === 'approved' && <CheckCircle size={10} />}
                          {d.aiReviewStatus === 'flagged' && <AlertCircle size={10} />}
                          AI: {d.aiReviewStatus.replace(/_/g, ' ')}
                        </span>
                      )}
                      {d.expiresAt && <span className="text-xs text-[var(--color-text-muted)]">Exp {formatDate(d.expiresAt)}</span>}
                      {d.renewalDate && <span className="text-xs text-[var(--color-text-muted)]">Renewal {formatDate(d.renewalDate)}</span>}
                      <span className="text-xs text-[var(--color-text-muted)]">{formatFileSize(d.fileSize)}</span>
                    </div>
                  </div>
                </div>
                {d.fileUrl && (
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] flex-shrink-0">
                    <Download size={13} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Document" size="lg"
        footer={<><Button variant="secondary" onClick={() => setUploadOpen(false)}>Cancel</Button><Button loading={uploading} onClick={handleUpload}>Upload</Button></>}>
        <form onSubmit={handleUpload} className="space-y-4">
          <DropZone inputId="vendor-doc-file" />
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Document Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Leave blank to use filename" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Document Type</label>
            <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })}>
              {VENDOR_DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_LABELS[t] ?? t}</option>)}
            </select>
          </div>
          <div className={`grid gap-3 ${form.documentType === 'Contract' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Expiration Date</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            {form.documentType === 'Contract' && (
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Renewal Date</label>
                <input type="date" value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/20">
            <input type="checkbox" id="vendor-ai-review" checked={form.triggerAiReview} onChange={(e) => setForm({ ...form, triggerAiReview: e.target.checked })} style={{ width: 'auto' }} />
            <label htmlFor="vendor-ai-review" className="text-xs text-[var(--color-text-secondary)]">
              Run AI review — auto-detects expiration date, flags risks, and updates the vendor&apos;s risk score
            </label>
          </div>
        </form>
      </Modal>

      {/* AI Review Detail Modal */}
      <Modal
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.name ?? ''}
        size="xl"
        footer={
          <>
            {canManage && selectedDoc && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setConfirmDeleteDoc(selectedDoc)}
                  className="text-rose-400 hover:text-rose-300 mr-auto"
                >
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  loading={reReviewing}
                  onClick={() => handleReReview(selectedDoc.id)}
                >
                  Re-run AI Review
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={() => setSelectedDoc(null)}>Close</Button>
          </>
        }
      >
        {selectedDoc && <DocReviewPanel doc={selectedDoc} result={aiResult} />}
      </Modal>

      <ConfirmModal
        open={!!confirmDeleteDoc}
        onClose={() => setConfirmDeleteDoc(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Delete "${confirmDeleteDoc?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}

function DropZone({ inputId }: { inputId: string }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(f);
        input.files = dt.files;
      }
    }
  }

  return (
    <div
      className={`drop-zone p-6 text-center cursor-pointer ${dragging ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById(inputId)?.click()}
    >
      <input
        id={inputId} type="file" accept=".pdf,.doc,.docx,.txt"
        style={{ display: 'none', width: 0 }}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <FileText size={20} className="mx-auto text-[var(--color-text-muted)] mb-2" />
      {file ? (
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{file.name}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">Drop a file here, or <span className="text-[var(--color-accent)]">browse</span></p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">PDF, Word, or text files</p>
        </div>
      )}
    </div>
  );
}

function DocReviewPanel({ doc, result }: { doc: VendorDetail['documents'][0]; result: Record<string, unknown> | null }) {
  if (!result) {
    return (
      <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
        {doc.aiReviewStatus === 'not_reviewed' ? 'AI review has not been run for this document.' :
         doc.aiReviewStatus === 'in_progress' || doc.aiReviewStatus === 'pending' ? 'AI review in progress…' :
         doc.aiReviewStatus === 'failed' ? 'AI review failed. Check AI configuration in Settings.' :
         'No review data available.'}
      </div>
    );
  }

  const riskFlags = (result.riskFlags as Array<{ severity: string; description: string; mitigation?: string }>) ?? [];
  const riskContributors = (result.riskContributors as Array<{ item: string; impact: string; mitigation: string }>) ?? [];
  const keyProvisions = (result.keyProvisions as string[]) ?? [];
  const recommendations = (result.recommendations as string[]) ?? [];
  const parties = (result.parties as string[]) ?? [];

  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
      <div className="flex items-center gap-3">
        <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${
          result.overallRisk === 'critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
          result.overallRisk === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
          result.overallRisk === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
          'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        }`}>
          {String(result.overallRisk ?? '').toUpperCase()} RISK
        </span>
        {!!result.expirationDate && <span className="text-xs text-[var(--color-text-muted)]">Expires: {String(result.expirationDate)}</span>}
        {!!result.renewalDate && <span className="text-xs text-[var(--color-text-muted)]">Renewal: {String(result.renewalDate)}</span>}
        {parties.length > 0 && <span className="text-xs text-[var(--color-text-muted)]">Parties: {parties.join(', ')}</span>}
      </div>

      {!!result.summary && (
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Summary</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{result.summary as string}</p>
        </div>
      )}

      {riskContributors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Risk Score Contributors</p>
          <div className="space-y-2">
            {riskContributors.map((rc, i) => (
              <div key={i} className="p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                <p className="text-xs font-medium text-[var(--color-text-primary)] mb-1">{rc.item}</p>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Impact: {rc.impact}</p>
                <p className="text-xs text-emerald-400">→ {rc.mitigation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {riskFlags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Risk Flags</p>
          <div className="space-y-2">
            {riskFlags.map((flag, i) => (
              <div key={i} className={`p-3 rounded-lg border text-xs ${
                flag.severity === 'critical' ? 'bg-rose-500/5 border-rose-500/20' :
                flag.severity === 'high' ? 'bg-orange-500/5 border-orange-500/20' :
                flag.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
                'bg-[var(--color-bg-elevated)] border-[var(--color-border)]'
              }`}>
                <div className={`flex items-center gap-1.5 mb-1 font-semibold uppercase tracking-wide text-[10px] ${
                  flag.severity === 'critical' ? 'text-rose-400' : flag.severity === 'high' ? 'text-orange-400' : flag.severity === 'medium' ? 'text-amber-400' : 'text-[var(--color-text-muted)]'
                }`}>
                  <AlertCircle size={10} /> {flag.severity}
                </div>
                <p className="text-[var(--color-text-secondary)] mb-1">{flag.description}</p>
                {flag.mitigation && <p className="text-[var(--color-text-muted)] italic">{flag.mitigation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {keyProvisions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Key Provisions</p>
          <ul className="space-y-1">
            {keyProvisions.map((p, i) => (
              <li key={i} className="text-xs text-[var(--color-text-secondary)] flex gap-2">
                <span className="text-[var(--color-accent)] flex-shrink-0">·</span>{p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Recommendations</p>
          <ul className="space-y-1">
            {recommendations.map((r, i) => (
              <li key={i} className="text-xs text-[var(--color-text-secondary)] flex gap-2">
                <span className="text-emerald-400 flex-shrink-0">→</span>{r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function QuestionnairesTab({ vendorId, assignments, onRefresh }: { vendorId: string; assignments: VendorDetail['questionnaireAssignments']; onRefresh: () => void }) {
  const toast = useToast();
  const [assignOpen, setAssignOpen] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [form, setForm] = useState({ questionnaireId: '', dueDate: '', vendorContactEmail: '', sendEmail: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (assignOpen) {
      fetch('/api/questionnaires').then(r => r.json()).then(d => setQuestionnaires(d.questionnaires ?? []));
    }
  }, [assignOpen]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/questionnaires/${form.questionnaireId}/assign`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ vendorId, ...form }),
    });
    if (res.ok) { toast.success('Questionnaire assigned'); onRefresh(); setAssignOpen(false); }
    else { toast.error('Failed to assign'); }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" icon={Plus} onClick={() => setAssignOpen(true)}>Assign Questionnaire</Button>
      </div>
      {assignments.length === 0 ? (
        <Card><p className="text-sm text-[var(--color-text-muted)] text-center py-6">No questionnaires assigned yet.</p></Card>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <Card key={a.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{a.questionnaire.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Due: {a.dueDate ? formatDate(a.dueDate) : 'No deadline'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(a.status)}`}>{a.status.replace(/_/g, ' ')}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Questionnaire" size="md"
        footer={<><Button variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleAssign}>Assign</Button></>}>
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Questionnaire</label>
            <select value={form.questionnaireId} onChange={(e) => setForm({ ...form, questionnaireId: e.target.value })} required>
              <option value="">Select questionnaire…</option>
              {questionnaires.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Vendor Contact Email (for guest link)</label>
            <input type="email" value={form.vendorContactEmail} onChange={(e) => setForm({ ...form, vendorContactEmail: e.target.value })} placeholder="vendor@example.com" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="send-email" checked={form.sendEmail} onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })} style={{ width: 'auto' }} />
            <label htmlFor="send-email" className="text-xs text-[var(--color-text-secondary)]">Send invitation email to vendor</label>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function RiskTab({ assessments, vendorId, onRefresh }: { assessments: VendorDetail['riskAssessments']; vendorId: string; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {assessments.length === 0 ? (
        <Card><p className="text-sm text-[var(--color-text-muted)] text-center py-6">No risk assessments yet. Upload documents to trigger an AI review, which will auto-calculate the risk score.</p></Card>
      ) : (
        assessments.map((a) => {
          let contributors: Array<{ source?: string; item: string; impact: string; mitigation: string; severity?: string }> = [];
          try { contributors = JSON.parse(a.riskContributors ?? '[]'); } catch {}

          return (
            <Card key={a.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Risk Assessment</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(a.assessedAt)} · {a.status}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${a.riskLevel === 'critical' ? 'text-rose-400' : a.riskLevel === 'high' ? 'text-orange-400' : a.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {a.riskScore}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] capitalize">{a.riskLevel}</p>
                </div>
              </div>

              {contributors.length > 0 && (
                <div>
                  <button
                    onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                    className="text-xs text-[var(--color-accent)] hover:underline mb-2"
                  >
                    {expanded === a.id ? '▲ Hide' : '▼ Show'} {contributors.length} risk contributor{contributors.length !== 1 ? 's' : ''}
                  </button>
                  {expanded === a.id && (
                    <div className="space-y-2 mt-2">
                      {contributors.map((c, i) => (
                        <div key={i} className="p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                          {c.source && <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{c.source}</p>}
                          <p className="text-xs font-medium text-[var(--color-text-primary)] mb-0.5">{c.item}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mb-1">{c.impact}</p>
                          <p className="text-xs text-emerald-400">→ {c.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

function ApplicationsTab({ applications, vendorId, onRefresh }: { applications: VendorDetail['applications']; vendorId: string; onRefresh: () => void }) {
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', appType: '', containsPII: false, containsPHI: false });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/vendors/${vendorId}/applications`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success('Application added'); onRefresh(); setAddOpen(false); }
    else { toast.error('Failed to add'); }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add Application</Button>
      </div>
      {applications.length === 0 ? (
        <Card><p className="text-sm text-[var(--color-text-muted)] text-center py-6">No applications recorded.</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {applications.map((a) => (
            <Card key={a.id}>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{a.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{a.appType ?? 'Unknown type'}</p>
              <div className="flex gap-1.5 mt-2">
                {a.containsPII && <Badge variant="warning">PII</Badge>}
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(a.status)}`}>{a.status}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Application" size="sm"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleAdd}>Add</Button></>}>
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Application Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Salesforce CRM" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Type</label>
            <select value={form.appType} onChange={(e) => setForm({ ...form, appType: e.target.value })}>
              <option value="">Select type…</option>
              {['SaaS', 'API', 'On-premise', 'Mobile', 'Other'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)]">Data handled</label>
            {[['pii', 'containsPII', 'Contains PII'], ['phi', 'containsPHI', 'Contains PHI']].map(([id, key, label]) => (
              <div key={id} className="flex items-center gap-2">
                <input type="checkbox" id={id} checked={form[key as 'containsPII' | 'containsPHI']} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} style={{ width: 'auto' }} />
                <label htmlFor={id} className="text-xs">{label}</label>
              </div>
            ))}
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs text-[var(--color-text-muted)] flex-shrink-0 w-28">{label}</dt>
      <dd className="text-xs text-[var(--color-text-secondary)] text-right">{value}</dd>
    </div>
  );
}

function FlagBadge({ active }: { active: boolean }) {
  return active
    ? <Badge variant="warning">Yes</Badge>
    : <span className="text-xs text-[var(--color-text-muted)]">No</span>;
}
