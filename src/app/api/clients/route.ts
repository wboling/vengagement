import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');

  const clients = await prisma.client.findMany({
    where: {
      tenantId: session.tenantId,
      ...(status ? { status } : {}),
    },
    include: {
      _count: { select: { documents: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, matter, type, status, primaryContactName, primaryContactEmail, notes } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'Client name is required' }, { status: 400 });

  const client = await prisma.client.create({
    data: {
      tenantId: session.tenantId,
      name: name.trim(),
      matter: matter || null,
      type: type || 'corporate',
      status: status || 'active',
      primaryContactName: primaryContactName || null,
      primaryContactEmail: primaryContactEmail || null,
      notes: notes || null,
      createdBy: session.userId,
    },
  });

  await logAudit(session, 'create', 'client', client.id, client.name, undefined, req);
  return NextResponse.json({ success: true, client }, { status: 201 });
}
