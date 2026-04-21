'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, ClipboardList, GitBranch,
  BarChart3, Settings, LogOut, X, ChevronRight, Briefcase,
  Sun, Moon, ChevronDown, ScrollText, Globe,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { useTheme } from '@/lib/theme';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  minRole?: 'viewer' | 'responder' | 'company_admin' | 'admin';
  feature?: keyof import('@/types').AuthTenant;
}

const ROLE_ORDER = ['viewer', 'responder', 'company_admin', 'admin'] as const;

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',      href: '/dashboard',       icon: LayoutDashboard },
  { label: 'Vendors',        href: '/vendors',          icon: Building2,      feature: 'enableVendors' },
  { label: 'Clients',        href: '/clients',          icon: Briefcase },
  { label: 'Questionnaires', href: '/questionnaires',   icon: ClipboardList, feature: 'enableQuestionnaires' },
  { label: 'Lifecycle',      href: '/lifecycle',        icon: GitBranch,      feature: 'enableLifecycle' },
  { label: 'Reports',        href: '/reports',          icon: BarChart3,      feature: 'enableReports' },
];

const SETTINGS_ITEMS: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings, minRole: 'company_admin' },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Platform Overview', href: '/admin',            icon: Globe,      minRole: 'admin' },
  { label: 'Audit Log',         href: '/admin/audit-log',  icon: ScrollText, minRole: 'admin' },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + '/');
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        active
          ? 'nav-active'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
      )}
    >
      <item.icon size={16} className={active ? 'text-[var(--color-accent)]' : ''} />
      {item.label}
      {active && <ChevronRight size={12} className="ml-auto opacity-60" />}
    </Link>
  );
}

function TenantSwitcher({ overrideName, onSwitch }: { overrideName: string | null; onSwitch: (name: string | null) => void }) {
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/tenants').then(r => r.json()).then(d => setTenants(d.tenants ?? []));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function switchTo(tenantId: string | null, tenantName: string | null) {
    setOpen(false);
    await fetch('/api/admin/switch-tenant', {
      method: tenantId ? 'POST' : 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: tenantId ? JSON.stringify({ tenantId }) : undefined,
    });
    onSwitch(tenantName);
    window.location.reload();
  }

  return (
    <div ref={ref} className="relative mt-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <Globe size={10} className="flex-shrink-0" />
        <span className="truncate max-w-[110px]">
          {overrideName ? `Viewing: ${overrideName}` : 'Switch to tenant →'}
        </span>
        <ChevronDown size={10} className="flex-shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--color-border)]">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Tenant Context</p>
          </div>
          <div className="p-1.5 space-y-0.5 max-h-64 overflow-y-auto">
            {overrideName && (
              <button
                onClick={() => switchTo(null, null)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
              >
                <X size={10} /> Exit tenant — back to platform
              </button>
            )}
            {tenants.map(t => (
              <button
                key={t.id}
                onClick={() => switchTo(t.id, t.name)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, tenant } = useAuth();
  const { colorMode, toggleColorMode, branding } = useTheme();
  const [overrideName, setOverrideName] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('vg_tenant_name='));
      if (cookie) {
        const raw = cookie.split('=').slice(1).join('=').trim();
        try { setOverrideName(decodeURIComponent(raw)); } catch { setOverrideName(raw); }
      }
    }
  }, [user?.role]);

  if (!user || !tenant) return null;

  const isPlatformAdmin = user.role === 'admin';
  const roleIndex = ROLE_ORDER.indexOf(user.role as typeof ROLE_ORDER[number]);

  const canSee = (item: NavItem) => {
    if (item.minRole) {
      const minIndex = ROLE_ORDER.indexOf(item.minRole);
      if (roleIndex < minIndex) return false;
    }
    if (item.feature) {
      return tenant[item.feature as keyof typeof tenant] === true;
    }
    return true;
  };

  // Platform admins only see tenant nav when they've switched into a tenant
  const showTenantNav = !isPlatformAdmin || !!overrideName;

  return (
    <aside className="flex flex-col w-64 h-full bg-[var(--color-bg-surface)] border-r border-[var(--color-border)]">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--color-border)]">
        <div className="min-w-0 flex-1">
          {branding.logoUrl && !isPlatformAdmin && (
            <div className="mb-3">
              <img
                src={branding.logoUrl}
                alt={tenant.name}
                className="h-7 max-w-[120px] object-contain"
              />
            </div>
          )}
          {isPlatformAdmin && !overrideName ? (
            <>
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Platform</p>
              <p className="text-sm font-semibold text-[var(--color-accent)] mt-0.5">Admin Console</p>
            </>
          ) : isPlatformAdmin && overrideName ? (
            <>
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Viewing Tenant</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5 truncate">{overrideName}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Platform</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5 truncate">{tenant.name}</p>
            </>
          )}
          {isPlatformAdmin && (
            <TenantSwitcher overrideName={overrideName} onSwitch={setOverrideName} />
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] flex-shrink-0 mt-0.5">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {showTenantNav && NAV_ITEMS.filter(canSee).map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {isPlatformAdmin && (
          <div className={cn('space-y-0.5', showTenantNav && 'pt-3 mt-3 border-t border-[var(--color-border)]')}>
            <p className="px-3 pb-1 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
              Platform Admin
            </p>
            {ADMIN_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}

        <div className="pt-3 mt-3 border-t border-[var(--color-border)]">
          {SETTINGS_ITEMS.filter(canSee).map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] text-xs font-bold flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{user.name}</p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              {isPlatformAdmin ? 'Platform Admin' : user.role.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={toggleColorMode}
            title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {colorMode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };
  return (
    <button
      onClick={handleLogout}
      className="p-1.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
      title="Sign out"
    >
      <LogOut size={14} />
    </button>
  );
}
