'use client';

import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';

const CONFIG = {
  success: { icon: CheckCircle, bg: 'bg-emerald-500/15 border-emerald-500/25', text: 'text-emerald-400' },
  error:   { icon: XCircle,     bg: 'bg-rose-500/15 border-rose-500/25',       text: 'text-rose-400' },
  info:    { icon: Info,        bg: 'bg-blue-500/15 border-blue-500/25',        text: 'text-blue-400' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/15 border-amber-500/25',   text: 'text-amber-400' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const cfg = CONFIG[toast.type];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-xl animate-fade-in',
              'max-w-sm text-sm',
              cfg.bg,
              cfg.text
            )}
          >
            <Icon size={16} className="flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-[var(--color-text-primary)]">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
