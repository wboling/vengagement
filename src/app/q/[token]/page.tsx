'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Question {
  id: string; text: string; type: string; required: boolean;
  options?: string[]; helpText?: string;
}

interface Section {
  id: string; title: string; description?: string; questions: Question[];
}

interface Assignment {
  id: string; vendorName: string; questionnaireName: string;
  questionnaireDescription: string | null; dueDate: string | null;
  status: string; sections: Section[];
  responses: Record<string, { response: string; comments?: string }>;
}

export default function GuestQuestionnairePage() {
  const { token } = useParams<{ token: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { load(); }, [token]);

  async function load() {
    const res = await fetch(`/api/q/${token}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Unable to load questionnaire.');
    } else {
      const data = await res.json();
      setAssignment(data.assignment);
      const prefilled: Record<string, string> = {};
      Object.entries(data.assignment.responses ?? {}).forEach(([k, v]) => {
        prefilled[k] = (v as { response: string }).response ?? '';
      });
      setResponses(prefilled);
    }
    setLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignment) return;

    // Validate required questions
    for (const section of assignment.sections) {
      for (const q of section.questions) {
        if (q.required && !responses[q.id]?.trim()) {
          alert(`"${q.text}" is required.`);
          return;
        }
      }
    }

    setSubmitting(true);
    const payload: Record<string, { response: string }> = {};
    Object.entries(responses).forEach(([k, v]) => { payload[k] = { response: v }; });

    const res = await fetch(`/api/q/${token}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ responses: payload }),
    });

    if (res.ok) setSubmitted(true);
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? 'Submission failed. Please try again.');
    }
    setSubmitting(false);
  }

  function setResponse(qId: string, value: string) {
    setResponses((prev) => ({ ...prev, [qId]: value }));
  }

  function toggleMulti(qId: string, option: string) {
    const current = responses[qId] ? responses[qId].split(',').map((s) => s.trim()).filter(Boolean) : [];
    const idx = current.indexOf(option);
    if (idx === -1) current.push(option);
    else current.splice(idx, 1);
    setResponse(qId, current.join(', '));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle size={40} className="mx-auto text-rose-400" />
          <h1 className="text-xl font-semibold text-white">Unable to Load Questionnaire</h1>
          <p className="text-[#8b9bb4]">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle size={40} className="mx-auto text-emerald-400" />
          <h1 className="text-xl font-semibold text-white">Questionnaire Submitted</h1>
          <p className="text-[#8b9bb4]">Thank you. Your responses have been received and will be reviewed by the security team.</p>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="border-b border-[#1e2a3a] bg-[#0f1525] px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-[#8b9bb4] mb-1">Vendor Security Questionnaire</p>
          <h1 className="text-xl font-semibold">{assignment.questionnaireName}</h1>
          <p className="text-sm text-[#8b9bb4] mt-1">
            Requested for: <span className="text-white font-medium">{assignment.vendorName}</span>
            {assignment.dueDate && (
              <> · Due {formatDate(assignment.dueDate)}</>
            )}
          </p>
          {assignment.questionnaireDescription && (
            <p className="text-sm text-[#8b9bb4] mt-2">{assignment.questionnaireDescription}</p>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {assignment.sections.map((section, si) => (
          <div key={section.id}>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">
                {si + 1}. {section.title}
              </h2>
              {section.description && (
                <p className="text-sm text-[#8b9bb4] mt-1">{section.description}</p>
              )}
            </div>

            <div className="space-y-5">
              {section.questions.map((q, qi) => (
                <div key={q.id} className="bg-[#131929] border border-[#1e2a3a] rounded-xl p-4">
                  <label className="block text-sm font-medium text-white mb-0.5">
                    {qi + 1}. {q.text}
                    {q.required && <span className="text-rose-400 ml-1">*</span>}
                  </label>
                  {q.helpText && <p className="text-xs text-[#8b9bb4] mb-3">{q.helpText}</p>}

                  {q.type === 'text' && (
                    <input
                      className="w-full bg-[#0f1525] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4a5568] outline-none focus:border-indigo-500"
                      value={responses[q.id] ?? ''}
                      onChange={(e) => setResponse(q.id, e.target.value)}
                      required={q.required}
                    />
                  )}

                  {q.type === 'textarea' && (
                    <textarea
                      className="w-full bg-[#0f1525] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4a5568] outline-none focus:border-indigo-500 min-h-[80px] resize-y"
                      value={responses[q.id] ?? ''}
                      onChange={(e) => setResponse(q.id, e.target.value)}
                      required={q.required}
                    />
                  )}

                  {q.type === 'boolean' && (
                    <div className="flex gap-3">
                      {['Yes', 'No'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={responses[q.id] === opt}
                            onChange={() => setResponse(q.id, opt)}
                            required={q.required}
                            className="accent-indigo-500"
                          />
                          <span className="text-sm text-white">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'select' && (
                    <select
                      className="w-full bg-[#0f1525] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                      value={responses[q.id] ?? ''}
                      onChange={(e) => setResponse(q.id, e.target.value)}
                      required={q.required}
                    >
                      <option value="">Select…</option>
                      {(q.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}

                  {q.type === 'multiselect' && (
                    <div className="space-y-2">
                      {(q.options ?? []).map((opt) => {
                        const selected = (responses[q.id] ?? '').split(',').map((s) => s.trim()).includes(opt);
                        return (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleMulti(q.id, opt)}
                              className="accent-indigo-500"
                              style={{ width: 'auto' }}
                            />
                            <span className="text-sm text-white">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'date' && (
                    <input
                      type="date"
                      className="bg-[#0f1525] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                      value={responses[q.id] ?? ''}
                      onChange={(e) => setResponse(q.id, e.target.value)}
                      required={q.required}
                    />
                  )}

                  {q.type === 'number' && (
                    <input
                      type="number"
                      className="bg-[#0f1525] border border-[#1e2a3a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 w-40"
                      value={responses[q.id] ?? ''}
                      onChange={(e) => setResponse(q.id, e.target.value)}
                      required={q.required}
                    />
                  )}

                  {q.type === 'file' && (
                    <p className="text-xs text-[#8b9bb4] italic">File upload not supported in this form. Please email the document directly to your contact.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Questionnaire'}
          </button>
        </div>

        <p className="text-xs text-[#4a5568] text-center pb-6">
          Your responses are submitted securely and will only be used for vendor due diligence purposes.
        </p>
      </form>
    </div>
  );
}
