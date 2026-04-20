'use client';

import { useEffect, useState } from 'react';
import { Save, Server, Brain, Bell, Shield, Workflow, Palette, Users, Plus, Trash2, Edit2, Shield as ShieldIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/store';
import { formatDate } from '@/lib/utils';

interface Settings {
  smtpHost: string | null; smtpPort: number | null; smtpSecure: boolean;
  smtpUser: string | null; smtpPass: string | null; smtpFrom: string | null;
  aiEnabled: boolean; aiProvider: string | null; aiApiKey: string | null;
  aiModel: string | null; aiBaseUrl: string | null;
  annualReviewMonth: number; documentExpiryLeadDays: number;
  notifyDocumentExpiry: boolean; notifyQuestionnairesDue: boolean; notifyNewVendorRequests: boolean;
  requireSecurityReview: boolean; requireLegalReview: boolean; requireExecApproval: boolean;
  allowGuestQuestionnaire: boolean; guestLinkExpireDays: number;
  branding: string;
}

type Tab = 'smtp' | 'ai' | 'notifications' | 'lifecycle' | 'questionnaire' | 'users' | 'branding';

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('smtp');

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      setSettings({ ...data.settings, branding: data.settings?.branding ?? '{}' });
    }
    setLoading(false);
  }

  function set(k: keyof Settings, v: unknown) {
    setSettings((s) => s ? { ...s, [k]: v } : s);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) toast.success('Settings saved');
    else toast.error('Failed to save settings');
    setSaving(false);
  }

  if (loading || !settings) return <div className="skeleton h-48 rounded-xl" />;

  let branding: { primaryColor?: string } = {};
  try { branding = JSON.parse(settings.branding || '{}'); } catch {}

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'smtp',         label: 'Email / SMTP',     icon: Server },
    { id: 'ai',           label: 'AI Configuration', icon: Brain },
    { id: 'notifications',label: 'Notifications',    icon: Bell },
    { id: 'lifecycle',    label: 'Lifecycle Workflow',icon: Workflow },
    { id: 'questionnaire',label: 'Questionnaires',   icon: Shield },
    { id: 'users',        label: 'Users',            icon: Users },
    { id: 'branding',     label: 'Branding & Theme', icon: Palette },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Tenant Settings</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Configure your workspace settings</p>
        </div>
        {tab !== 'users' && <Button icon={Save} loading={saving} onClick={save}>Save Changes</Button>}
      </div>

      <div className="flex gap-6 items-start">
        {/* Vertical nav */}
        <nav className="flex-shrink-0 w-44 space-y-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                tab === t.id
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <t.icon size={14} className="flex-shrink-0" />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Content pane */}
        <div className="flex-1 min-w-0">

      {tab === 'smtp' && (
        <Card>
          <CardTitle className="mb-4">Email / SMTP Configuration</CardTitle>
          <p className="text-xs text-[var(--color-text-muted)] mb-5">
            Configure your SMTP relay. Overrides platform defaults. Used for questionnaire invitations, reminders, and approval notifications.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">SMTP Host</label>
                <input value={settings.smtpHost ?? ''} onChange={(e) => set('smtpHost', e.target.value)} placeholder="smtp.yourcompany.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Port</label>
                <input type="number" value={settings.smtpPort ?? ''} onChange={(e) => set('smtpPort', parseInt(e.target.value))} placeholder="587" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">From Address</label>
              <input value={settings.smtpFrom ?? ''} onChange={(e) => set('smtpFrom', e.target.value)} placeholder="Vengagement <noreply@yourcompany.com>" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Username</label>
                <input value={settings.smtpUser ?? ''} onChange={(e) => set('smtpUser', e.target.value)} placeholder="smtp-user" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Password</label>
                <input type="password" value={settings.smtpPass ?? ''} onChange={(e) => set('smtpPass', e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="smtpSecure" checked={settings.smtpSecure} onChange={(e) => set('smtpSecure', e.target.checked)} style={{ width: 'auto' }} />
              <label htmlFor="smtpSecure" className="text-sm text-[var(--color-text-secondary)]">Use SSL/TLS (port 465)</label>
            </div>
          </div>
        </Card>
      )}

      {tab === 'ai' && (
        <Card>
          <CardTitle className="mb-4">AI Document Review</CardTitle>
          <p className="text-xs text-[var(--color-text-muted)] mb-5">
            Enable AI-powered review of contracts, BAAs, NDAs, and other legal documents. Your API key is stored encrypted.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="aiEnabled" checked={settings.aiEnabled} onChange={(e) => set('aiEnabled', e.target.checked)} style={{ width: 'auto' }} />
              <label htmlFor="aiEnabled" className="text-sm text-[var(--color-text-secondary)]">Enable AI document review</label>
            </div>
            {settings.aiEnabled && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">AI Provider</label>
                  <select value={settings.aiProvider ?? ''} onChange={(e) => set('aiProvider', e.target.value)}>
                    <option value="">Select provider…</option>
                    <option value="claude">Anthropic Claude</option>
                    <option value="openai">OpenAI GPT</option>
                    <option value="azure-openai">Azure OpenAI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">API Key</label>
                  <input type="password" value={settings.aiApiKey ?? ''} onChange={(e) => set('aiApiKey', e.target.value)} placeholder="sk-… or Anthropic key" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Model</label>
                  <input value={settings.aiModel ?? ''} onChange={(e) => set('aiModel', e.target.value)} placeholder={settings.aiProvider === 'claude' ? 'claude-sonnet-4-6' : 'gpt-4o'} />
                </div>
                {settings.aiProvider === 'azure-openai' && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Azure OpenAI Base URL</label>
                    <input type="url" value={settings.aiBaseUrl ?? ''} onChange={(e) => set('aiBaseUrl', e.target.value)} placeholder="https://your-resource.openai.azure.com/openai/deployments/gpt-4o" />
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card>
          <CardTitle className="mb-4">Notification Preferences</CardTitle>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Annual Review Month</label>
              <select value={settings.annualReviewMonth} onChange={(e) => set('annualReviewMonth', parseInt(e.target.value))}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Document Expiry Alert Lead Time (days)</label>
              <input type="number" value={settings.documentExpiryLeadDays} onChange={(e) => set('documentExpiryLeadDays', parseInt(e.target.value))} min={7} max={90} />
            </div>
            {[
              { k: 'notifyDocumentExpiry',    label: 'Notify when documents are expiring soon' },
              { k: 'notifyQuestionnairesDue', label: 'Notify when questionnaires are overdue' },
              { k: 'notifyNewVendorRequests', label: 'Notify on new vendor lifecycle requests' },
            ].map(({ k, label }) => (
              <div key={k} className="flex items-center gap-2">
                <input type="checkbox" id={k} checked={settings[k as keyof Settings] as boolean} onChange={(e) => set(k as keyof Settings, e.target.checked)} style={{ width: 'auto' }} />
                <label htmlFor={k} className="text-sm text-[var(--color-text-secondary)]">{label}</label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'lifecycle' && (
        <Card>
          <CardTitle className="mb-4">Vendor Lifecycle Workflow</CardTitle>
          <p className="text-xs text-[var(--color-text-muted)] mb-5">
            Configure the approval steps required when onboarding a new vendor through the lifecycle workflow.
          </p>
          <div className="space-y-3">
            {[
              { k: 'requireSecurityReview', label: 'Require Security Review step' },
              { k: 'requireLegalReview',    label: 'Require Legal Review step' },
              { k: 'requireExecApproval',   label: 'Require Executive Approval step' },
            ].map(({ k, label }) => (
              <div key={k} className="flex items-center gap-2">
                <input type="checkbox" id={k} checked={settings[k as keyof Settings] as boolean} onChange={(e) => set(k as keyof Settings, e.target.checked)} style={{ width: 'auto' }} />
                <label htmlFor={k} className="text-sm text-[var(--color-text-secondary)]">{label}</label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'questionnaire' && (
        <Card>
          <CardTitle className="mb-4">Questionnaire Settings</CardTitle>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="guestQ" checked={settings.allowGuestQuestionnaire} onChange={(e) => set('allowGuestQuestionnaire', e.target.checked)} style={{ width: 'auto' }} />
              <label htmlFor="guestQ" className="text-sm text-[var(--color-text-secondary)]">Allow vendors to fill questionnaires via public link (no account required)</label>
            </div>
            {settings.allowGuestQuestionnaire && (
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Guest Link Expiry (days)</label>
                <input type="number" value={settings.guestLinkExpireDays} onChange={(e) => set('guestLinkExpireDays', parseInt(e.target.value))} min={7} max={365} />
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'users' && <UsersPanel />}

      {tab === 'branding' && (
        <div className="space-y-5">
          <Card>
            <CardTitle className="mb-2">Brand Color</CardTitle>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Set the primary accent color used for buttons, active states, and links. Changes apply immediately and persist for all users.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.primaryColor ?? '#4f46e5'}
                    onChange={(e) => {
                      const newBranding = { ...branding, primaryColor: e.target.value };
                      set('branding', JSON.stringify(newBranding));
                      document.documentElement.style.setProperty('--color-accent', e.target.value);
                    }}
                    style={{ width: '48px', height: '36px', padding: '2px', cursor: 'pointer' }}
                  />
                  <input
                    value={branding.primaryColor ?? '#4f46e5'}
                    onChange={(e) => {
                      const newBranding = { ...branding, primaryColor: e.target.value };
                      set('branding', JSON.stringify(newBranding));
                      document.documentElement.style.setProperty('--color-accent', e.target.value);
                    }}
                    placeholder="#4f46e5"
                    className="flex-1 font-mono text-sm"
                    style={{ maxWidth: '160px' }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Quick presets</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Indigo', color: '#4f46e5' },
                    { label: 'Violet', color: '#7c3aed' },
                    { label: 'Blue', color: '#2563eb' },
                    { label: 'Teal', color: '#0d9488' },
                    { label: 'Emerald', color: '#059669' },
                    { label: 'Rose', color: '#e11d48' },
                    { label: 'Slate', color: '#475569' },
                  ].map(({ label, color }) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        const newBranding = { ...branding, primaryColor: color };
                        set('branding', JSON.stringify(newBranding));
                        document.documentElement.style.setProperty('--color-accent', color);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-text-muted)] text-xs text-[var(--color-text-secondary)] transition-colors"
                    >
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
        </div>{/* end content pane */}
      </div>{/* end flex row */}
    </div>
  );
}

interface UserEntry {
  id: string; name: string; email: string; role: string;
  lastLogin: string | null; mfaEnabled: boolean; createdAt: string;
}

const ROLE_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  admin: 'success', company_admin: 'warning', responder: 'info', viewer: 'neutral',
};

function UsersPanel() {
  const toast = useToast();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer', password: '' });
  const [editForm, setEditForm] = useState({ name: '', role: '', mfaEnabled: false });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tmpPassword, setTmpPassword] = useState<string | null>(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
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
      loadUsers();
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
    if (res.ok) { toast.success('User updated'); setEditUser(null); loadUsers(); }
    else toast.error('Failed to update user');
    setSaving(false);
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setDeleting(id);
    const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('User deleted'); loadUsers(); }
    else toast.error('Failed to delete user');
    setDeleting(null);
  }

  function openEdit(u: UserEntry) {
    setEditUser(u);
    setEditForm({ name: u.name, role: u.role, mfaEnabled: u.mfaEnabled });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">{users.length} team members</p>
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
                  <td>
                    <Badge variant={ROLE_VARIANTS[u.role] ?? 'neutral'}>
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td>
                    {u.mfaEnabled ? (
                      <ShieldIcon size={13} className="text-emerald-400" />
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
