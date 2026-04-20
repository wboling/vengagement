'use client';

import { useState } from 'react';
import { BarChart3, Download, FileText, Shield, ClipboardList, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/store';

interface ReportConfig {
  type: string;
  label: string;
  description: string;
  icon: React.ElementType;
  formats: string[];
}

const REPORTS: ReportConfig[] = [
  {
    type: 'vendor-summary',
    label: 'Vendor Summary',
    description: 'Complete list of all vendors with risk scores, criticality, and status.',
    icon: Package,
    formats: ['xlsx', 'pdf', 'csv'],
  },
  {
    type: 'risk-report',
    label: 'Risk Report',
    description: 'Vendor risk assessment results sorted by score. Ideal for executive review.',
    icon: Shield,
    formats: ['xlsx', 'pdf'],
  },
  {
    type: 'document-status',
    label: 'Document Status',
    description: 'All vendor documents with review status, expiry dates, and AI review findings.',
    icon: FileText,
    formats: ['xlsx', 'csv'],
  },
  {
    type: 'questionnaire-status',
    label: 'Questionnaire Status',
    description: 'Questionnaire assignment status by vendor. Highlights overdue and pending items.',
    icon: ClipboardList,
    formats: ['xlsx', 'csv'],
  },
  {
    type: 'audit-package',
    label: 'Audit Package',
    description: 'Comprehensive audit-ready export of all vendor data, documents, and due diligence activities.',
    icon: BarChart3,
    formats: ['xlsx', 'pdf'],
  },
  {
    type: 'compliance-matrix',
    label: 'Compliance Matrix',
    description: 'Cross-reference of required documentation vs. what has been collected per vendor.',
    icon: Shield,
    formats: ['xlsx'],
  },
];

export default function ReportsPage() {
  const toast = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  const [filters, setFilters] = useState({ criticality: '', status: '' });

  async function generateReport(type: string, format: string) {
    setGenerating(`${type}-${format}`);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type, format, filters }),
      });

      if (!res.ok) {
        toast.error('Report generation failed');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Reports</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Generate and export vendor management reports</p>
      </div>

      {/* Global filters */}
      <Card>
        <CardTitle className="mb-3">Report Filters</CardTitle>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Criticality</label>
            <select value={filters.criticality} onChange={(e) => setFilters({ ...filters, criticality: e.target.value })} className="h-8 text-xs w-36">
              <option value="">All</option>
              {['critical','high','medium','low'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="h-8 text-xs w-36">
              <option value="">All</option>
              {['active','inactive','pending','offboarding'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <Card key={r.type}>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <r.icon size={16} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{r.label}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{r.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--color-border)]">
              {r.formats.map((fmt) => (
                <Button
                  key={fmt}
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  loading={generating === `${r.type}-${fmt}`}
                  onClick={() => generateReport(r.type, fmt)}
                >
                  {fmt.toUpperCase()}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
