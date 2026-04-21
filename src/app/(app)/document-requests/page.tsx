'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, ChevronDown, ExternalLink, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/lib/store';
import { formatDate, docRequestStatusColor, DOC_TYPE_LABELS } from '@/lib/utils';
import { DOCUMENT_REQUEST_CATALOG } from '@/lib/document-request-catalog';

interface DocumentRequest {
  id: string;
  vendorId: string;
  documentType: string;
  label: string | null;
  description: string | null;
  nistRef: string | null;
  status: string;
  dueDate: string | null;
  notes: string | null;
  requestedAt: string;
  vendor: { id: string; name: string; criticality: string };
}

const STATUS_ICONS = {
  received: CheckCircle2,
  pending:  Clock,
  overdue:  AlertTriangle,
  waived:   XCircle,
};

const STATUS_ORDER = ['overdue', 'pending', 'received', 'waived'];

export default function DocumentRequestsPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch('/api/document-requests');
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests ?? []);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    const res = await fetch(`/api/document-requests/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      toast.success(`Marked as ${status}`);
    } else {
      toast.error('Failed to update');
    }
    setUpdatingId(null);
  }

  const vendors = Array.from(new Map(requests.map((r) => [r.vendor.id, r.vendor.name])).entries());

  const filtered = requests.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterVendor && r.vendor.id !== filterVendor) return false;
    return true;
  });

  const grouped = STATUS_ORDER.reduce<Record<string, DocumentRequest[]>>((acc, s) => {
    acc[s] = filtered.filter((r) => r.status === s);
    return acc;
  }, {});

  const counts = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    overdue: requests.filter((r) => r.status === 'overdue').length,
    received: requests.filter((r) => r.status === 'received').length,
  };

  if (loading) return <div className="skeleton h-48 rounded-xl" />;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Document Requests</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Track outstanding document requests from vendors — mapped to NIST CSF supply chain controls.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'text-[var(--color-text-primary)]' },
          { label: 'Pending', value: counts.pending, color: 'text-amber-400' },
          { label: 'Overdue', value: counts.overdue, color: 'text-rose-400' },
          { label: 'Received', value: counts.received, color: 'text-emerald-400' },
        ].map((s) => (
          <Card key={s.label} className="text-center py-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* NIST Reference Banner */}
      <Card className="border-l-4 border-l-indigo-500/60 bg-indigo-500/5">
        <div className="flex items-start gap-3">
          <BookOpen size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-indigo-300 mb-1">NIST CSF Supply Chain Risk Management (GV.SC / ID.SC)</p>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Document requests are mapped to NIST CSF 2.0 supply chain controls (GV.SC-2, GV.SC-6, GV.SC-7, ID.SC-2–5), ISO 27001:2022 Annex A 5.19–5.22, and ABA guidance on vendor oversight. Collecting these documents demonstrates a formal third-party risk management program aligned to a recognized standard.
            </p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-40 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="received">Received</option>
          <option value="waived">Waived</option>
        </select>
        <select
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
          className="w-52 text-sm"
        >
          <option value="">All vendors</option>
          {vendors.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <CheckCircle2 size={32} className="mx-auto text-emerald-400 opacity-40 mb-3" />
            <p className="text-sm text-[var(--color-text-muted)]">No document requests found.</p>
          </div>
        </Card>
      ) : (
        STATUS_ORDER.map((status) => {
          const group = grouped[status];
          if (group.length === 0) return null;
          const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] ?? Clock;
          const colorClass = docRequestStatusColor(status);
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={colorClass.split(' ')[1]} />
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({group.length})
                </p>
              </div>
              <Card className="p-0 overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Document</th>
                      <th>NIST Reference</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((r) => {
                      const catalog = DOCUMENT_REQUEST_CATALOG.find((c) => c.type === r.documentType);
                      const label = r.label ?? DOC_TYPE_LABELS[r.documentType] ?? r.documentType;
                      return (
                        <tr key={r.id}>
                          <td>
                            <a href={`/vendors/${r.vendor.id}`} className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)] font-medium text-sm">
                              {r.vendor.name}
                            </a>
                            <p className="text-xs text-[var(--color-text-muted)] capitalize">{r.vendor.criticality}</p>
                          </td>
                          <td>
                            <p className="text-sm text-[var(--color-text-primary)]">{label}</p>
                            {catalog && (
                              <button
                                onClick={() => setExpandedRef(expandedRef === r.id ? null : r.id)}
                                className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-indigo-400 mt-0.5"
                              >
                                <span>{catalog.frequency}</span>
                                <ChevronDown size={10} className={expandedRef === r.id ? 'rotate-180' : ''} />
                              </button>
                            )}
                            {expandedRef === r.id && catalog && (
                              <div className="mt-2 p-2 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)] text-xs space-y-1.5">
                                <p className="text-[var(--color-text-secondary)]">{catalog.description}</p>
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {catalog.nistRefs.map((ref) => (
                                    <span key={ref} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-mono">{ref}</span>
                                  ))}
                                  {catalog.otherRefs.map((ref) => (
                                    <span key={ref} className="px-1.5 py-0.5 bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded text-[10px]">{ref}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="text-xs font-mono text-indigo-400">{r.nistRef ?? catalog?.nistRefs[0] ?? '—'}</span>
                          </td>
                          <td className="text-sm text-[var(--color-text-muted)]">
                            {r.dueDate ? formatDate(r.dueDate) : '—'}
                          </td>
                          <td>
                            <Badge className={`text-xs border ${colorClass}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              {status !== 'received' && (
                                <button
                                  onClick={() => updateStatus(r.id, 'received')}
                                  disabled={updatingId === r.id}
                                  className="text-xs px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 transition-colors"
                                >
                                  Received
                                </button>
                              )}
                              {status === 'pending' && (
                                <button
                                  onClick={() => updateStatus(r.id, 'overdue')}
                                  disabled={updatingId === r.id}
                                  className="text-xs px-2 py-0.5 rounded border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 transition-colors"
                                >
                                  Overdue
                                </button>
                              )}
                              {status !== 'waived' && status !== 'received' && (
                                <button
                                  onClick={() => updateStatus(r.id, 'waived')}
                                  disabled={updatingId === r.id}
                                  className="text-xs px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)] disabled:opacity-40 transition-colors"
                                >
                                  Waive
                                </button>
                              )}
                              <a
                                href={`/vendors/${r.vendor.id}`}
                                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                                title="Open vendor"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          );
        })
      )}
    </div>
  );
}
