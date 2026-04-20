import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import type { SessionUser, DbUser, DbTenant, UserRole, AuthType, MfaType } from '@/types';
import { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'vg_session';
export const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(
  userId: string,
  tenantId: string,
  options: { ipAddress?: string; userAgent?: string } = {}
): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      userId,
      tenantId,
      tokenHash,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      expiresAt,
    },
  });

  return token;
}

export async function validateSessionToken(token: string): Promise<SessionUser | null> {
  if (!token || token.length !== 64) return null;

  const tokenHash = hashToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: true,
      tenant: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsed: new Date() },
  }).catch(() => {});

  const user = session.user as unknown as DbUser & {
    role: string;
    authType: string;
    mfaType: string | null;
  };

  const tenant = session.tenant as unknown as DbTenant;

  return {
    userId: user.id,
    tenantId: tenant.id,
    mfaVerified: session.mfaVerified,
    user: {
      ...user,
      role: user.role as UserRole,
      authType: user.authType as AuthType,
      mfaType: user.mfaType as MfaType | null,
    },
    tenant,
  };
}

export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return validateSessionToken(token);
}

export async function invalidateSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => {});
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } }).catch(() => {});
}

export function isAdmin(session: SessionUser): boolean {
  return session.user.role === 'admin';
}

export function isCompanyAdmin(session: SessionUser): boolean {
  return session.user.role === 'admin' || session.user.role === 'company_admin';
}

export function isResponder(session: SessionUser): boolean {
  return ['admin', 'company_admin', 'responder'].includes(session.user.role);
}

export function resolveTenantId(
  sessionTenantId: string,
  isAdminUser: boolean,
  requested?: string | null
): string {
  return isAdminUser && requested ? requested : sessionTenantId;
}

export const TENANT_OVERRIDE_COOKIE = 'vg_tenant_override';

export async function validateSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await validateSessionToken(token);
  if (!session) return null;

  if (session.user.role === 'admin') {
    const overrideTenantId = req.cookies.get(TENANT_OVERRIDE_COOKIE)?.value;
    if (overrideTenantId && overrideTenantId !== session.tenantId) {
      const overrideTenant = await prisma.tenant.findUnique({ where: { id: overrideTenantId } });
      if (overrideTenant) {
        return {
          ...session,
          tenantId: overrideTenant.id,
          tenant: overrideTenant as unknown as import('@/types').DbTenant,
        };
      }
    }
  }
  return session;
}
