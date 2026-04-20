import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await prisma.client.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      documents: {
        orderBy: { uploadedAt: 'desc' },
        select: {
          id: true, name: true, documentType: true, reviewStatus: true,
          aiReviewStatus: true, expiresAt: true, fileSize: true, uploadedAt: true,
          fileUrl: true, renewalDate: true,
        },
      },
    },
  });

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ client });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.client.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const client = await prisma.client.update({
    where: { id },
    data: {
      name:                body.name               ?? undefined,
      matter:              body.matter              !== undefined ? (body.matter || null) : undefined,
      type:                body.type               ?? undefined,
      status:              body.status             ?? undefined,
      primaryContactName:  body.primaryContactName !== undefined ? (body.primaryContactName || null) : undefined,
      primaryContactEmail: body.primaryContactEmail !== undefined ? (body.primaryContactEmail || null) : undefined,
      notes:               body.notes              !== undefined ? (body.notes || null) : undefined,
    },
  });

  return NextResponse.json({ success: true, client });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.client.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
