'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Edit2, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/store';
import { formatDate } from '@/lib/utils';

interface User {
  id: string; name: string; email: string; role: string;
  lastLogin: string | null; mfaEnabled: boolean; createdAt: string;
}

const ROLE_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  admin: 'success', company_admin: 'warning', responder: 'info', viewer: 'neutral',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', company_admin: 'Company Admin', responder: 'Responder', viewer: 'Viewer',
};

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer', password: '' });
  const [editForm, setEditForm] = useState({ name: '', role: '', mfaEnabled: false });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tmpPassword, setTmpPassword] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
    }
    setLoading(false);
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    setSaving(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, password: form.password || undefined }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.temporaryPassword) setTmpPassword(data.temporaryPassword);
      else { toast.success('User created'); setAddOpen(false); }
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? 'Failed to create user');
    }
    setSaving(false);
  }

  async function updateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: editUser.id, ...editForm }),
    });
    if (res.ok) { toast.success('User updated'); setEditUser(null); load(); }
    else toast.error('Failed to update user');
    setSaving(false);
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setDeleting(id);
    const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('User deleted'); load(); }
    else toast.error('Failed to delete user');
    setDeleting(null);
  }

  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({ name: u.name, role: u.role, mfaEnabled: u.mfaEnabled });
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Users</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{users.length} team members</p>
        </div>
        <Button size="sm" icon={Plus} onClick={() => { setForm({ name: '', email: '', role: 'viewer', password: '' }); setAddOpen(true); }}>
          Add User
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : users.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <Users size={28} className="mx-auto text-[var(--color-text-muted)] mb-3 opacity-40" />
            <p className="text-sm text-[var(--color-text-muted)]">No users found.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>MFA</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-[var(--color-text-primary)]">{u.name}</td>
                  <td className="text-[var(--color-text-muted)]">{u.email}</td>
                  <td className="py-2">
                    <Badge variant={ROLE_VARIANTS[u.role] ?? 'neutral'} className="whitespace-nowrap">
                      {ROLE_LABELS[u.role] ?? u.role.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td>
                    {u.mfaEnabled ? (
                      <Shield size={13} className="text-emerald-400" />
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">Off</span>
                    )}
                  </td>
                  <td className="text-[var(--color-text-muted)]">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                  <td className="text-[var(--color-text-muted)]">{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-[var(--color-text-muted)] hover:text-indigo-400">
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        disabled={deleting === u.id}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-rose-400 disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Add user modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setTmpPassword(null); }} title="Add User"
        footer={!tmpPassword ? (
          <><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={addUser as unknown as React.MouseEventHandler}>Create User</Button></>
        ) : (
          <Button onClick={() => { setAddOpen(false); setTmpPassword(null); }}>Done</Button>
        )}>
        {tmpPassword ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-400 font-medium">User created successfully.</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Share this temporary password with the user:</p>
            <div className="font-mono text-sm bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg border border-[var(--color-border)] select-all">
              {tmpPassword}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">The user will be prompted to change it on first login.</p>
          </div>
        ) : (
          <form onSubmit={addUser} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Full Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="viewer">Viewer</option>
                <option value="responder">Responder</option>
                <option value="company_admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Password (optional — auto-generated if blank)</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to auto-generate" />
            </div>
          </form>
        )}
      </Modal>

      {/* Edit user modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User"
        footer={<><Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button><Button loading={saving} onClick={updateUser as unknown as React.MouseEventHandler}>Save</Button></>}>
        <form onSubmit={updateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Full Name</label>
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Role</label>
            <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              <option value="viewer">Viewer</option>
              <option value="responder">Responder</option>
              <option value="company_admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="editMfa" checked={editForm.mfaEnabled} onChange={(e) => setEditForm({ ...editForm, mfaEnabled: e.target.checked })} style={{ width: 'auto' }} />
            <label htmlFor="editMfa" className="text-sm text-[var(--color-text-secondary)]">MFA enabled</label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
