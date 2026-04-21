import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';
import { DOCUMENT_REQUEST_CATALOG } from '@/lib/document-request-catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const vendorId = searchParams.get('vendorId');
  const status = searchParams.get('status');

  const requests = await prisma.documentRequest.findMany({
    where: {
      tenantId: session.tenantId,
      ...(vendorId ? { vendorId } : {}),
      ...(status ? { status } : {}),
    },
    include: { vendor: { select: { id: true, name: true, criticality: true } } },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { requestedAt: 'desc' }],
  });

  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { vendorId, requests } = await req.json();
  if (!vendorId || !Array.isArray(requests) || requests.length === 0) {
    return NextResponse.json({ error: 'vendorId and requests[] required' }, { status: 400 });
  }

  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId: session.tenantId } });
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  const created = await prisma.$transaction(
    requests.map((r: { documentType: string; dueDate?: string }) => {
      const catalogEntry = DOCUMENT_REQUEST_CATALOG.find((c) => c.type === r.documentType);
      return prisma.documentRequest.create({
        data: {
          tenantId: session.tenantId,
          vendorId,
          documentType: r.documentType,
          label: catalogEntry?.label ?? r.documentType,
          description: catalogEntry?.description ?? null,
          nistRef: catalogEntry?.nistRefs[0] ?? null,
          dueDate: r.dueDate ? new Date(r.dueDate) : null,
          requestedBy: session.userId,
        },
      });
    })
  );

  return NextResponse.json({ success: true, created }, { status: 201 });
}
