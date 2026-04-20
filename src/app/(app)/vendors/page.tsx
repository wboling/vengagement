'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Search, Filter, Shield, ExternalLink, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { riskLevelBg, criticalityColor, statusColor, formatDate } from '@/lib/utils';
import { useToast } from '@/lib/store';
import Papa from 'papaparse';

interface Vendor {
  id: string;
  name: string;
  category: string | null;
  criticality: string;
  status: string;
  riskScore: number | null;
  riskLevel: string | null;
  isExempt: boolean;
  primaryContactEmail: string | null;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  _count: { documents: number; questionnaireAssignments: number };
}

const CRITICALITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function VendorsPage() {
  const toast = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [critFilter, setCritFilter] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  async function loadVendors() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (statusFilter) params.set('status', statusFilter);
    if (critFilter) params.set('criticality', critFilter);
    const res = await fetch(`/api/vendors?${params}`);
    const data = await res.json();
    setVendors(data.vendors ?? []);
    setLoading(false);
  }

  useEffect(() => { loadVendors(); }, [search, statusFilter, critFilter]);

  async function handleCsvImport(file: File) {
    const text = await file.text();
    const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    const vendors = result.data.map((row) => ({
      name: row.name || row.Name || row.vendor_name || '',
      legalName: row.legal_name || row.legalName || null,
      website: row.website || null,
      category: row.category || null,
      criticality: (row.criticality || 'medium').toLowerCase(),
      isExempt: row.is_exempt === 'true' || row.isExempt === 'true',
    })).filter((v) => v.name);

    const res = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bulk: true, vendors }),
    });

    if (res.ok) {
      const data = await res.json();
      toast.success(`Imported ${data.count} vendors`);
      loadVendors();
      setImportOpen(false);
    } else {
      toast.error('Import failed');
    }
  }

  const filtered = vendors.sort((a, b) =>
    (CRITICALITY_ORDER[a.criticality as keyof typeof CRITICALITY_ORDER] ?? 99) -
    (CRITICALITY_ORDER[b.criticality as keyof typeof CRITICALITY_ORDER] ?? 99)
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Vendors</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{vendors.length} third-party vendors</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={Upload} onClick={() => setImportOpen(true)}>
            Import
          </Button>
          <Link href="/vendors/new">
            <Button size="sm" icon={Plus}>Add Vendor</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors…"
            style={{ paddingLeft: '32px' }}
            className="h-9 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 text-sm w-36"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
          <option value="offboarding">Offboarding</option>
        </select>
        <select
          value={critFilter}
          onChange={(e) => setCritFilter(e.target.value)}
          className="h-9 text-sm w-36"
        >
          <option value="">All criticality</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 size={32} className="mx-auto text-[var(--color-text-muted)] mb-3 opacity-40" />
            <p className="text-sm text-[var(--color-text-muted)]">No vendors found.</p>
            <Link href="/vendors/new" className="text-xs text-indigo-400 hover:underline mt-1 block">Add your first vendor</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Criticality</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Docs</th>
                  <th>Last Review</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link href={`/vendors/${v.id}`} className="flex items-center gap-2 group">
                        <div className="w-6 h-6 rounded bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0">
                          <Building2 size={10} className="text-[var(--color-text-muted)]" />
                        </div>
                        <div>
                          <p className="text-[var(--color-text-primary)] font-medium group-hover:text-indigo-400 transition-colors text-xs">
                            {v.name}
                          </p>
                          {v.isExempt && <span className="text-xs text-teal-400">Exempt</span>}
                        </div>
                      </Link>
                    </td>
                    <td className="text-xs">
                      {(() => {
                        try {
                          const cats = JSON.parse(v.category ?? '[]');
                          return Array.isArray(cats) && cats.length > 0 ? cats.join(', ') : (v.category || '—');
                        } catch {
                          return v.category || '—';
                        }
                      })()}
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${criticalityColor(v.criticality)}`}>
                        {v.criticality}
                      </span>
                    </td>
                    <td>
                      {v.riskScore != null ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${riskLevelBg(v.riskLevel)}`}>
                          {v.riskScore} · {v.riskLevel}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">Not assessed</span>
                      )}
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="text-xs">{v._count.documents}</td>
                    <td className="text-xs">{v.lastReviewDate ? formatDate(v.lastReviewDate) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Import modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Bulk Import Vendors" size="md">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Upload a CSV file with columns: <code className="text-xs font-mono bg-[var(--color-bg-elevated)] px-1 rounded">name, legal_name, website, category, criticality, is_exempt</code>
          </p>
          <div
            className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500/40 transition-colors"
            onClick={() => document.getElementById('csv-input')?.click()}
          >
            <Upload size={24} className="mx-auto text-[var(--color-text-muted)] mb-2" />
            <p className="text-sm text-[var(--color-text-secondary)]">Click to upload CSV</p>
            <input
              id="csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleCsvImport(e.target.files[0]); }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
