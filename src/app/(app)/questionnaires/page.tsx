'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus, Book, Upload, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/store';

interface Questionnaire {
  id: string; name: string; description: string | null; type: string;
  version: string; isBuiltIn: boolean; sections: string;
}

const TYPE_LABELS: Record<string, string> = {
  'sig-lite': 'SIG Lite', 'sig-core': 'SIG Core',
  'dpa': 'Data Processing', 'security-assessment': 'Security Assessment', 'custom': 'Custom',
};

export default function QuestionnairesPage() {
  const toast = useToast();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');

  useEffect(() => { loadQuestionnaires(); }, []);

  async function loadQuestionnaires() {
    const res = await fetch('/api/questionnaires');
    const data = await res.json();
    setQuestionnaires(data.questionnaires ?? []);
    setLoading(false);
  }

  function getSectionCount(q: Questionnaire): number {
    try {
      const sections = typeof q.sections === 'string' ? JSON.parse(q.sections) : q.sections;
      return Array.isArray(sections) ? sections.length : 0;
    } catch { return 0; }
  }

  function getQuestionCount(q: Questionnaire): number {
    try {
      const sections = typeof q.sections === 'string' ? JSON.parse(q.sections) : q.sections;
      return Array.isArray(sections) ? sections.reduce((n: number, s: { questions: unknown[] }) => n + (s.questions?.length ?? 0), 0) : 0;
    } catch { return 0; }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const input = document.getElementById('q-file') as HTMLInputElement;
    if (!input?.files?.[0] || !uploadName) { toast.error('Name and file required'); return; }
    setUploading(true);
    try {
      const text = await input.files[0].text();
      let sections;
      try { sections = JSON.parse(text); }
      catch { toast.error('Invalid JSON file'); return; }

      const res = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: uploadName, type: 'custom', sections }),
      });
      if (res.ok) { toast.success('Questionnaire uploaded'); loadQuestionnaires(); setUploadOpen(false); }
      else { toast.error('Upload failed'); }
    } finally { setUploading(false); }
  }

  const builtIn = questionnaires.filter((q) => q.isBuiltIn);
  const custom = questionnaires.filter((q) => !q.isBuiltIn);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Questionnaire Library</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{questionnaires.length} questionnaires</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Upload} onClick={() => setUploadOpen(true)}>Upload</Button>
          <Link href="/questionnaires/builder">
            <Button size="sm" icon={Plus}>Build Questionnaire</Button>
          </Link>
        </div>
      </div>

      {/* Built-in */}
      <div>
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Platform Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {builtIn.map((q) => (
            <Card key={q.id} className="hover:border-indigo-500/30 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="info">{TYPE_LABELS[q.type] ?? q.type}</Badge>
                <span className="text-xs text-[var(--color-text-muted)]">v{q.version}</span>
              </div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{q.name}</p>
              {q.description && <p className="text-xs text-[var(--color-text-muted)] mb-3 line-clamp-2">{q.description}</p>}
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                <span>{getSectionCount(q)} sections</span>
                <span>·</span>
                <span>{getQuestionCount(q)} questions</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom */}
      <div>
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Custom Questionnaires</h3>
        {custom.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <ClipboardList size={28} className="mx-auto text-[var(--color-text-muted)] mb-3 opacity-40" />
              <p className="text-sm text-[var(--color-text-muted)]">No custom questionnaires yet.</p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <Button variant="ghost" size="sm" icon={Upload} onClick={() => setUploadOpen(true)}>Upload</Button>
                <Link href="/questionnaires/builder"><Button size="sm" icon={Plus}>Build one</Button></Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {custom.map((q) => (
              <Card key={q.id} className="hover:border-indigo-500/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="neutral">Custom</Badge>
                  <Link href={`/questionnaires/builder?id=${q.id}`}>
                    <button className="p-1 text-[var(--color-text-muted)] hover:text-indigo-400"><Edit size={12} /></button>
                  </Link>
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{q.name}</p>
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-2">
                  <span>{getSectionCount(q)} sections</span>
                  <span>·</span>
                  <span>{getQuestionCount(q)} questions</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Questionnaire"
        footer={<><Button variant="secondary" onClick={() => setUploadOpen(false)}>Cancel</Button><Button loading={uploading} onClick={handleUpload}>Upload</Button></>}>
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Upload a JSON file in the questionnaire format (array of sections with questions).
          </p>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Questionnaire Name</label>
            <input value={uploadName} onChange={(e) => setUploadName(e.target.value)} required placeholder="My Custom Questionnaire" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">JSON File</label>
            <input id="q-file" type="file" accept=".json" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
