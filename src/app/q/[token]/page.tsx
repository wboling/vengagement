'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Upload, FolderCheck, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Question {
  id: string; text: string; type: string; required: boolean;
  options?: string[]; helpText?: string;
}

interface Section {
  id: string; title: string; description?: string; questions: Question[];
}

interface DocRequest {
  id: string; documentType: string; label: string | null; description: string | null;
  nistRef: string | null; status: string; dueDate: string | null;
}

interface Assignment {
  id: string; vendorName: string; questionnaireName: string;
  questionnaireDescription: string | null; dueDate: string | null;
  status: string; sections: Section[];
  responses: Record<string, { response: string; comments?: string }>;
  documentRequests: DocRequest[];
}

export default function GuestQuestionnairePage() {
  const { token } = useParams<{ token: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { load(); }, [token]);

  async function load() {
    const res = await fetch(`/api/q/${token}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Unable to load questionnaire.');
    } else {
      const data = await res.json();
      setAssignment({ ...data.assignment, documentRequests: data.assignment.documentRequests ?? [] });
      const prefilled: Record<string, string> = {};
      Object.entries(data.assignment.responses ?? {}).forEach(([k, v]) => {
        prefilled[k] = (v as { response: string }).response ?? '';
      });
      setResponses(prefilled);
    }
    setLoading(false);
  }

  async function uploadFile(requestId: string, docType: string, label: string) {
    const input = fileRefs.current[requestId];
    if (!input?.files?.[0]) return;
    setUploadingDoc(requestId);
    const fd = new FormData();
    fd.append('file', input.files[0]);
    fd.append('documentRequestId', requestId);
    fd.append('documentType', docType);
    fd.append('name', label);
    const res = await fetch(`/api/q/${token}/upload`, { method: 'POST', body: fd });
    if (res.ok) {
      setUploadedDocs((prev) => ({ ...prev, [requestId]: input.files![0].name }));
      setAssignment((prev) => prev ? {
        ...prev,
        documentRequests: prev.documentRequests.map((r) => r.id === requestId ? { ...r, status: 'received' } : r),
      } : prev);
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? 'Upload failed. Please try again.');
    }
    setUploadingDoc(null);
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
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1e2a3a] hover:border-indigo-500/40 text-xs text-[#8b9bb4] transition-colors w-fit">
                        <Upload size={11} />
                        {responses[q.id] ? `Uploaded: ${responses[q.id]}` : 'Choose file'}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append('file', file);
                            fd.append('documentType', 'Other');
                            fd.append('name', file.name);
                            const res = await fetch(`/api/q/${token}/upload`, { method: 'POST', body: fd });
                            if (res.ok) setResponse(q.id, file.name);
                          }}
                        />
                      </label>
                      {responses[q.id] && (
                        <p className="text-xs text-emerald-400">✓ File uploaded successfully</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Document Requests Section */}
        {assignment.documentRequests.length > 0 && (
          <div className="border-t border-[#1e2a3a] pt-8">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <FolderCheck size={16} className="text-indigo-400" />
                <h2 className="text-base font-semibold text-white">Requested Documents</h2>
              </div>
              <p className="text-sm text-[#8b9bb4]">
                Please upload the following documents as part of your due diligence submission. Documents marked as required support our NIST CSF supply chain risk management program.
              </p>
            </div>

            <div className="space-y-3">
              {assignment.documentRequests.map((req) => {
                const isReceived = req.status === 'received' || !!uploadedDocs[req.id];
                const isUploading = uploadingDoc === req.id;
                const uploadedName = uploadedDocs[req.id];
                return (
                  <div key={req.id} className={`bg-[#131929] border rounded-xl p-4 ${isReceived ? 'border-emerald-500/30' : 'border-[#1e2a3a]'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-white">{req.label ?? req.documentType}</p>
                          {req.nistRef && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono">{req.nistRef}</span>
                          )}
                          {isReceived ? (
                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">Uploaded</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded flex items-center gap-1">
                              <Clock size={9} /> Pending
                            </span>
                          )}
                        </div>
                        {req.description && <p className="text-xs text-[#8b9bb4] mt-1">{req.description}</p>}
                        {req.dueDate && <p className="text-xs text-[#8b9bb4] mt-0.5">Due: {formatDate(req.dueDate)}</p>}
                        {uploadedName && <p className="text-xs text-emerald-400 mt-1">✓ {uploadedName}</p>}
                      </div>

                      {!isReceived && (
                        <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex-shrink-0 ${
                          isUploading
                            ? 'border-[#1e2a3a] text-[#4a5568] opacity-60'
                            : 'border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10'
                        }`}>
                          <Upload size={11} />
                          {isUploading ? 'Uploading…' : 'Upload'}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                            className="hidden"
                            disabled={isUploading}
                            ref={(el) => { fileRefs.current[req.id] = el; }}
                            onChange={() => uploadFile(req.id, req.documentType, req.label ?? req.documentType)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
