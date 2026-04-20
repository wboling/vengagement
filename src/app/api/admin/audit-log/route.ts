import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const tenantId = searchParams.get('tenantId');
  const resource = searchParams.get('resource');
  const action = searchParams.get('action');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 500);

  const logs = await prisma.appAuditLog.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      ...(resource ? { resource } : {}),
      ...(action ? { action } : {}),
    },
    include: { tenant: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ logs });
}
