'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/store';
import { DOCUMENT_REQUEST_CATALOG } from '@/lib/document-request-catalog';
import { DOC_TYPE_LABELS } from '@/lib/utils';

interface PendingUpload {
  file: File;
  documentType: string;
  name: string;
}

interface Questionnaire {
  id: string;
  name: string;
  description: string | null;
}

const CATEGORIES = ['SaaS', 'IaaS', 'PaaS', 'Professional Services', 'Hardware', 'Managed Services', 'Legal Tech', 'eDiscovery', 'CRM', 'Cloud', 'Security', 'Productivity', 'Other'];

const UPLOAD_DOC_TYPES = [
  { value: 'Contract', label: 'Contract / MSA' },
  { value: 'BAA', label: 'Business Associate Agreement (BAA)' },
  { value: 'NDA', label: 'NDA' },
  { value: 'DPA', label: 'Data Processing Agreement (DPA)' },
  { value: 'SOC2Report', label: 'SOC 2 Report' },
  { value: 'ISO27001Cert', label: 'ISO 27001 Certificate' },
  { value: 'PenTestReport', label: 'Pen Test Report' },
  { value: 'Other', label: 'Other' },
];

export default function NewVendorPage() {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [uploadType, setUploadType] = useState('Contract');

  const [form, setForm] = useState({
    name: '', legalName: '', website: '', description: '',
    categories: [] as string[],
    criticality: 'medium', status: 'active',
    isExempt: false, exemptReason: '', trustCenterUrl: '',
    primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '',
    techContactName: '', techContactEmail: '', techContactPhone: '',
    processesPII: false, processesPHI: false, processesFinancial: false,
    processesConfidentialFirmData: false, processesConfidentialClientData: false,
    dataLocation: '', contractStartDate: '', contractEndDate: '',
    notes: '',
    useLifecycle: false,
    questionnaireId: '',
    questionnaireDueDate: '',
    sendQuestionnaireEmail: false,
    documentRequests: [] as string[],
  });

  function set(k: string, v: unknown) { setForm((f) => ({ ...f, [k]: v })); }

  useEffect(() => {
    fetch('/api/questionnaires')
      .then((r) => r.json())
      .then((d) => {
        const list: Questionnaire[] = d.questionnaires ?? [];
        // Also include built-in questionnaires that are not yet in DB
        import('@/lib/data-questionnaires').then(({ BUILT_IN_QUESTIONNAIRES }) => {
          const builtInMapped = BUILT_IN_QUESTIONNAIRES.map((q) => ({
            id: q.id,
            name: q.name,
            description: q.description ?? null,
          }));
          const ids = new Set(list.map((q) => q.id));
          const merged = [...list, ...builtInMapped.filter((q) => !ids.has(q.id))];
          setQuestionnaires(merged);
        });
      });
  }, []);

  function addFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploads((prev) => [...prev, { file, documentType: uploadType, name: file.name }]);
    e.target.value = '';
  }

  function removeUpload(i: number) {
    setUploads((prev) => prev.filter((_, idx) => idx !== i));
  }

  function toggleDocRequest(type: string) {
    set('documentRequests', form.documentRequests.includes(type)
      ? form.documentRequests.filter((t) => t !== type)
      : [...form.documentRequests, type]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Vendor name is required'); return; }
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    if (form.categories.length === 0) { toast.error('Select at least one category'); return; }
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
      else toast.error('Submission failed');
      setSaving(false);
      return;
    }

    // 1. Create vendor
    const res = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        category: JSON.stringify(form.categories),
        contractStartDate: form.contractStartDate || null,
        contractEndDate: form.contractEndDate || null,
      }),
    });

    if (!res.ok) {
      toast.error('Failed to create vendor');
      setSaving(false);
      return;
    }

    const { vendor } = await res.json();

    // 2. Upload any attached files
    for (const u of uploads) {
      const fd = new FormData();
      fd.append('file', u.file);
      fd.append('vendorId', vendor.id);
      fd.append('documentType', u.documentType);
      fd.append('name', u.name);
      await fetch('/api/documents/upload', { method: 'POST', body: fd }).catch(console.error);
    }

    // 3. Assign questionnaire if selected
    if (form.questionnaireId) {
      await fetch(`/api/questionnaires/${form.questionnaireId}/assign`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          dueDate: form.questionnaireDueDate || null,
          vendorContactName: form.primaryContactName || null,
          vendorContactEmail: form.primaryContactEmail || null,
          sendEmail: form.sendQuestionnaireEmail,
          cycle: 'adhoc',
        }),
      }).catch(console.error);
    }

    // 4. Create document requests
    if (form.documentRequests.length > 0) {
      await fetch('/api/document-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          requests: form.documentRequests.map((type) => ({ documentType: type })),
        }),
      }).catch(console.error);
    }

    toast.success('Vendor created');
    router.push(`/vendors/${vendor.id}`);
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
              key={String(opt.v)} type="button"
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

        {/* Basic Information */}
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
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Description *</label>
              <textarea
                required value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3} placeholder="What does this vendor provide and how does the firm use their services?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Categories * (select all that apply)</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-[var(--color-border)] rounded-md bg-[var(--color-bg-elevated)] min-h-[38px]">
                  {CATEGORIES.map((c) => (
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
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Criticality</label>
                  <select value={form.criticality} onChange={(e) => set('criticality', e.target.value)}>
                    {['critical', 'high', 'medium', 'low'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Trust Center URL</label>
                  <input type="url" value={form.trustCenterUrl} onChange={(e) => set('trustCenterUrl', e.target.value)} placeholder="https://trust.acme.com" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {!form.useLifecycle && (
          <>
            {/* Exempt Vendor */}
            <Card>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Exempt Vendor</p>
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="exempt" checked={form.isExempt} onChange={(e) => set('isExempt', e.target.checked)} style={{ width: 'auto' }} />
                <label htmlFor="exempt" className="text-sm text-[var(--color-text-secondary)]">
                  This vendor is exempt from standard assessment (e.g., Microsoft, AWS, Google)
                </label>
              </div>
              {form.isExempt && (
                <div className="space-y-3">
                  <input value={form.exemptReason} onChange={(e) => set('exemptReason', e.target.value)} placeholder="Reason for exemption (e.g., major cloud provider with SOC 2 + ISO 27001)" />
                </div>
              )}
            </Card>

            {/* Data Handling */}
            <Card>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Data Handling</p>
              <div className="space-y-2">
                {[
                  { k: 'processesPII', label: 'Processes Personally Identifiable Information (PII)' },
                  { k: 'processesPHI', label: 'Processes Protected Health Information (PHI / HIPAA)' },
                  { k: 'processesFinancial', label: 'Processes financial / payment data' },
                  { k: 'processesConfidentialFirmData', label: 'Accesses or processes confidential firm data (attorney work product, firm strategy, personnel)' },
                  { k: 'processesConfidentialClientData', label: 'Accesses or processes confidential client data (attorney-client privileged materials, client matters)' },
                ].map(({ k, label }) => (
                  <div key={k} className="flex items-center gap-2">
                    <input type="checkbox" id={k} checked={form[k as keyof typeof form] as boolean} onChange={(e) => set(k, e.target.checked)} style={{ width: 'auto' }} />
                    <label htmlFor={k} className="text-sm text-[var(--color-text-secondary)]">{label}</label>
                  </div>
                ))}
              </div>
            </Card>

            {/* Primary Contact */}
            <Card>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Primary Contact</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Full Name</label>
                  <input value={form.primaryContactName} onChange={(e) => set('primaryContactName', e.target.value)} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Email</label>
                  <input type="email" value={form.primaryContactEmail} onChange={(e) => set('primaryContactEmail', e.target.value)} placeholder="jane@acme.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Phone</label>
                  <input value={form.primaryContactPhone} onChange={(e) => set('primaryContactPhone', e.target.value)} placeholder="+1 555-000-0000" />
                </div>
              </div>
            </Card>

            {/* Technical Contact */}
            <Card>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Technical Contact</p>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">Optional — security/IT point of contact for questionnaires and incident escalation</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Full Name</label>
                  <input value={form.techContactName} onChange={(e) => set('techContactName', e.target.value)} placeholder="Alex Tech" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Email</label>
                  <input type="email" value={form.techContactEmail} onChange={(e) => set('techContactEmail', e.target.value)} placeholder="security@acme.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Phone</label>
                  <input value={form.techContactPhone} onChange={(e) => set('techContactPhone', e.target.value)} placeholder="+1 555-000-0001" />
                </div>
              </div>
            </Card>

            {/* Contract Details */}
            <Card>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Contract Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Contract Start Date</label>
                  <input type="date" value={form.contractStartDate} onChange={(e) => set('contractStartDate', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Contract End Date</label>
                  <input type="date" value={form.contractEndDate} onChange={(e) => set('contractEndDate', e.target.value)} />
                </div>
              </div>
            </Card>

            {/* Document Uploads */}
            <Card>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Upload Documents</p>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">Attach the contract, BAA, or any other relevant files. Files upload after the vendor is created.</p>
              <div className="flex gap-2 mb-3">
                <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="flex-1 text-sm">
                  {UPLOAD_DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <Upload size={13} />
                  Choose File
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={addFile} />
              </div>
              {uploads.length > 0 && (
                <div className="space-y-1.5">
                  {uploads.map((u, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)]">
                      <FileText size={13} className="text-[var(--color-text-muted)] flex-shrink-0" />
                      <span className="flex-1 text-xs text-[var(--color-text-primary)] truncate">{u.name}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{DOC_TYPE_LABELS[u.documentType] ?? u.documentType}</span>
                      <button type="button" onClick={() => removeUpload(i)} className="p-0.5 text-[var(--color-text-muted)] hover:text-rose-400">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Questionnaire & Document Requests — only for non-exempt vendors */}
            {!form.isExempt && (
              <>
                <Card>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Send Questionnaire</p>
                  <p className="text-xs text-[var(--color-text-muted)] mb-4">Optionally assign a security questionnaire to this vendor upon creation.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Questionnaire</label>
                      <select value={form.questionnaireId} onChange={(e) => set('questionnaireId', e.target.value)}>
                        <option value="">— None —</option>
                        {questionnaires.map((q) => (
                          <option key={q.id} value={q.id}>{q.name}</option>
                        ))}
                      </select>
                    </div>
                    {form.questionnaireId && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Due Date</label>
                          <input type="date" value={form.questionnaireDueDate} onChange={(e) => set('questionnaireDueDate', e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="sendEmail" checked={form.sendQuestionnaireEmail} onChange={(e) => set('sendQuestionnaireEmail', e.target.checked)} style={{ width: 'auto' }} />
                          <label htmlFor="sendEmail" className="text-sm text-[var(--color-text-secondary)]">
                            Send invitation email to primary contact
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                <Card>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Document Requests</p>
                  <p className="text-xs text-[var(--color-text-muted)] mb-4">
                    Select documents to formally request from this vendor. Requests are tracked in the Document Requests dashboard and mapped to NIST CSF supply chain controls.
                  </p>
                  <div className="space-y-2">
                    {DOCUMENT_REQUEST_CATALOG.map((doc) => (
                      <label key={doc.type} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-colors" style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={form.documentRequests.includes(doc.type)}
                          onChange={() => toggleDocRequest(doc.type)}
                          style={{ width: 'auto', marginTop: '2px', flexShrink: 0 }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{doc.label}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{doc.description}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {doc.nistRefs.slice(0, 2).map((ref) => (
                              <span key={ref} className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">{ref}</span>
                            ))}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </>
        )}

        {/* Notes */}
        <Card>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Notes</p>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Internal notes about this vendor…" />
        </Card>

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
