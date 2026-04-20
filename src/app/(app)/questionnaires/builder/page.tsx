'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/store';

interface Question {
  id: string; text: string; type: string; required: boolean;
  options?: string[]; helpText?: string;
}

interface Section {
  id: string; title: string; description?: string; questions: Question[];
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Single Choice' },
  { value: 'multiselect', label: 'Multi Choice' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'file', label: 'File Upload' },
];

function uid() { return Math.random().toString(36).slice(2, 10); }

function newQuestion(): Question {
  return { id: uid(), text: '', type: 'text', required: false };
}

function newSection(): Section {
  return { id: uid(), title: 'New Section', questions: [newQuestion()] };
}

function QuestionnaireBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = searchParams.get('id');
  const toast = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<Section[]>([newSection()]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!existingId);

  useEffect(() => {
    if (existingId) loadExisting(existingId);
    else setExpandedSections(new Set([sections[0].id]));
  }, [existingId]);

  async function loadExisting(id: string) {
    const res = await fetch(`/api/questionnaires?id=${id}`);
    if (res.ok) {
      const data = await res.json();
      const q = data.questionnaire;
      if (q) {
        setName(q.name);
        setDescription(q.description ?? '');
        const parsed = typeof q.sections === 'string' ? JSON.parse(q.sections) : q.sections;
        setSections(parsed);
        setExpandedSections(new Set([parsed[0]?.id]));
      }
    }
    setLoading(false);
  }

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addSection() {
    const s = newSection();
    setSections((prev) => [...prev, s]);
    setExpandedSections((prev) => new Set([...prev, s.id]));
  }

  function removeSection(id: string) {
    if (sections.length === 1) { toast.error('Must have at least one section'); return; }
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSection(id: string, key: keyof Section, value: string) {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, [key]: value } : s));
  }

  function addQuestion(sectionId: string) {
    setSections((prev) => prev.map((s) =>
      s.id === sectionId ? { ...s, questions: [...s.questions, newQuestion()] } : s
    ));
  }

  function removeQuestion(sectionId: string, qId: string) {
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s;
      if (s.questions.length === 1) { toast.error('Must have at least one question'); return s; }
      return { ...s, questions: s.questions.filter((q) => q.id !== qId) };
    }));
  }

  function updateQuestion(sectionId: string, qId: string, key: keyof Question, value: unknown) {
    setSections((prev) => prev.map((s) =>
      s.id !== sectionId ? s : {
        ...s,
        questions: s.questions.map((q) => q.id !== qId ? q : { ...q, [key]: value }),
      }
    ));
  }

  function updateOptions(sectionId: string, qId: string, raw: string) {
    const options = raw.split('\n').map((o) => o.trim()).filter(Boolean);
    updateQuestion(sectionId, qId, 'options', options);
  }

  async function save() {
    if (!name.trim()) { toast.error('Questionnaire name is required'); return; }
    if (sections.some((s) => !s.title.trim())) { toast.error('All sections must have a title'); return; }
    if (sections.some((s) => s.questions.some((q) => !q.text.trim()))) {
      toast.error('All questions must have text'); return;
    }
    setSaving(true);

    const payload = { name, description: description || undefined, type: 'custom', sections };

    let res: Response;
    if (existingId) {
      res = await fetch('/api/questionnaires', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: existingId, ...payload }),
      });
    } else {
      res = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      toast.success(existingId ? 'Questionnaire updated' : 'Questionnaire created');
      router.push('/questionnaires');
    } else {
      toast.error('Failed to save');
    }
    setSaving(false);
  }

  if (loading) return <div className="skeleton h-64 rounded-xl" />;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/questionnaires"><Button variant="ghost" size="sm" icon={ArrowLeft}>Back</Button></Link>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {existingId ? 'Edit Questionnaire' : 'Build Questionnaire'}
        </h2>
      </div>

      {/* Meta */}
      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Questionnaire Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Annual Security Assessment" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Purpose and scope of this questionnaire" />
          </div>
        </div>
      </Card>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, si) => (
          <Card key={section.id}>
            {/* Section header */}
            <div className="flex items-center gap-2 mb-3">
              <GripVertical size={14} className="text-[var(--color-text-muted)] cursor-grab flex-shrink-0" />
              <button onClick={() => toggleSection(section.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                {expandedSections.has(section.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {section.title || `Section ${si + 1}`}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">({section.questions.length} questions)</span>
              </button>
              <button onClick={() => removeSection(section.id)} className="p-1 text-[var(--color-text-muted)] hover:text-rose-400">
                <Trash2 size={13} />
              </button>
            </div>

            {expandedSections.has(section.id) && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Section Title *</label>
                    <input value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} placeholder="Section title" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Description</label>
                    <input value={section.description ?? ''} onChange={(e) => updateSection(section.id, 'description', e.target.value)} placeholder="Optional context" />
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-3">
                  {section.questions.map((q, qi) => (
                    <div key={q.id} className="border border-[var(--color-border)] rounded-lg p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--color-text-muted)] w-5">{qi + 1}.</span>
                        <input
                          className="flex-1"
                          value={q.text}
                          onChange={(e) => updateQuestion(section.id, q.id, 'text', e.target.value)}
                          placeholder="Question text *"
                        />
                        <select
                          className="w-36 text-xs"
                          value={q.type}
                          onChange={(e) => updateQuestion(section.id, q.id, 'type', e.target.value)}
                        >
                          {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <button onClick={() => removeQuestion(section.id, q.id)} className="p-1 text-[var(--color-text-muted)] hover:text-rose-400">
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {(q.type === 'select' || q.type === 'multiselect') && (
                        <div className="pl-7">
                          <label className="block text-xs text-[var(--color-text-muted)] mb-1">Options (one per line)</label>
                          <textarea
                            rows={3}
                            value={(q.options ?? []).join('\n')}
                            onChange={(e) => updateOptions(section.id, q.id, e.target.value)}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                          />
                        </div>
                      )}

                      <div className="pl-7 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`req-${q.id}`}
                            checked={q.required}
                            onChange={(e) => updateQuestion(section.id, q.id, 'required', e.target.checked)}
                            style={{ width: 'auto' }}
                          />
                          <label htmlFor={`req-${q.id}`} className="text-xs text-[var(--color-text-secondary)]">Required</label>
                        </div>
                        <div className="flex-1">
                          <input
                            value={q.helpText ?? ''}
                            onChange={(e) => updateQuestion(section.id, q.id, 'helpText', e.target.value)}
                            placeholder="Help text (optional)"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addQuestion(section.id)}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Plus size={12} /> Add Question
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <button
        onClick={addSection}
        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border)] rounded-xl px-4 py-3 w-full transition-colors"
      >
        <Plus size={14} /> Add Section
      </button>

      <div className="flex justify-end gap-3 pt-2">
        <Link href="/questionnaires"><Button variant="secondary">Cancel</Button></Link>
        <Button loading={saving} onClick={save}>
          {existingId ? 'Save Changes' : 'Create Questionnaire'}
        </Button>
      </div>
    </div>
  );
}

export default function QuestionnaireBuilderPage() {
  return (
    <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
      <QuestionnaireBuilderContent />
    </Suspense>
  );
}
