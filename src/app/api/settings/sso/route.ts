import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isCompanyAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isCompanyAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      authMode: true, forceSso: true,
      samlDomain: true, samlEntityId: true, samlAcsUrl: true, samlIdpMetadata: true,
    },
  });

  return NextResponse.json({ sso: tenant });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isCompanyAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { authMode, forceSso, samlDomain, samlEntityId, samlAcsUrl, samlIdpMetadata } = body;

  const tenant = await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      ...(authMode !== undefined ? { authMode } : {}),
      ...(forceSso !== undefined ? { forceSso } : {}),
      ...(samlDomain !== undefined ? { samlDomain: samlDomain || null } : {}),
      ...(samlEntityId !== undefined ? { samlEntityId: samlEntityId || null } : {}),
      ...(samlAcsUrl !== undefined ? { samlAcsUrl: samlAcsUrl || null } : {}),
      ...(samlIdpMetadata !== undefined ? { samlIdpMetadata: samlIdpMetadata || null } : {}),
    },
    select: {
      authMode: true, forceSso: true,
      samlDomain: true, samlEntityId: true, samlAcsUrl: true, samlIdpMetadata: true,
    },
  });

  return NextResponse.json({ sso: tenant });
}
