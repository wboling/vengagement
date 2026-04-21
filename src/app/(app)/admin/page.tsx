'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Users, Package, FileText, Plus, Trash2, Edit2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/store';
import { formatDate } from '@/lib/utils';

interface Tenant {
  id: string; name: string; industry: string | null; createdAt: string;
  enableVendors: boolean; enableQuestionnaires: boolean; enableDocuments: boolean;
  enableReports: boolean; enableLifecycle: boolean; enableAiReview: boolean;
  _count: { users: number; vendors: number };
}

interface Overview {
  totalTenants: number; totalUsers: number; totalVendors: number;
  totalDocuments: number; activeUsers: number; tenants: Tenant[];
}

export default function AdminPage() {
  const toast = useToast();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tmpPassword, setTmpPassword] = useState<string | null>(null);
  const [form, setForm] = useState({
    tenantName: '', tenantIndustry: '',
    adminEmail: '', adminName: '', adminPassword: '',
  });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState({ name: '', industry: '', primaryContact: '' });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch('/api/admin/overview');
    if (res.ok) setOverview(await res.json());
    setLoading(false);
  }

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tenantName || !form.adminEmail) { toast.error('Tenant name and admin email required'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/tenants', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, adminPassword: form.adminPassword || undefined }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.temporaryPassword) setTmpPassword(data.temporaryPassword);
      else { toast.success('Tenant created'); setAddOpen(false); }
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? 'Failed to create tenant');
    }
    setSaving(false);
  }

  async function deleteTenant(id: string, name: string) {
    if (!confirm(`Delete tenant "${name}" and ALL its data? This cannot be undone.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/tenants?id=${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Tenant deleted'); load(); }
    else toast.error('Failed to delete tenant');
    setDeleting(null);
  }

  function openEdit(t: Tenant) {
    setEditTenant(t);
    setEditForm({ name: t.name, industry: t.industry ?? '', primaryContact: '' });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTenant) return;
    setEditSaving(true);
    const res = await fetch('/api/admin/tenants', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: editTenant.id, name: editForm.name, industry: editForm.industry }),
    });
    if (res.ok) { toast.success('Tenant updated'); setEditTenant(null); load(); }
    else toast.error('Failed to update tenant');
    setEditSaving(false);
  }

  async function toggleFeature(tenantId: string, feature: string, value: boolean) {
    const res = await fetch('/api/admin/tenants', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: tenantId, [feature]: value }),
    });
    if (res.ok) load();
    else toast.error('Failed to update feature flag');
  }

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Platform Overview</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Manage all tenants and platform configuration</p>
        </div>
        <Button icon={Plus} onClick={() => { setForm({ tenantName: '', tenantIndustry: '', adminEmail: '', adminName: '', adminPassword: '' }); setAddOpen(true); setTmpPassword(null); }}>
          New Tenant
        </Button>
      </div>

      {/* Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Tenants', value: overview.totalTenants, icon: Building2 },
            { label: 'Total Users', value: overview.totalUsers, icon: Users },
            { label: 'Active (30d)', value: overview.activeUsers, icon: Users },
            { label: 'Vendors', value: overview.totalVendors, icon: Package },
            { label: 'Documents', value: overview.totalDocuments, icon: FileText },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="text-center">
              <Icon size={18} className="mx-auto text-indigo-400 mb-2" />
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Tenants table */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Tenants</h2>
        <div className="space-y-2">
          {overview?.tenants.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{t.name}</p>
                    {t.industry && <Badge variant="neutral">{t.industry}</Badge>}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {t._count.users} users · {t._count.vendors} vendors · Created {formatDate(t.createdAt)}
                  </p>

                  {/* Feature flags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[
                      ['enableVendors', 'Vendors'],
                      ['enableDocuments', 'Documents'],
                      ['enableQuestionnaires', 'Questionnaires'],
                      ['enableLifecycle', 'Lifecycle'],
                      ['enableReports', 'Reports'],
                      ['enableAiReview', 'AI Review'],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => toggleFeature(t.id, key, !t[key as keyof Tenant])}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                          t[key as keyof Tenant]
                            ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10'
                            : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-indigo-400 transition-colors"
                    title="Edit tenant"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteTenant(t.id, t.name)}
                    disabled={deleting === t.id}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-rose-400 disabled:opacity-40 transition-colors"
                    title="Delete tenant"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit tenant modal */}
      <Modal
        open={!!editTenant}
        onClose={() => setEditTenant(null)}
        title="Edit Tenant"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTenant(null)}>Cancel</Button>
            <Button loading={editSaving} onClick={saveEdit as unknown as React.MouseEventHandler}>Save Changes</Button>
          </>
        }
      >
        <form onSubmit={saveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Tenant Name *</label>
            <input
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Acme Legal LLP"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Industry</label>
            <input
              value={editForm.industry}
              onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
              placeholder="Law Firm"
            />
          </div>
        </form>
      </Modal>

      {/* Add tenant modal */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setTmpPassword(null); }}
        title="New Tenant"
        footer={!tmpPassword ? (
          <><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={createTenant as unknown as React.MouseEventHandler}>Create Tenant</Button></>
        ) : (
          <Button onClick={() => { setAddOpen(false); setTmpPassword(null); }}>Done</Button>
        )}
      >
        {tmpPassword ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-400 font-medium">Tenant created successfully.</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Share this temporary password with the admin:</p>
            <div className="font-mono text-sm bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg border border-[var(--color-border)] select-all">
              {tmpPassword}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">The admin will be prompted to change it on first login.</p>
          </div>
        ) : (
          <form onSubmit={createTenant} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Tenant Name *</label>
                <input required value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} placeholder="Acme Legal LLP" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Industry</label>
                <input value={form.tenantIndustry} onChange={(e) => setForm({ ...form, tenantIndustry: e.target.value })} placeholder="Law Firm" />
              </div>
            </div>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider pt-2">Admin User</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Name</label>
                <input value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} placeholder="Admin Name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Email *</label>
                <input required type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@company.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Password (optional — auto-generated if blank)</label>
              <input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} placeholder="Leave blank to auto-generate" />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
