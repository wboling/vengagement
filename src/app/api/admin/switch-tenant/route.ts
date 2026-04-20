import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const TENANT_OVERRIDE_COOKIE = 'vg_tenant_override';
const TENANT_OVERRIDE_NAME_COOKIE = 'vg_tenant_name';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { tenantId } = await req.json();

  if (!tenantId) {
    const res = NextResponse.json({ success: true });
    res.cookies.delete(TENANT_OVERRIDE_COOKIE);
    res.cookies.delete(TENANT_OVERRIDE_NAME_COOKIE);
    return res;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const res = NextResponse.json({ success: true, tenantName: tenant.name });
  res.cookies.set(TENANT_OVERRIDE_COOKIE, tenantId, { httpOnly: true, sameSite: 'lax', path: '/' });
  res.cookies.set(TENANT_OVERRIDE_NAME_COOKIE, tenant.name, { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const res = NextResponse.json({ success: true });
  res.cookies.delete(TENANT_OVERRIDE_COOKIE);
  res.cookies.delete(TENANT_OVERRIDE_NAME_COOKIE);
  return res;
}
