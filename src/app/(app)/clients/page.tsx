'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Plus, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { statusColor } from '@/lib/utils';
import { useToast } from '@/lib/store';

interface Client {
  id: string;
  name: string;
  matter: string | null;
  type: string;
  status: string;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  _count: { documents: number };
}

const CLIENT_TYPES: Record<string, string> = {
  corporate: 'Corporate',
  litigation: 'Litigation',
  transactional: 'Transactional',
  advisory: 'Advisory',
};

export default function ClientsPage() {
  const toast = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', matter: '', type: 'corporate',
    primaryContactName: '', primaryContactEmail: '', notes: '',
  });

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch('/api/clients');
    if (res.ok) {
      const data = await res.json();
      setClients(data.clients ?? []);
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success('Client added');
      setAddOpen(false);
      setForm({ name: '', matter: '', type: 'corporate', primaryContactName: '', primaryContactEmail: '', notes: '' });
      load();
    } else {
      const d = await res.json();
      toast.error(d.error ?? 'Failed to add client');
    }
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Clients</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {clients.length} client{clients.length !== 1 ? 's' : ''} · Outside Counsel Guidelines are tracked per client
          </p>
        </div>
        <Button size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add Client</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)}
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Briefcase size={32} className="mx-auto text-[var(--color-text-muted)] mb-3 opacity-30" />
            <p className="text-sm text-[var(--color-text-muted)] mb-1">No clients yet.</p>
            <p className="text-xs text-[var(--color-text-muted)]">Add clients to track their Outside Counsel Guidelines.</p>
            <div className="mt-4">
              <Button size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add your first client</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`} className="block group">
              <Card className="h-full transition-colors group-hover:border-[var(--color-accent)]/40">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-teal-subtle)] flex items-center justify-center flex-shrink-0">
                    <Briefcase size={16} className="text-[var(--color-teal)]" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(client.status)}`}>
                    {client.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-0.5 group-hover:text-[var(--color-accent)] transition-colors">
                  {client.name}
                </h3>
                {client.matter && (
                  <p className="text-xs text-[var(--color-text-muted)] font-mono mb-1">{client.matter}</p>
                )}
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">{CLIENT_TYPES[client.type] ?? client.type}</p>

                {client.primaryContactName && (
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">{client.primaryContactName}</p>
                )}

                <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--color-border-subtle)]">
                  <FileText size={11} className="text-[var(--color-text-muted)]" />
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {client._count.documents} guideline{client._count.documents !== 1 ? 's' : ''}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Client"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleAdd}>Add Client</Button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Client Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Apex Industries LLC" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Matter / Reference</label>
              <input value={form.matter} onChange={(e) => setForm({ ...form, matter: e.target.value })} placeholder="ACM-2024-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(CLIENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Primary Contact Name</label>
              <input value={form.primaryContactName} onChange={(e) => setForm({ ...form, primaryContactName: e.target.value })} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Contact Email</label>
              <input type="email" value={form.primaryContactEmail} onChange={(e) => setForm({ ...form, primaryContactEmail: e.target.value })} placeholder="jsmith@client.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Engagement notes…" className="resize-none" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
