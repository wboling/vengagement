import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isCompanyAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, name: true, industry: true, primaryContact: true },
  });

  return NextResponse.json({ tenant });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isCompanyAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, industry, primaryContact } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });

  const tenant = await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      name:           name.trim(),
      industry:       industry !== undefined ? (industry?.trim() || null) : undefined,
      primaryContact: primaryContact !== undefined ? (primaryContact?.trim() || null) : undefined,
    },
    select: { id: true, name: true, industry: true, primaryContact: true },
  });

  return NextResponse.json({ success: true, tenant });
}
