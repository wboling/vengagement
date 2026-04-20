import { prisma } from '@/lib/db/prisma';
import type { SessionUser } from '@/types';
import type { NextRequest } from 'next/server';

export async function logAudit(
  session: SessionUser,
  action: string,
  resource: string,
  resourceId?: string,
  resourceName?: string,
  details?: Record<string, unknown>,
  req?: NextRequest
): Promise<void> {
  try {
    await prisma.appAuditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        userEmail: session.user.email,
        userRole: session.user.role,
        action,
        resource,
        resourceId: resourceId ?? null,
        resourceName: resourceName ?? null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req
          ? (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null)
          : null,
      },
    });
  } catch {
    // never let audit logging crash the main request
  }
}
