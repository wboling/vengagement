import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const statusParam = searchParams.get('status');
  const vendorId = searchParams.get('vendorId');

  const statuses = statusParam ? statusParam.split(',').map((s) => s.trim()).filter(Boolean) : null;

  const assignments = await prisma.questionnaireAssignment.findMany({
    where: {
      tenantId: session.tenantId,
      ...(statuses && statuses.length > 0 ? { status: { in: statuses } } : {}),
      ...(vendorId ? { vendorId } : {}),
    },
    include: {
      vendor: { select: { id: true, name: true } },
      questionnaire: { select: { id: true, name: true, type: true } },
    },
    orderBy: { assignedAt: 'desc' },
  });

  return NextResponse.json({ assignments });
}
