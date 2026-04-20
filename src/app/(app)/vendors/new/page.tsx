'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/store';

export default function NewVendorPage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', legalName: '', website: '', description: '', categories: [] as string[],
    criticality: 'medium', status: 'active',
    isExempt: false, exemptReason: '', trustCenterUrl: '',
    primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '',
    processesPII: false, processesPHI: false, processesFinancial: false,
    dataLocation: '', contractStartDate: '', contractEndDate: '', contractValue: '',
    notes: '',
    useLifecycle: false,
  });

  function set(k: string, v: unknown) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Vendor name is required'); return; }
    setSaving(true);

    if (form.useLifecycle) {
      const res = await fetch('/api/lifecycle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          vendorName: form.name,
          vendorLegalName: form.legalName || undefined,
          vendorWebsite: form.website || undefined,
          vendorDescription: form.description || undefined,
          vendorCategory: form.categories.join(', ') || undefined,
          estimatedCriticality: form.criticality,
          submit: true,
        }),
      });
      if (res.ok) { toast.success('Lifecycle request submitted'); router.push('/lifecycle'); }
      else { toast.error('Submission failed'); }
    } else {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category: JSON.stringify(form.categories),
          contractValue: form.contractValue ? parseFloat(form.contractValue) : null,
          contractStartDate: form.contractStartDate || null,
          contractEndDate: form.contractEndDate || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Vendor created');
        router.push(`/vendors/${data.vendor.id}`);
      } else {
        toast.error('Failed to create vendor');
      }
    }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/vendors"><Button variant="ghost" size="sm" icon={ArrowLeft}>Back</Button></Link>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Add New Vendor</h2>
      </div>

      {/* Workflow choice */}
      <Card>
        <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">How would you like to add this vendor?</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: false, label: 'Direct Add', desc: 'Add immediately (admin/manual import)' },
            { v: true, label: 'Lifecycle Request', desc: 'Submit through approval workflow' },
          ].map((opt) => (
            <button
              key={String(opt.v)}
              type="button"
              onClick={() => set('useLifecycle', opt.v)}
              className={`text-left p-3 rounded-lg border transition-all ${
                form.useLifecycle === opt.v
                  ? 'border-indigo-500/60 bg-indigo-500/10'
                  : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
              }`}
            >
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{opt.label}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Basic Information</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Vendor Name *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Acme Corp" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Legal Name</label>
                <input value={form.legalName} onChange={(e) => set('legalName', e.target.value)} placeholder="Acme Corporation Inc." />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Website</label>
                <input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://acme.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Trust Center URL</label>
                <input type="url" value={form.trustCenterUrl} onChange={(e) => set('trustCenterUrl', e.target.value)} placeholder="https://trust.acme.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Categories (select multiple)</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-elevated)] min-h-[36px]">
                  {['SaaS','IaaS','PaaS','Professional Services','Hardware','Managed Services','Legal Tech','eDiscovery','CRM','Cloud','Security','Productivity','Other'].map((c) => (
                    <button
                      key={c} type="button"
                      onClick={() => {
                        const cats = form.categories.includes(c)
                          ? form.categories.filter((x) => x !== c)
                          : [...form.categories, c];
                        set('categories', cats);
                      }}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        form.categories.includes(c)
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                          : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Criticality</label>
                <select value={form.criticality} onChange={(e) => set('criticality', e.target.value)}>
                  {['critical','high','medium','low'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="What does this vendor provide?" />
            </div>
          </div>
        </Card>

        {!form.useLifecycle && (
          <>
            <Card>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Exempt Vendor</p>
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="exempt" checked={form.isExempt} onChange={(e) => set('isExempt', e.target.checked)} style={{ width: 'auto' }} />
                <label htmlFor="exempt" className="text-sm text-[var(--color-text-secondary)]">This is an exempt vendor (e.g., Microsoft, AWS, Google)</label>
              </div>
              {form.isExempt && (
                <div className="space-y-3">
                  <input value={form.exemptReason} onChange={(e) => set('exemptReason', e.target.value)} placeholder="Reason for exemption" />
                  <input type="url" value={form.trustCenterUrl} onChange={(e) => set('trustCenterUrl', e.target.value)} placeholder="Trust center URL (https://…)" />
                </div>
              )}
            </Card>

            <Card>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Data Handling</p>
              <div className="space-y-2">
                {[
                  { k: 'processesPII', label: 'Processes Personally Identifiable Information (PII)' },
                  { k: 'processesPHI', label: 'Processes Protected Health Information (PHI/HIPAA)' },
                  { k: 'processesFinancial', label: 'Processes financial data' },
                ].map(({ k, label }) => (
                  <div key={k} className="flex items-center gap-2">
                    <input type="checkbox" id={k} checked={form[k as keyof typeof form] as boolean} onChange={(e) => set(k, e.target.checked)} style={{ width: 'auto' }} />
                    <label htmlFor={k} className="text-sm text-[var(--color-text-secondary)]">{label}</label>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Primary Contact</p>
              <div className="grid grid-cols-3 gap-3">
                <input value={form.primaryContactName} onChange={(e) => set('primaryContactName', e.target.value)} placeholder="Full name" />
                <input type="email" value={form.primaryContactEmail} onChange={(e) => set('primaryContactEmail', e.target.value)} placeholder="Email" />
                <input value={form.primaryContactPhone} onChange={(e) => set('primaryContactPhone', e.target.value)} placeholder="Phone" />
              </div>
            </Card>

            <Card>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Contract Details</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Start Date</label>
                  <input type="date" value={form.contractStartDate} onChange={(e) => set('contractStartDate', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">End Date</label>
                  <input type="date" value={form.contractEndDate} onChange={(e) => set('contractEndDate', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Contract Value ($)</label>
                  <input type="number" value={form.contractValue} onChange={(e) => set('contractValue', e.target.value)} placeholder="0.00" />
                </div>
              </div>
            </Card>
          </>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/vendors"><Button variant="secondary">Cancel</Button></Link>
          <Button type="submit" loading={saving}>
            {form.useLifecycle ? 'Submit Request' : 'Create Vendor'}
          </Button>
        </div>
      </form>
    </div>
  );
}
