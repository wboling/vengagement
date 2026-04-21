'use client';

import { useEffect, useState } from 'react';
import { Save, Server, Brain, Bell, Shield, Workflow, Palette, Users, Plus, Trash2, Edit2, Shield as ShieldIcon, KeyRound, Building2, Upload, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/store';
import { useAuth } from '@/lib/auth/context';
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

type Tab = 'smtp' | 'ai' | 'notifications' | 'lifecycle' | 'questionnaire' | 'users' | 'branding' | 'sso' | 'organization';

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
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

  async function testSmtp() {
    if (!settings) return;
    setTestingSmtp(true);
    const res = await fetch('/api/settings/smtp/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (res.ok) toast.success(`Test email sent to ${data.to}`);
    else toast.error(`SMTP test failed: ${data.error}`);
    setTestingSmtp(false);
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

  let branding: {
    primaryColor?: string; secondaryColor?: string; successColor?: string;
    warningColor?: string; dangerColor?: string;
    navHoverBgDark?: string; navHoverBgLight?: string;
    navActiveBgDark?: string; navActiveBgLight?: string;
    logoUrl?: string;
  } = {};
  try { branding = JSON.parse(settings.branding || '{}'); } catch {}

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'organization', label: 'Organization',     icon: Building2 },
    { id: 'smtp',         label: 'Email / SMTP',     icon: Server },
    { id: 'ai',           label: 'AI Configuration', icon: Brain },
    { id: 'notifications',label: 'Notifications',    icon: Bell },
    { id: 'lifecycle',    label: 'Lifecycle Workflow',icon: Workflow },
    { id: 'questionnaire',label: 'Questionnaires',   icon: Shield },
    { id: 'users',        label: 'Users',            icon: Users },
    { id: 'branding',     label: 'Branding & Theme', icon: Palette },
    { id: 'sso',          label: 'SSO / SAML',       icon: KeyRound },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Tenant Settings</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Configure your workspace settings</p>
        </div>
        {tab !== 'users' && tab !== 'sso' && tab !== 'organization' && <Button icon={Save} loading={saving} onClick={save}>Save Changes</Button>}
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

      {tab === 'organization' && <OrganizationPanel />}

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
            <div className="pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={testSmtp}
                disabled={testingSmtp || !settings.smtpHost}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-colors"
              >
                {testingSmtp ? 'Sending…' : 'Send test email'}
              </button>
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                Uses the settings above (unsaved changes included). Sends to your account email address.
              </p>
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

      {tab === 'sso' && <SsoPanel />}

      {tab === 'branding' && (
        <div className="space-y-5">
          {/* Logo */}
          <LogoUploadCard brandingLogoUrl={branding.logoUrl} onUploaded={(url) => {
            const newBranding = { ...branding, logoUrl: url };
            set('branding', JSON.stringify(newBranding));
          }} />

          {/* Colors */}
          <Card>
            <CardTitle className="mb-2">Theme Colors</CardTitle>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">
              Customize the color palette for your workspace. Changes apply live and persist for all users.
            </p>
            <div className="space-y-5">
              {/* Color pickers */}
              {([
                { key: 'primaryColor',   label: 'Primary / Accent',  cssVar: '--color-accent',   defaultVal: '#4f46e5', hint: 'Buttons, active nav text, links' },
                { key: 'secondaryColor', label: 'Secondary / Teal',  cssVar: '--color-teal',     defaultVal: '#0d9488', hint: 'Client cards and secondary highlights' },
                { key: 'successColor',   label: 'Success',           cssVar: '--color-success',  defaultVal: '#10b981', hint: 'Active, approved, received states' },
                { key: 'warningColor',   label: 'Warning',           cssVar: '--color-warning',  defaultVal: '#f59e0b', hint: 'Pending and review states' },
                { key: 'dangerColor',    label: 'Danger / Error',    cssVar: '--color-danger',   defaultVal: '#f43f5e', hint: 'Overdue, critical, error states' },
              ] as const).map(({ key, label, cssVar, defaultVal, hint }) => {
                const val = branding[key as keyof typeof branding] as string ?? defaultVal;
                return (
                  <div key={key}>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-0.5">{label}</label>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">{hint}</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={val}
                        onChange={(e) => {
                          const nb = { ...branding, [key]: e.target.value };
                          set('branding', JSON.stringify(nb));
                          document.documentElement.style.setProperty(cssVar, e.target.value);
                          if (key === 'primaryColor') {
                            document.documentElement.style.setProperty('--color-accent-hover', e.target.value);
                          }
                        }}
                        style={{ width: '44px', height: '32px', padding: '2px' }}
                      />
                      <input
                        value={val}
                        onChange={(e) => {
                          const nb = { ...branding, [key]: e.target.value };
                          set('branding', JSON.stringify(nb));
                          document.documentElement.style.setProperty(cssVar, e.target.value);
                        }}
                        placeholder={defaultVal}
                        className="font-mono text-sm"
                        style={{ maxWidth: '140px' }}
                      />
                      {val !== defaultVal && (
                        <button
                          type="button"
                          onClick={() => {
                            const nb = { ...branding, [key]: defaultVal };
                            set('branding', JSON.stringify(nb));
                            document.documentElement.style.setProperty(cssVar, defaultVal);
                          }}
                          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Nav colors — dual dark/light pickers */}
              <DualModeColorPicker
                label="Active Nav Background"
                hint="Background fill behind the currently selected nav item"
                darkKey="navActiveBgDark"
                lightKey="navActiveBgLight"
                darkDefault="#1a1f3a"
                lightDefault="#eef2ff"
                cssVar="--color-accent-subtle"
                branding={branding}
                onchange={(nb) => set('branding', JSON.stringify(nb))}
              />
              <DualModeColorPicker
                label="Nav Hover Background"
                hint="Background when hovering over nav items and table rows"
                darkKey="navHoverBgDark"
                lightKey="navHoverBgLight"
                darkDefault="#1e2840"
                lightDefault="#f1f5f9"
                cssVar="--color-bg-hover"
                branding={branding}
                onchange={(nb) => set('branding', JSON.stringify(nb))}
              />

              {/* Primary color presets */}
              <div>
                <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Primary color presets</p>
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
                        const nb = { ...branding, primaryColor: color };
                        set('branding', JSON.stringify(nb));
                        document.documentElement.style.setProperty('--color-accent', color);
                        document.documentElement.style.setProperty('--color-accent-hover', color);
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

interface DualModeColorPickerProps {
  label: string;
  hint: string;
  darkKey: string;
  lightKey: string;
  darkDefault: string;
  lightDefault: string;
  cssVar: string;
  branding: Record<string, string | undefined>;
  onchange: (updated: Record<string, string | undefined>) => void;
}

function DualModeColorPicker({ label, hint, darkKey, lightKey, darkDefault, lightDefault, cssVar, branding, onchange }: DualModeColorPickerProps) {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const activeKey = mode === 'dark' ? darkKey : lightKey;
  const activeDefault = mode === 'dark' ? darkDefault : lightDefault;
  const val = branding[activeKey] ?? activeDefault;

  function handleChange(color: string) {
    const nb = { ...branding, [activeKey]: color };
    onchange(nb);
    // Only apply live preview if this mode matches the page's current data-theme
    const pageMode = document.documentElement.getAttribute('data-theme') ?? 'dark';
    if (pageMode === mode) {
      document.documentElement.style.setProperty(cssVar, color);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
        <div className="flex items-center gap-0.5 bg-[var(--color-bg-elevated)] rounded-lg p-0.5 border border-[var(--color-border)]">
          {(['dark', 'light'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors ${
                mode === m
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-2">{hint}</p>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={val}
          onChange={(e) => handleChange(e.target.value)}
          style={{ width: '44px', height: '32px', padding: '2px' }}
        />
        <input
          value={val}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={activeDefault}
          className="font-mono text-sm"
          style={{ maxWidth: '140px' }}
        />
        {val !== activeDefault && (
          <button
            type="button"
            onClick={() => handleChange(activeDefault)}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function OrganizationPanel() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', industry: '', primaryContact: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings/organization').then((r) => r.json()).then((d) => {
      if (d.tenant) setForm({ name: d.tenant.name ?? '', industry: d.tenant.industry ?? '', primaryContact: d.tenant.primaryContact ?? '' });
      setLoading(false);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/settings/organization', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) toast.success('Organization profile saved');
    else toast.error('Failed to save');
    setSaving(false);
  }

  if (loading) return <div className="skeleton h-48 rounded-xl" />;

  return (
    <Card>
      <CardTitle className="mb-2">Organization Profile</CardTitle>
      <p className="text-xs text-[var(--color-text-muted)] mb-5">
        Update your organization name and industry. This name appears in the sidebar header and all system communications.
      </p>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Organization Name *</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Legal LLP" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Industry</label>
          <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Law Firm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Primary Contact</label>
          <input value={form.primaryContact} onChange={(e) => setForm({ ...form, primaryContact: e.target.value })} placeholder="Jane Smith, General Counsel" />
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Organization Profile'}
          </button>
        </div>
      </form>
    </Card>
  );
}

function LogoUploadCard({ brandingLogoUrl, onUploaded }: { brandingLogoUrl?: string; onUploaded: (url: string) => void }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(brandingLogoUrl ?? null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/settings/branding/logo', { method: 'POST', body: fd });
    if (res.ok) {
      const data = await res.json();
      setPreview(data.logoUrl);
      onUploaded(data.logoUrl);
      toast.success('Logo uploaded');
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? 'Upload failed');
    }
    setUploading(false);
  }

  return (
    <Card>
      <CardTitle className="mb-2">Organization Logo</CardTitle>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        Upload your organization logo. Displayed in the sidebar header. PNG, JPG, SVG, or WEBP recommended.
      </p>
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] flex items-center justify-center overflow-hidden flex-shrink-0">
          {preview ? (
            <img src={preview} alt="Logo" className="w-full h-full object-contain p-2" />
          ) : (
            <ImageIcon size={24} className="text-[var(--color-text-muted)] opacity-40" />
          )}
        </div>
        <div className="flex-1">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-text-muted)] text-xs font-medium text-[var(--color-text-secondary)] transition-colors w-fit">
            <Upload size={12} />
            {uploading ? 'Uploading…' : preview ? 'Replace logo' : 'Upload logo'}
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onUploaded('');
              }}
              className="mt-2 text-xs text-[var(--color-text-muted)] hover:text-rose-400"
            >
              Remove logo
            </button>
          )}
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Max 5 MB. Transparent background recommended.</p>
        </div>
      </div>
    </Card>
  );
}

interface SsoConfig {
  authMode: string; forceSso: boolean;
  samlDomain: string | null; samlEntityId: string | null;
  samlAcsUrl: string | null; samlIdpMetadata: string | null;
}

function SsoPanel() {
  const toast = useToast();
  const [cfg, setCfg] = useState<SsoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings/sso').then((r) => r.json()).then((d) => {
      setCfg(d.sso);
      setLoading(false);
    });
  }, []);

  function set<K extends keyof SsoConfig>(k: K, v: SsoConfig[K]) {
    setCfg((s) => s ? { ...s, [k]: v } : s);
  }

  async function save() {
    if (!cfg) return;
    setSaving(true);
    const res = await fetch('/api/settings/sso', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    if (res.ok) toast.success('SSO settings saved');
    else toast.error('Failed to save SSO settings');
    setSaving(false);
  }

  if (loading || !cfg) return <div className="skeleton h-48 rounded-xl" />;

  const isSamlEnabled = cfg.authMode === 'saml' || cfg.authMode === 'both';

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle className="mb-4">SSO / SAML 2.0 Configuration</CardTitle>
        <p className="text-xs text-[var(--color-text-muted)] mb-5">
          Configure SAML 2.0 single sign-on for your organization. Users will authenticate via your Identity Provider (IdP).
          This setting is independent of MFA — email OTP MFA applies to all local logins regardless of SSO mode.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Authentication Mode</label>
            <select value={cfg.authMode} onChange={(e) => set('authMode', e.target.value)}>
              <option value="local">Local only — username/password</option>
              <option value="both">Local + SSO — users may choose</option>
              <option value="saml">SSO only — SAML required</option>
            </select>
            <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
              &ldquo;SSO only&rdquo; redirects all logins to your IdP. Platform admin accounts always retain local access.
            </p>
          </div>

          {isSamlEnabled && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="forceSso"
                checked={cfg.forceSso}
                onChange={(e) => set('forceSso', e.target.checked)}
                style={{ width: 'auto' }}
              />
              <label htmlFor="forceSso" className="text-sm text-[var(--color-text-secondary)]">
                Force SSO — prevent users from signing in with local credentials
              </label>
            </div>
          )}

          {isSamlEnabled && (
            <div className="border-t border-[var(--color-border)] pt-5 space-y-4">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">SAML IdP Details</p>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Email Domain</label>
                <input
                  value={cfg.samlDomain ?? ''}
                  onChange={(e) => set('samlDomain', e.target.value)}
                  placeholder="yourcompany.com"
                />
                <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                  Users with this email domain are redirected to your IdP at login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Entity ID (SP Entity ID)</label>
                <input
                  value={cfg.samlEntityId ?? ''}
                  onChange={(e) => set('samlEntityId', e.target.value)}
                  placeholder="https://your-app.com/saml/metadata"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Assertion Consumer Service (ACS) URL</label>
                <input
                  value={cfg.samlAcsUrl ?? ''}
                  onChange={(e) => set('samlAcsUrl', e.target.value)}
                  placeholder="https://your-app.com/api/auth/saml/callback"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">IdP Metadata XML</label>
                <textarea
                  rows={8}
                  value={cfg.samlIdpMetadata ?? ''}
                  onChange={(e) => set('samlIdpMetadata', e.target.value)}
                  placeholder="Paste your Identity Provider's SAML metadata XML here…"
                  className="font-mono text-xs"
                  style={{ resize: 'vertical' }}
                />
                <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                  Obtain this from your IdP (Okta, Azure AD, Google Workspace, etc.). Contains the IdP certificate and SSO URLs.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save SSO Settings'}
          </button>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-2">MFA — Email OTP</CardTitle>
        <p className="text-xs text-[var(--color-text-muted)]">
          Email one-time passwords are enabled platform-wide. When a user has MFA enabled on their account,
          they are prompted to enter a 6-digit code sent to their email address after each successful password login.
          MFA is configured per-user in the Users tab. It is independent of SSO mode.
        </p>
      </Card>
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
  const { user: me } = useAuth();
  const isPlatformAdmin = me?.role === 'admin';
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer', password: '' });
  const [editForm, setEditForm] = useState({ name: '', role: '', mfaEnabled: false, tenantId: '' });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tmpPassword, setTmpPassword] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    if (isPlatformAdmin) {
      fetch('/api/admin/tenants').then((r) => r.json()).then((d) => setTenants(d.tenants ?? []));
    }
  }, [isPlatformAdmin]);

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
    const payload: Record<string, unknown> = { id: editUser.id, name: editForm.name, role: editForm.role, mfaEnabled: editForm.mfaEnabled };
    if (isPlatformAdmin && editForm.tenantId) payload.tenantId = editForm.tenantId;
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
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
    setEditForm({ name: u.name, role: u.role, mfaEnabled: u.mfaEnabled, tenantId: '' });
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
          {isPlatformAdmin && tenants.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                Move to Tenant <span className="text-[var(--color-text-muted)] font-normal">(platform admin only)</span>
              </label>
              <select value={editForm.tenantId} onChange={(e) => setEditForm({ ...editForm, tenantId: e.target.value })}>
                <option value="">— Keep current tenant —</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">Reassigning a user to a different tenant will immediately revoke their current session.</p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
