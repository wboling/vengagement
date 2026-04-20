'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { AuthUser, AuthTenant, UserRole } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  loading: boolean;
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  tenant: null,
  loading: true,
  reload: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<AuthTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
        setTenant(data.tenant ?? null);
      } else {
        setUser(null);
        setTenant(null);
      }
    } catch {
      setUser(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
    intervalRef.current = setInterval(fetchSession, 60_000);

    const onFocus = () => fetchSession();
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [fetchSession]);

  return (
    <AuthContext.Provider value={{ user, tenant, loading, reload: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRequireRole(minimum: UserRole) {
  const { user } = useAuth();
  const ROLE_ORDER: UserRole[] = ['viewer', 'responder', 'company_admin', 'admin'];
  const userIndex = ROLE_ORDER.indexOf(user?.role ?? 'viewer');
  const requiredIndex = ROLE_ORDER.indexOf(minimum);
  return userIndex >= requiredIndex;
}
