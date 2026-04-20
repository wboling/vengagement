import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { users: true, vendors: true } } },
  });

  return NextResponse.json({ tenants });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { tenantName, tenantIndustry, adminEmail, adminName, adminPassword } = body;

  if (!tenantName || !adminEmail) {
    return NextResponse.json({ error: 'Tenant name and admin email are required' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail.trim().toLowerCase() } });
  if (existing) return NextResponse.json({ error: 'Admin email already exists' }, { status: 409 });

  const tenant = await prisma.tenant.create({
    data: { name: tenantName, industry: tenantIndustry || null },
  });

  const tmpPassword = adminPassword || Math.random().toString(36).slice(2) + 'A1!';
  const passwordHash = await bcrypt.hash(tmpPassword, 12);

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: adminEmail.trim().toLowerCase(),
      name: adminName || adminEmail.split('@')[0],
      role: 'company_admin',
      passwordHash,
      mustChangePw: !adminPassword,
    },
  });

  // Create default tenant settings
  await prisma.tenantSettings.create({ data: { tenantId: tenant.id } });

  return NextResponse.json({
    success: true, tenant, user,
    temporaryPassword: !adminPassword ? tmpPassword : undefined,
  }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, ...body } = await req.json();
  if (!id) return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });

  const tenant = await prisma.tenant.update({
    where: { id },
    data: {
      name:                body.name                ?? undefined,
      industry:            body.industry            !== undefined ? (body.industry || null) : undefined,
      enableVendors:       body.enableVendors       !== undefined ? body.enableVendors : undefined,
      enableQuestionnaires: body.enableQuestionnaires !== undefined ? body.enableQuestionnaires : undefined,
      enableDocuments:     body.enableDocuments     !== undefined ? body.enableDocuments : undefined,
      enableReports:       body.enableReports       !== undefined ? body.enableReports : undefined,
      enableLifecycle:     body.enableLifecycle     !== undefined ? body.enableLifecycle : undefined,
      enableAiReview:      body.enableAiReview      !== undefined ? body.enableAiReview : undefined,
    },
  });

  return NextResponse.json({ success: true, tenant });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  if (id === session.tenantId) return NextResponse.json({ error: 'Cannot delete your own tenant' }, { status: 400 });

  await prisma.tenant.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
