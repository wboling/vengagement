'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitBranch, Plus, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { statusColor, formatDate } from '@/lib/utils';

interface Request {
  id: string; vendorName: string; vendorCategory: string | null;
  estimatedCriticality: string; status: string; currentStep: string;
  requestedAt: string;
  vendor: { id: string; name: string } | null;
  steps: Array<{ stepType: string; stepOrder: number; status: string }>;
}

const STEP_LABELS: Record<string, string> = {
  submission: 'Submitted', security_review: 'Security Review',
  legal_review: 'Legal Review', exec_approval: 'Exec Approval',
  document_collection: 'Documents', questionnaire_assignment: 'Questionnaire', complete: 'Complete',
};

export default function LifecyclePage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { load(); }, [statusFilter]);

  async function load() {
    const params = statusFilter ? `?status=${statusFilter}` : '';
    const res = await fetch(`/api/lifecycle${params}`);
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Vendor Lifecycle</h2>
          <p className="text-sm text-[var(--color-text-muted)]">New vendor onboarding requests</p>
        </div>
        <Link href="/vendors/new">
          <Button size="sm" icon={Plus}>New Request</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {['', 'submitted', 'under_review', 'approved', 'rejected', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
      ) : requests.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <GitBranch size={28} className="mx-auto text-[var(--color-text-muted)] mb-3 opacity-40" />
            <p className="text-sm text-[var(--color-text-muted)]">No vendor requests found.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/lifecycle/${r.id}`}>
              <Card className="hover:border-indigo-500/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{r.vendorName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(r.status)}`}>{r.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {r.vendorCategory ?? 'Unknown category'} · {r.estimatedCriticality} criticality · Submitted {formatDate(r.requestedAt)}
                    </p>
                    {/* Step progress */}
                    <div className="flex items-center gap-1 mt-2">
                      {r.steps.map((step, i) => (
                        <div key={step.stepType} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            step.status === 'completed' ? 'bg-emerald-400' :
                            step.status === 'in_progress' ? 'bg-indigo-400' :
                            step.status === 'blocked' ? 'bg-rose-400' :
                            'bg-[var(--color-bg-elevated)]'
                          }`} />
                          <span className="text-xs text-[var(--color-text-muted)]">{STEP_LABELS[step.stepType]}</span>
                          {i < r.steps.length - 1 && <ChevronRight size={10} className="text-[var(--color-text-muted)]" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[var(--color-text-muted)] flex-shrink-0 ml-4 mt-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
