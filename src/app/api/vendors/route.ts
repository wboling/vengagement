import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isAdmin, isResponder, resolveTenantId } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const tenantId = resolveTenantId(session.tenantId, isAdmin(session), searchParams.get('tenantId'));
  const status = searchParams.get('status');
  const criticality = searchParams.get('criticality');
  const search = searchParams.get('q');

  const vendors = await prisma.vendor.findMany({
    where: {
      tenantId,
      ...(status && { status }),
      ...(criticality && { criticality }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { legalName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: [{ criticality: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: { documents: true, questionnaireAssignments: true, applications: true },
      },
    },
  });

  return NextResponse.json({ vendors });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { bulk, vendors: bulkVendors, ...singleVendor } = body;

  if (bulk && Array.isArray(bulkVendors)) {
    const created = await prisma.$transaction(
      bulkVendors.map((v: Record<string, unknown>) =>
        prisma.vendor.create({
          data: {
            tenantId: session.tenantId,
            name: String(v.name),
            legalName: v.legalName ? String(v.legalName) : null,
            website: v.website ? String(v.website) : null,
            description: v.description ? String(v.description) : null,
            category: v.category ? String(v.category) : undefined,
            criticality: v.criticality ? String(v.criticality) : 'medium',
            isExempt: Boolean(v.isExempt),
            createdBy: session.userId,
          },
        })
      )
    );
    return NextResponse.json({ success: true, count: created.length });
  }

  const vendor = await prisma.vendor.create({
    data: {
      tenantId: session.tenantId,
      name: singleVendor.name,
      legalName: singleVendor.legalName || null,
      website: singleVendor.website || null,
      description: singleVendor.description || null,
      category: singleVendor.category || null,
      criticality: singleVendor.criticality ?? 'medium',
      status: singleVendor.status ?? 'active',
      isExempt: singleVendor.isExempt ?? false,
      exemptReason: singleVendor.exemptReason || null,
      trustCenterUrl: singleVendor.trustCenterUrl || null,
      primaryContactName: singleVendor.primaryContactName || null,
      primaryContactEmail: singleVendor.primaryContactEmail || null,
      primaryContactPhone: singleVendor.primaryContactPhone || null,
      processesPII: singleVendor.processesPII ?? false,
      processesPHI: singleVendor.processesPHI ?? false,
      processesFinancial: singleVendor.processesFinancial ?? false,
      dataRetentionDays: singleVendor.dataRetentionDays ?? null,
      dataLocation: singleVendor.dataLocation || null,
      contractStartDate: singleVendor.contractStartDate ? new Date(singleVendor.contractStartDate) : null,
      contractEndDate: singleVendor.contractEndDate ? new Date(singleVendor.contractEndDate) : null,
      contractValue: singleVendor.contractValue ?? null,
      tags: JSON.stringify(singleVendor.tags ?? []),
      notes: singleVendor.notes || null,
      createdBy: session.userId,
    },
  });

  await logAudit(session, 'create', 'vendor', vendor.id, vendor.name, undefined, req);
  return NextResponse.json({ success: true, vendor }, { status: 201 });
}
