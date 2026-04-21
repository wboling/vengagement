import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.documentRequest.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { status, notes, dueDate } = await req.json();

  const updated = await prisma.documentRequest.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
    },
  });

  return NextResponse.json({ success: true, request: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.documentRequest.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.documentRequest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
