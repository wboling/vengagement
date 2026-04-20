import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const vendorId = searchParams.get('vendorId');
  const clientId = searchParams.get('clientId');
  const documentType = searchParams.get('type');
  const reviewStatus = searchParams.get('reviewStatus');

  const documents = await prisma.vendorDocument.findMany({
    where: {
      tenantId: session.tenantId,
      ...(vendorId ? { vendorId } : {}),
      // When fetching a specific client's docs use that filter; otherwise exclude all client docs
      ...(clientId ? { clientId } : { clientId: null }),
      ...(documentType ? { documentType } : {}),
      ...(reviewStatus ? { reviewStatus } : {}),
    },
    include: {
      vendor: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
    orderBy: { uploadedAt: 'desc' },
  });

  return NextResponse.json({ documents });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, ...body } = await req.json();
  if (!id) return NextResponse.json({ error: 'Document ID required' }, { status: 400 });

  const existing = await prisma.vendorDocument.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const document = await prisma.vendorDocument.update({
    where: { id },
    data: {
      name:          body.name          ?? undefined,
      description:   body.description   !== undefined ? (body.description || null) : undefined,
      documentType:  body.documentType  ?? undefined,
      documentDate:  body.documentDate  !== undefined ? (body.documentDate ? new Date(body.documentDate) : null) : undefined,
      expiresAt:     body.expiresAt     !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : undefined,
      renewalDate:   body.renewalDate   !== undefined ? (body.renewalDate ? new Date(body.renewalDate) : null) : undefined,
      tags:          body.tags          !== undefined ? JSON.stringify(body.tags) : undefined,
      reviewStatus:  body.reviewStatus  ?? undefined,
      isApproved:    body.isApproved    !== undefined ? body.isApproved : undefined,
      approvedBy:    body.isApproved    ? session.userId : undefined,
      approvedAt:    body.isApproved    ? new Date() : undefined,
      approvalNotes: body.approvalNotes !== undefined ? (body.approvalNotes || null) : undefined,
    },
  });

  return NextResponse.json({ success: true, document });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const existing = await prisma.vendorDocument.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.vendorDocument.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
