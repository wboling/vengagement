'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/store';
import { statusColor, formatDate } from '@/lib/utils';

interface Step {
  id: string; stepType: string; stepOrder: number; status: string;
  completedBy: string | null; completedAt: string | null; notes: string | null;
}

interface LifecycleRequest {
  id: string; vendorName: string; vendorLegalName: string | null;
  vendorWebsite: string | null; vendorDescription: string | null; vendorCategory: string | null;
  estimatedCriticality: string; businessJustification: string | null;
  status: string; currentStep: string; requestedAt: string;
  adminNotes: string | null; rejectionReason: string | null;
  completedAt: string | null;
  vendor: { id: string; name: string; status: string } | null;
  steps: Step[];
}

const STEP_LABELS: Record<string, string> = {
  submission: 'Submission', security_review: 'Security Review',
  legal_review: 'Legal Review', exec_approval: 'Executive Approval',
  document_collection: 'Document Collection', questionnaire_assignment: 'Questionnaire',
  complete: 'Complete',
};

const STEP_ICON = {
  completed: <CheckCircle size={16} className="text-emerald-400" />,
  in_progress: <Clock size={16} className="text-indigo-400 animate-pulse" />,
  blocked: <XCircle size={16} className="text-rose-400" />,
  pending: <div className="w-4 h-4 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)]" />,
  skipped: <div className="w-4 h-4 rounded-full border border-dashed border-[var(--color-text-muted)]" />,
};

export default function LifecycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [request, setRequest] = useState<LifecycleRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [approveOpen, setApproveOpen] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const res = await fetch(`/api/lifecycle/${id}`);
    if (res.ok) {
      const data = await res.json();
      setRequest(data.request);
    }
    setLoading(false);
  }

  async function approveStep(stepType: string) {
    setActionLoading(true);
    const res = await fetch(`/api/lifecycle/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'approve_step', stepType, notes }),
    });
    if (res.ok) { toast.success('Step approved'); setApproveOpen(null); setNotes(''); load(); }
    else toast.error('Action failed');
    setActionLoading(false);
  }

  async function reject() {
    setActionLoading(true);
    const res = await fetch(`/api/lifecycle/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'reject', reason: notes }),
    });
    if (res.ok) { toast.success('Request rejected'); setRejectOpen(false); setNotes(''); load(); }
    else toast.error('Action failed');
    setActionLoading(false);
  }

  async function complete() {
    setActionLoading(true);
    const res = await fetch(`/api/lifecycle/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success('Vendor created');
      setCompleteOpen(false);
      if (data.vendorId) router.push(`/vendors/${data.vendorId}`);
    } else toast.error('Action failed');
    setActionLoading(false);
  }

  if (loading) return <div className="skeleton h-64 rounded-xl" />;
  if (!request) return <p className="text-sm text-[var(--color-text-muted)]">Request not found.</p>;

  const inProgressStep = request.steps.find((s) => s.status === 'in_progress');
  const canApprove = inProgressStep && !['complete', 'rejected', 'completed'].includes(request.status);
  const canComplete = request.status === 'approved' && !request.vendor;
  const canReject = !['rejected', 'completed'].includes(request.status);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/lifecycle"><Button variant="ghost" size="sm" icon={ArrowLeft}>Back</Button></Link>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{request.vendorName}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Lifecycle Request · Submitted {formatDate(request.requestedAt)}</p>
        </div>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${statusColor(request.status)}`}>
          {request.status.replace('_', ' ')}
        </span>
      </div>

      {/* Step timeline */}
      <Card>
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Approval Steps</p>
        <div className="space-y-3">
          {request.steps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {STEP_ICON[step.status as keyof typeof STEP_ICON] ?? STEP_ICON.pending}
                {i < request.steps.length - 1 && (
                  <div className="w-px h-6 bg-[var(--color-border)] mt-1" />
                )}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{STEP_LABELS[step.stepType] ?? step.stepType}</p>
                  {step.completedAt && (
                    <span className="text-xs text-[var(--color-text-muted)]">{formatDate(step.completedAt)}</span>
                  )}
                </div>
                {step.notes && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{step.notes}</p>}
                {step.status === 'in_progress' && canApprove && (
                  <button
                    onClick={() => { setApproveOpen(step.stepType); setNotes(''); }}
                    className="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Review & Approve <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Vendor details */}
      <Card>
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Request Details</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {[
            ['Vendor Name', request.vendorName],
            ['Legal Name', request.vendorLegalName || '—'],
            ['Category', request.vendorCategory || '—'],
            ['Criticality', request.estimatedCriticality],
            ['Website', request.vendorWebsite],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
              <dd className="text-sm text-[var(--color-text-primary)] mt-0.5">
                {label === 'Website' && value ? (
                  <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                    {value} <ExternalLink size={11} />
                  </a>
                ) : value || '—'}
              </dd>
            </div>
          ))}
        </dl>
        {request.vendorDescription && (
          <div className="mt-4">
            <dt className="text-xs text-[var(--color-text-muted)]">Description</dt>
            <dd className="text-sm text-[var(--color-text-secondary)] mt-0.5">{request.vendorDescription}</dd>
          </div>
        )}
        {request.businessJustification && (
          <div className="mt-4">
            <dt className="text-xs text-[var(--color-text-muted)]">Business Justification</dt>
            <dd className="text-sm text-[var(--color-text-secondary)] mt-0.5">{request.businessJustification}</dd>
          </div>
        )}
        {request.rejectionReason && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-xs font-medium text-rose-400 mb-1">Rejection Reason</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{request.rejectionReason}</p>
          </div>
        )}
      </Card>

      {/* Linked vendor */}
      {request.vendor && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Vendor Created</p>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{request.vendor.name}</p>
            </div>
            <Link href={`/vendors/${request.vendor.id}`}>
              <Button variant="secondary" size="sm" icon={ExternalLink}>View Vendor</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Actions */}
      {(canApprove || canComplete || canReject) && (
        <div className="flex gap-3">
          {canComplete && (
            <Button onClick={() => setCompleteOpen(true)}>Create Vendor</Button>
          )}
          {canReject && (
            <Button variant="secondary" onClick={() => { setRejectOpen(true); setNotes(''); }}>
              Reject Request
            </Button>
          )}
        </div>
      )}

      {/* Approve step modal */}
      <Modal
        open={!!approveOpen}
        onClose={() => setApproveOpen(null)}
        title={`Approve: ${STEP_LABELS[approveOpen ?? ''] ?? approveOpen}`}
        footer={
          <><Button variant="secondary" onClick={() => setApproveOpen(null)}>Cancel</Button>
          <Button loading={actionLoading} onClick={() => approveStep(approveOpen!)}>Approve</Button></>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">Add notes for this approval step (optional).</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Approval notes…"
          />
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject Request"
        footer={
          <><Button variant="secondary" onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button loading={actionLoading} onClick={reject} className="bg-rose-600 hover:bg-rose-700">Reject</Button></>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">Provide a reason for rejection (shown to the requester).</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Rejection reason…"
          />
        </div>
      </Modal>

      {/* Complete modal */}
      <Modal
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        title="Create Vendor"
        footer={
          <><Button variant="secondary" onClick={() => setCompleteOpen(false)}>Cancel</Button>
          <Button loading={actionLoading} onClick={complete}>Create Vendor</Button></>
        }
      >
        <p className="text-sm text-[var(--color-text-secondary)]">
          This will create an active vendor record for <strong className="text-[var(--color-text-primary)]">{request.vendorName}</strong> and mark the lifecycle request as complete.
        </p>
      </Modal>
    </div>
  );
}
