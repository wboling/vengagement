import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [totalTenants, totalUsers, totalVendors, totalDocuments] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.vendor.count(),
    prisma.vendorDocument.count(),
  ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeUsers = await prisma.user.count({ where: { lastLogin: { gte: thirtyDaysAgo } } });

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true, name: true, industry: true, createdAt: true,
      _count: { select: { users: true, vendors: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ totalTenants, totalUsers, totalVendors, totalDocuments, activeUsers, tenants });
}
