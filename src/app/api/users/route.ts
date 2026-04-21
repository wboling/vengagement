import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isCompanyAdmin, isAdmin } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isCompanyAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { tenantId: session.tenantId },
    select: { id: true, name: true, email: true, role: true, lastLogin: true, mfaEnabled: true, createdAt: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isCompanyAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, email, role, password, mustChangePw } = body;

  if (!name || !email || !role) {
    return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

  const tmpPassword = password || Math.random().toString(36).slice(2) + 'A1!';
  const passwordHash = await bcrypt.hash(tmpPassword, 12);

  const user = await prisma.user.create({
    data: {
      tenantId: session.tenantId,
      email: email.trim().toLowerCase(),
      name,
      role,
      passwordHash,
      mustChangePw: mustChangePw !== false,
      createdBy: session.userId,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await logAudit(session, 'create', 'user', user.id, user.email, { role }, req);
  return NextResponse.json({ success: true, user, temporaryPassword: !password ? tmpPassword : undefined }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isCompanyAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, name, role, mfaEnabled, tenantId } = await req.json();
  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  // Platform admins can edit any user; company admins restricted to their own tenant
  const target = isAdmin(session)
    ? await prisma.user.findUnique({ where: { id } })
    : await prisma.user.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (target.role === 'admin' && !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Only platform admins can change a user's tenant
  const newTenantId = isAdmin(session) && tenantId ? tenantId : undefined;
  if (newTenantId) {
    const tenantExists = await prisma.tenant.findUnique({ where: { id: newTenantId } });
    if (!tenantExists) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name:       name       ?? undefined,
      role:       role       ?? undefined,
      mfaEnabled: mfaEnabled !== undefined ? mfaEnabled : undefined,
      tenantId:   newTenantId,
    },
    select: { id: true, name: true, email: true, role: true, mfaEnabled: true, tenantId: true },
  });

  return NextResponse.json({ success: true, user });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isCompanyAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  if (id === session.userId) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

  const target = await prisma.user.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (target.role === 'admin' && !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.user.delete({ where: { id } });
  await logAudit(session, 'delete', 'user', id, target.email, undefined, req);
  return NextResponse.json({ success: true });
}
