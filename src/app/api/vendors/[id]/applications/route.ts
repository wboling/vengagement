import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: vendorId } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId: session.tenantId } });
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const apps = await prisma.vendorApplication.findMany({ where: { vendorId }, orderBy: { name: 'asc' } });
  return NextResponse.json({ applications: apps });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: vendorId } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId: session.tenantId } });
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const app = await prisma.vendorApplication.create({
    data: {
      vendorId,
      tenantId: session.tenantId,
      name: body.name,
      description: body.description || null,
      appType: body.appType || null,
      url: body.url || null,
      dataClassification: body.dataClassification ?? 'internal',
      containsPII: body.containsPII ?? false,
      containsPHI: body.containsPHI ?? false,
      containsFinancial: body.containsFinancial ?? false,
      userCount: body.userCount ?? null,
      businessCriticality: body.businessCriticality ?? 'medium',
      status: body.status ?? 'active',
      notes: body.notes || null,
    },
  });

  return NextResponse.json({ success: true, application: app }, { status: 201 });
}
