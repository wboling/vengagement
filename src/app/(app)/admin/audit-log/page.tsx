'use client';

import { useEffect, useState } from 'react';
import { ScrollText, RefreshCw, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/store';

interface LogEntry {
  id: string;
  tenantId: string | null;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  resourceName: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  tenant: { name: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  update: 'text-[var(--color-accent)] bg-[var(--color-accent-subtle)] border-[var(--color-accent)]/20',
  delete: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  approve: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  reject: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  submit: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  upload: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
  review: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  login: 'text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] border-[var(--color-border)]',
  export: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AuditLogPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ tenantId: '', resource: '', action: '' });
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/tenants').then(r => r.json()).then(d => setTenants(d.tenants ?? []));
  }, []);

  useEffect(() => { load(); }, [filters]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.tenantId) params.set('tenantId', filters.tenantId);
    if (filters.resource) params.set('resource', filters.resource);
    if (filters.action) params.set('action', filters.action);
    const res = await fetch(`/api/admin/audit-log?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs ?? []);
    } else {
      toast.error('Failed to load audit log');
    }
    setLoading(false);
  }

  const resources = ['vendor', 'document', 'client', 'user', 'settings', 'lifecycle', 'questionnaire', 'report'];
  const actions = ['create', 'update', 'delete', 'upload', 'review', 'submit', 'approve', 'reject', 'export', 'login'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Audit Log</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{logs.length} recent entries</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} size="sm" onClick={load} loading={loading}>Refresh</Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap">Tenant</label>
            <div className="relative">
              <select value={filters.tenantId} onChange={(e) => setFilters({ ...filters, tenantId: e.target.value })} className="h-8 text-xs w-44 pr-7 appearance-none">
                <option value="">All Tenants</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap">Resource</label>
            <div className="relative">
              <select value={filters.resource} onChange={(e) => setFilters({ ...filters, resource: e.target.value })} className="h-8 text-xs w-36 pr-7 appearance-none">
                <option value="">All Resources</option>
                {resources.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap">Action</label>
            <div className="relative">
              <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="h-8 text-xs w-32 pr-7 appearance-none">
                <option value="">All Actions</option>
                {actions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            </div>
          </div>
          {(filters.tenantId || filters.resource || filters.action) && (
            <button onClick={() => setFilters({ tenantId: '', resource: '', action: '' })} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">Clear</button>
          )}
        </div>
      </Card>

      {/* Log table */}
      <Card padding="none">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText size={28} className="mx-auto text-[var(--color-text-muted)] mb-3 opacity-40" />
            <p className="text-sm text-[var(--color-text-muted)]">No audit log entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Tenant</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Name / ID</th>
                  <th>IP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <>
                    <tr key={log.id}>
                      <td className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{fmt(log.createdAt)}</td>
                      <td className="text-xs">{log.tenant?.name ?? '—'}</td>
                      <td className="text-xs">{log.userEmail ?? '—'}</td>
                      <td className="text-xs text-[var(--color-text-muted)]">{log.userRole ?? '—'}</td>
                      <td>
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${ACTION_COLORS[log.action] ?? 'text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] border-[var(--color-border)]'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="text-xs font-medium text-[var(--color-text-primary)]">{log.resource}</td>
                      <td className="text-xs text-[var(--color-text-secondary)]">
                        {log.resourceName ?? log.resourceId ?? '—'}
                      </td>
                      <td className="text-xs text-[var(--color-text-muted)] font-mono">{log.ipAddress ?? '—'}</td>
                      <td>
                        {log.details && (
                          <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                            {expanded === log.id ? '▲' : '▼'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === log.id && log.details && (
                      <tr key={`${log.id}-details`}>
                        <td colSpan={9} className="bg-[var(--color-bg-elevated)] px-4 py-3">
                          <pre className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap font-mono">
                            {JSON.stringify(JSON.parse(log.details), null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
