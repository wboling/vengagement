'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Request failed'); return; }
      setSuccess(true);
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 12) { setError('Password must be at least 12 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Reset failed'); return; }
      router.replace('/login');
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 shadow-xl">
      {token ? (
        <>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Set new password</h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-5">
            Choose a strong password (min. 12 characters, upper/lower/number/special).
          </p>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">New password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Confirm password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Set password
            </button>
          </form>
        </>
      ) : success ? (
        <div className="text-center py-4">
          <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-primary)] font-medium">Check your email</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">If an account exists for that email, we sent a reset link.</p>
          <a href="/login" className="block mt-4 text-xs text-indigo-400 hover:underline">← Back to sign in</a>
        </div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Reset password</h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-5">Enter your email and we'll send you a reset link.</p>
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required autoFocus />
            </div>
            {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Send reset link
            </button>
            <a href="/login" className="block text-center text-xs text-[var(--color-text-muted)] hover:text-indigo-400">← Back to sign in</a>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 shadow-xl h-48" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
