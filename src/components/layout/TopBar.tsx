'use client';

import { Menu } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth/context';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/vendors':       'Vendors',
  '/clients':       'Clients',
  '/documents':     'Documents',
  '/questionnaires':'Questionnaires',
  '/lifecycle':     'Vendor Lifecycle',
  '/reports':       'Reports',
  '/users':         'Users',
  '/settings':      'Settings',
  '/admin':         'Platform Admin',
};

function getTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path)) return title;
  }
  return 'Vengagement';
}

export function TopBar() {
  const { setSidebarOpen } = useApp();
  const { tenant } = useAuth();
  const pathname = usePathname();

  return (
    <header className="flex items-center gap-4 h-14 px-4 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] flex-shrink-0">
      <button
        className="lg:hidden p-1.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu size={18} />
      </button>

      <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">
        {getTitle(pathname)}
      </h1>

      <div className="flex-1" />

      {tenant && (
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
          {tenant.name}
        </span>
      )}

    </header>
  );
}
