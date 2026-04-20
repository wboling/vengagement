'use client';

import { useEffect, useState } from 'react';
import { Building2, FileText, ClipboardList, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { riskLevelBg, formatDate, statusColor } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';
import Link from 'next/link';

interface DashboardData {
  vendorCounts: { total: number; critical: number; high: number; medium: number; low: number };
  docCounts: { total: number; pending: number; expiringSoon: number };
  questionnaireStats: { pending: number; overdue: number };
  lifecycleStats: { pending: number };
  recentVendors: Array<{ id: string; name: string; criticality: string; riskLevel: string | null; riskScore: number | null; status: string }>;
  pendingDocuments: Array<{ id: string; name: string; vendorName: string | null; documentType: string; expiresAt: string | null }>;
}

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [vendorsRes, docsRes, assignmentsRes, lifecycleRes] = await Promise.all([
          fetch('/api/vendors'),
          fetch('/api/documents'),
          fetch('/api/assignments?status=pending,in_progress'),
          fetch('/api/lifecycle?status=submitted,under_review'),
        ]);

        const [vendorsData, docsData, assignmentsData, lifecycleData] = await Promise.all([
          vendorsRes.ok ? vendorsRes.json() : { vendors: [] },
          docsRes.ok ? docsRes.json() : { documents: [] },
          assignmentsRes.ok ? assignmentsRes.json() : { assignments: [] },
          lifecycleRes.ok ? lifecycleRes.json() : { requests: [] },
        ]);

        const vendors = vendorsData.vendors ?? [];
        const docs = docsData.documents ?? [];
        const assignments = assignmentsData.assignments ?? [];
        const lifecycleRequests = lifecycleData.requests ?? [];

        const now = new Date();
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        setData({
          vendorCounts: {
            total: vendors.length,
            critical: vendors.filter((v: { criticality: string }) => v.criticality === 'critical').length,
            high: vendors.filter((v: { criticality: string }) => v.criticality === 'high').length,
            medium: vendors.filter((v: { criticality: string }) => v.criticality === 'medium').length,
            low: vendors.filter((v: { criticality: string }) => v.criticality === 'low').length,
          },
          docCounts: {
            total: docs.length,
            pending: docs.filter((d: { reviewStatus: string }) => d.reviewStatus === 'pending').length,
            expiringSoon: docs.filter((d: { expiresAt: string | null }) => {
              if (!d.expiresAt) return false;
              const exp = new Date(d.expiresAt);
              return exp >= now && exp <= thirtyDays;
            }).length,
          },
          questionnaireStats: {
            pending: assignments.length,
            overdue: assignments.filter((a: { dueDate: string | null }) => a.dueDate && new Date(a.dueDate) < now).length,
          },
          lifecycleStats: { pending: lifecycleRequests.length },
          recentVendors: vendors.slice(0, 6),
          pendingDocuments: docs
            .filter((d: { reviewStatus: string; expiresAt: string | null }) =>
              d.reviewStatus === 'pending' || (d.expiresAt && new Date(d.expiresAt) <= thirtyDays)
            )
            .slice(0, 5)
            .map((d: { id: string; name: string; vendor: { name: string } | null; documentType: string; expiresAt: string | null }) => ({
              id: d.id,
              name: d.name,
              vendorName: d.vendor?.name ?? null,
              documentType: d.documentType,
              expiresAt: d.expiresAt,
            })),
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const d = data!;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
          Good {getTimeOfDay()}, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          {tenant?.name} · Vendor Risk Dashboard
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Vendors"
          value={d.vendorCounts.total}
          icon={Building2}
          sub={`${d.vendorCounts.critical} critical · ${d.vendorCounts.high} high`}
        />
        <StatCard
          label="Documents"
          value={d.docCounts.total}
          icon={FileText}
          sub={d.docCounts.pending > 0 ? `${d.docCounts.pending} pending review` : 'All reviewed'}
          accent={d.docCounts.pending > 0 ? 'bg-amber-500/10' : undefined}
        />
        <StatCard
          label="Questionnaires"
          value={d.questionnaireStats.pending}
          icon={ClipboardList}
          sub={d.questionnaireStats.overdue > 0 ? `${d.questionnaireStats.overdue} overdue` : 'Pending response'}
          accent={d.questionnaireStats.overdue > 0 ? 'bg-rose-500/10' : undefined}
        />
        <StatCard
          label="Lifecycle Requests"
          value={d.lifecycleStats.pending}
          icon={Clock}
          sub="Awaiting review"
          accent={d.lifecycleStats.pending > 0 ? 'bg-amber-500/10' : undefined}
        />
      </div>

      {/* Risk breakdown + recent vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <Link href="/vendors" className="text-xs text-indigo-400 hover:underline">View all</Link>
          </CardHeader>
          <div className="space-y-2">
            {[
              { label: 'Critical', count: d.vendorCounts.critical, color: 'bg-rose-500', bg: 'bg-rose-500/10' },
              { label: 'High',     count: d.vendorCounts.high,     color: 'bg-orange-500', bg: 'bg-orange-500/10' },
              { label: 'Medium',   count: d.vendorCounts.medium,   color: 'bg-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Low',      count: d.vendorCounts.low,      color: 'bg-emerald-500', bg: 'bg-emerald-500/10' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-muted)] w-14">{row.label}</span>
                <div className="flex-1 h-2 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{ width: d.vendorCounts.total > 0 ? `${(row.count / d.vendorCounts.total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs font-medium text-[var(--color-text-secondary)] w-6 text-right">{row.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent vendors */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vendors by Risk</CardTitle>
            <Link href="/vendors/new" className="text-xs text-indigo-400 hover:underline">+ Add vendor</Link>
          </CardHeader>
          <div className="space-y-1">
            {d.recentVendors.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">No vendors yet. <Link href="/vendors/new" className="text-indigo-400 hover:underline">Add one.</Link></p>
            ) : (
              d.recentVendors.map((v) => (
                <Link
                  key={v.id}
                  href={`/vendors/${v.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center">
                    <Building2 size={12} className="text-[var(--color-text-muted)]" />
                  </div>
                  <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">{v.name}</span>
                  {v.riskLevel ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${riskLevelBg(v.riskLevel)}`}>
                      {v.riskScore} · {v.riskLevel}
                    </span>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${riskLevelBg(v.criticality)}`}>
                      {v.criticality}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Pending documents */}
      {d.pendingDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents Needing Attention</CardTitle>
            <Link href="/documents" className="text-xs text-indigo-400 hover:underline">View all</Link>
          </CardHeader>
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Vendor</th>
                <th>Type</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {d.pendingDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td className="text-[var(--color-text-primary)] font-medium">{doc.name}</td>
                  <td>{doc.vendorName ?? '—'}</td>
                  <td><span className="font-mono text-xs">{doc.documentType}</span></td>
                  <td className={doc.expiresAt && new Date(doc.expiresAt) < new Date() ? 'text-rose-400' : 'text-amber-400'}>
                    {doc.expiresAt ? formatDate(doc.expiresAt) : 'Pending review'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
