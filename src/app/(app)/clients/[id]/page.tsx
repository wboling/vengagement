'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Briefcase, FileText, Plus, Download, CheckCircle, AlertCircle, Clock, Edit, ArrowLeft, RefreshCw, Trash2, BotOff, Bot, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatFileSize, statusColor, DOC_TYPE_LABELS } from '@/lib/utils';
import { useToast } from '@/lib/store';
import { useAuth } from '@/lib/auth/context';

interface ClientDetail {
  id: string;
  name: string;
  matter: string | null;
  type: string;
  status: string;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  notes: string | null;
  documents: Array<{
    id: string; name: string; documentType: string; reviewStatus: string;
    aiReviewStatus: string; expiresAt: string | null; renewalDate: string | null;
    fileSize: number | null; uploadedAt: string; fileUrl: string | null;
    aiReviewResult?: string | null;
  }>;
}

const CLIENT_TYPES: Record<string, string> = {
  corporate: 'Corporate', litigation: 'Litigation',
  transactional: 'Transactional', advisory: 'Advisory',
};

const AI_CLASSES: Record<string, string> = {
  approved: 'text-emerald-400', flagged: 'text-rose-400',
  in_progress: 'text-[var(--color-accent)]', failed: 'text-rose-400',
  pending: 'text-[var(--color-text-muted)]', not_reviewed: 'text-[var(--color-text-muted)]',
};

// Document types valid for clients (OCG + general legal docs)
const CLIENT_DOC_TYPES = [
  'OCG', 'NDA', 'MSA', 'Contract', 'DPA', 'Other',
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'company_admin';
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ClientDetail['documents'][0] | null>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<ClientDetail['documents'][0] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reReviewing, setReReviewing] = useState(false);
  const [form, setForm] = useState({
    name: '', documentType: 'OCG', expiresAt: '', renewalDate: '', description: '', triggerAiReview: true,
  });

  async function handleDelete() {
    if (!confirmDeleteDoc) return;
    setDeleting(true);
    const res = await fetch(`/api/documents/${confirmDeleteDoc.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Document deleted');
      setSelectedDoc(null);
      setConfirmDeleteDoc(null);
      load();
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
      load();
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      toast.error(data.error ?? 'Failed to start AI review');
    }
    setReReviewing(false);
  }

  async function load() {
    const res = await fetch(`/api/clients/${id}`);
    if (res.ok) setClient((await res.json()).client);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const input = document.getElementById('client-doc-file') as HTMLInputElement;
    if (!input?.files?.[0]) { toast.error('Select a file first'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', input.files[0]);
    fd.append('clientId', id);
    fd.append('documentType', form.documentType);
    fd.append('name', form.name || input.files[0].name);
    fd.append('description', form.description);
    if (form.expiresAt) fd.append('expiresAt', form.expiresAt);
    if (form.renewalDate) fd.append('renewalDate', form.renewalDate);
    fd.append('triggerAiReview', String(form.triggerAiReview));
    const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
    if (res.ok) {
      toast.success('Document uploaded');
      setUploadOpen(false);
      setForm({ name: '', documentType: 'OCG', expiresAt: '', renewalDate: '', description: '', triggerAiReview: true });
      load();
    } else {
      toast.error('Upload failed');
    }
    setUploading(false);
  }

  if (loading) return <div className="skeleton h-48 rounded-xl" />;
  if (!client) return <div className="text-sm text-[var(--color-text-muted)]">Client not found.</div>;

  const aiResult = selectedDoc?.aiReviewResult ? (() => { try { return JSON.parse(selectedDoc.aiReviewResult!); } catch { return null; } })() : null;

  // Scan all OCG documents for AI usage restrictions
  const aiRestrictionDoc = client.documents.find((doc) => {
    if (doc.documentType !== 'OCG') return false;
    if (!doc.aiReviewResult) return false;
    try {
      const r = JSON.parse(doc.aiReviewResult);
      return r.aiUsageRestrictions?.detected === true;
    } catch { return false; }
  });
  const aiRestrictions = aiRestrictionDoc?.aiReviewResult
    ? (() => { try { return JSON.parse(aiRestrictionDoc.aiReviewResult!).aiUsageRestrictions; } catch { return null; } })()
    : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Link href="/clients" className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Clients
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-teal-subtle)] flex items-center justify-center">
              <Briefcase size={20} className="text-[var(--color-teal)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{client.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(client.status)}`}>{client.status}</span>
              </div>
              {client.matter && <p className="text-xs font-mono text-[var(--color-text-muted)]">{client.matter}</p>}
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{CLIENT_TYPES[client.type] ?? client.type}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Usage Restrictions Banner */}
      {aiRestrictions && (
        <div className={`rounded-xl border p-4 ${aiRestrictions.prohibitedUses?.length > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${aiRestrictions.prohibitedUses?.length > 0 ? 'bg-rose-500/10' : 'bg-amber-500/10'}`}>
              <BotOff size={15} className={aiRestrictions.prohibitedUses?.length > 0 ? 'text-rose-400' : 'text-amber-400'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-xs font-bold uppercase tracking-wide ${aiRestrictions.prohibitedUses?.length > 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                  AI Usage Restrictions Detected
                </p>
                {aiRestrictions.requiresClientConsent && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                    REQUIRES CONSENT
                  </span>
                )}
                {aiRestrictions.requiresDisclosure && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    REQUIRES DISCLOSURE
                  </span>
                )}
              </div>
              {aiRestrictions.summary && (
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">{aiRestrictions.summary}</p>
              )}
              {aiRestrictions.prohibitedUses?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-rose-400 mb-1">Prohibited uses:</p>
                  <ul className="space-y-0.5">
                    {(aiRestrictions.prohibitedUses as string[]).map((item: string, i: number) => (
                      <li key={i} className="text-xs text-[var(--color-text-secondary)] flex gap-2">
                        <span className="text-rose-400 flex-shrink-0">✗</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiRestrictions.permittedUses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-1">Permitted uses:</p>
                  <ul className="space-y-0.5">
                    {(aiRestrictions.permittedUses as string[]).map((item: string, i: number) => (
                      <li key={i} className="text-xs text-[var(--color-text-secondary)] flex gap-2">
                        <span className="text-emerald-400 flex-shrink-0">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Source: {aiRestrictionDoc?.name}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Details */}
        <Card>
          <CardTitle className="mb-4">Client Details</CardTitle>
          <dl className="space-y-3">
            {client.primaryContactName && (
              <div className="flex justify-between gap-4">
                <dt className="text-xs text-[var(--color-text-muted)]">Contact</dt>
                <dd className="text-xs text-[var(--color-text-secondary)] text-right">{client.primaryContactName}</dd>
              </div>
            )}
            {client.primaryContactEmail && (
              <div className="flex justify-between gap-4">
                <dt className="text-xs text-[var(--color-text-muted)]">Email</dt>
                <dd className="text-xs text-[var(--color-text-secondary)] text-right">{client.primaryContactEmail}</dd>
              </div>
            )}
            {client.notes && (
              <div>
                <dt className="text-xs text-[var(--color-text-muted)] mb-1">Notes</dt>
                <dd className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap">{client.notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Outside Counsel Guidelines (takes 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Outside Counsel Guidelines <span className="text-[var(--color-text-muted)] font-normal">({client.documents.length})</span>
            </h3>
            <Button size="sm" icon={Plus} onClick={() => setUploadOpen(true)}>Upload OCG</Button>
          </div>

          {client.documents.length === 0 ? (
            <Card>
              <div className="py-8 text-center">
                <FileText size={24} className="mx-auto text-[var(--color-text-muted)] mb-2 opacity-40" />
                <p className="text-sm text-[var(--color-text-muted)]">No outside counsel guidelines yet.</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Upload OCGs to track billing guidelines, security requirements, and key terms.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {client.documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="py-3 px-4 cursor-pointer hover:border-[var(--color-accent)]/40 transition-colors"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText size={12} className="text-[var(--color-text-muted)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{doc.name}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] font-mono border border-[var(--color-border)]">
                            {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${doc.reviewStatus === 'approved' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] border-[var(--color-border)]'}`}>
                            {doc.reviewStatus.replace(/_/g, ' ')}
                          </span>
                          {doc.aiReviewStatus !== 'not_reviewed' && (
                            <span className={`text-xs flex items-center gap-1 ${AI_CLASSES[doc.aiReviewStatus] ?? ''}`}>
                              {doc.aiReviewStatus === 'approved' && <CheckCircle size={10} />}
                              {doc.aiReviewStatus === 'flagged' && <AlertCircle size={10} />}
                              AI: {doc.aiReviewStatus.replace(/_/g, ' ')}
                            </span>
                          )}
                          {doc.expiresAt && (
                            <span className="text-xs text-[var(--color-text-muted)]">Expires {formatDate(doc.expiresAt)}</span>
                          )}
                          {doc.renewalDate && (
                            <span className="text-xs text-[var(--color-text-muted)]">Renews {formatDate(doc.renewalDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] flex-shrink-0">
                        <Download size={13} />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Outside Counsel Guidelines" size="lg"
        footer={<><Button variant="secondary" onClick={() => setUploadOpen(false)}>Cancel</Button><Button loading={uploading} onClick={handleUpload}>Upload</Button></>}>
        <form onSubmit={handleUpload} className="space-y-4">
          {/* Drag-drop zone */}
          <DropZone inputId="client-doc-file" />
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Document Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Leave blank to use filename" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Document Type</label>
            <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })}>
              {CLIENT_DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_LABELS[t] ?? t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Expiration Date</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Renewal Date</label>
              <input type="date" value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/20">
            <input type="checkbox" id="client-ai-review" checked={form.triggerAiReview} onChange={(e) => setForm({ ...form, triggerAiReview: e.target.checked })} style={{ width: 'auto' }} />
            <label htmlFor="client-ai-review" className="text-xs text-[var(--color-text-secondary)]">
              Run AI review — for OCGs, automatically extracts billing guidelines, security requirements, and risk flags
            </label>
          </div>
        </form>
      </Modal>

      {/* AI Review Result Modal */}
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
        {selectedDoc && <AiReviewPanel doc={selectedDoc} result={aiResult} />}
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
        className="hidden" style={{ display: 'none', width: 0 }}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <FileText size={20} className="mx-auto text-[var(--color-text-muted)] mb-2" />
      {file ? (
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{file.name}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {(file.size / 1024).toFixed(1)} KB · Click to change
          </p>
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

function AiReviewPanel({ doc, result }: { doc: ClientDetail['documents'][0]; result: Record<string, unknown> | null }) {
  if (!result) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[var(--color-text-muted)]">
          {doc.aiReviewStatus === 'not_reviewed' ? 'AI review has not been run for this document.' :
           doc.aiReviewStatus === 'pending' || doc.aiReviewStatus === 'in_progress' ? 'AI review is in progress…' :
           doc.aiReviewStatus === 'failed' ? 'AI review failed.' : 'No review data available.'}
        </p>
      </div>
    );
  }

  const riskFlags = (result.riskFlags as Array<{ severity: string; description: string; mitigation?: string }>) ?? [];
  const keyProvisions = (result.keyProvisions as string[]) ?? [];
  const recommendations = (result.recommendations as string[]) ?? [];
  const aiUsage = result.aiUsageRestrictions as {
    detected?: boolean; summary?: string | null;
    restrictions?: string[]; permittedUses?: string[]; prohibitedUses?: string[];
    requiresDisclosure?: boolean; requiresClientConsent?: boolean;
  } | undefined;

  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
      {!!result.summary && (
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Summary</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{result.summary as string}</p>
        </div>
      )}

      {aiUsage?.detected && (
        <div className={`rounded-lg border p-3 ${aiUsage.prohibitedUses?.length ? 'bg-rose-500/5 border-rose-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <BotOff size={12} className={aiUsage.prohibitedUses?.length ? 'text-rose-400' : 'text-amber-400'} />
            <p className={`text-xs font-bold uppercase tracking-wide ${aiUsage.prohibitedUses?.length ? 'text-rose-400' : 'text-amber-400'}`}>
              AI Usage Restrictions
            </p>
            {aiUsage.requiresClientConsent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Requires Consent</span>}
            {aiUsage.requiresDisclosure && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Requires Disclosure</span>}
          </div>
          {aiUsage.summary && <p className="text-xs text-[var(--color-text-secondary)] mb-2">{aiUsage.summary}</p>}
          {aiUsage.prohibitedUses?.map((item, i) => (
            <div key={i} className="text-xs text-rose-300 flex gap-1.5 mb-0.5"><span className="flex-shrink-0">✗</span>{item}</div>
          ))}
          {aiUsage.permittedUses?.map((item, i) => (
            <div key={i} className="text-xs text-emerald-400 flex gap-1.5 mb-0.5"><span className="flex-shrink-0">✓</span>{item}</div>
          ))}
        </div>
      )}

      {riskFlags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Risk Flags</p>
          <div className="space-y-2">
            {riskFlags.map((flag, i) => (
              <div key={i} className={`p-3 rounded-lg border text-xs ${
                flag.severity === 'critical' ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' :
                flag.severity === 'high' ? 'bg-orange-500/5 border-orange-500/20 text-orange-400' :
                flag.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' :
                'bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
              }`}>
                <div className="flex items-center gap-1.5 mb-1 font-semibold uppercase tracking-wide text-[10px]">
                  <AlertCircle size={10} /> {flag.severity}
                </div>
                <p className="mb-1">{flag.description}</p>
                {flag.mitigation && <p className="opacity-80 italic">{flag.mitigation}</p>}
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
