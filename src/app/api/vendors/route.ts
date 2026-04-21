import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isAdmin, isResponder, resolveTenantId } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';
import { str, email, url, ValidationError } from '@/lib/validation';

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

  try {
  if (bulk && Array.isArray(bulkVendors)) {
    const sanitized = bulkVendors
      .filter((v) => typeof v === 'object' && v !== null)
      .map((v: Record<string, unknown>) => ({
        tenantId: session.tenantId,
        name: str(v.name, 'Vendor name', { required: true, max: 255 })!,
        legalName: str(v.legalName, 'Legal name', { max: 255 }),
        website: url(v.website, 'Website'),
        description: str(v.description, 'Description', { max: 2000 }),
        category: str(v.category, 'Category', { max: 100 }) ?? undefined,
        criticality: ['critical','high','medium','low'].includes(String(v.criticality)) ? String(v.criticality) : 'medium',
        isExempt: Boolean(v.isExempt),
        createdBy: session.userId,
      }));
    const created = await prisma.$transaction(sanitized.map((d) => prisma.vendor.create({ data: d })));
    return NextResponse.json({ success: true, count: created.length });
  }

  const vendor = await prisma.vendor.create({
    data: {
      tenantId: session.tenantId,
      name: str(singleVendor.name, 'Vendor name', { required: true, max: 255 })!,
      legalName: str(singleVendor.legalName, 'Legal name', { max: 255 }),
      website: url(singleVendor.website, 'Website'),
      description: str(singleVendor.description, 'Description', { max: 2000 }),
      category: singleVendor.category || null,
      criticality: singleVendor.criticality ?? 'medium',
      status: singleVendor.status ?? 'active',
      isExempt: singleVendor.isExempt ?? false,
      exemptReason: str(singleVendor.exemptReason, 'Exempt reason', { max: 500 }),
      trustCenterUrl: url(singleVendor.trustCenterUrl, 'Trust center URL'),
      primaryContactName: str(singleVendor.primaryContactName, 'Contact name', { max: 255 }),
      primaryContactEmail: email(singleVendor.primaryContactEmail, 'Contact email'),
      primaryContactPhone: str(singleVendor.primaryContactPhone, 'Contact phone', { max: 50 }),
      techContactName: str(singleVendor.techContactName, 'Tech contact name', { max: 255 }),
      techContactEmail: email(singleVendor.techContactEmail, 'Tech contact email'),
      techContactPhone: str(singleVendor.techContactPhone, 'Tech contact phone', { max: 50 }),
      processesPII: singleVendor.processesPII ?? false,
      processesPHI: singleVendor.processesPHI ?? false,
      processesFinancial: singleVendor.processesFinancial ?? false,
      processesConfidentialFirmData: singleVendor.processesConfidentialFirmData ?? false,
      processesConfidentialClientData: singleVendor.processesConfidentialClientData ?? false,
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
  } catch (err) {
    if (err instanceof ValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
