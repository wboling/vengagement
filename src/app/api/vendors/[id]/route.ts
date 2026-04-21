import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isAdmin, isResponder } from '@/lib/auth/session';
import { calculateVendorRiskScore } from '@/lib/risk-calculator';
import { parseJsonSafe } from '@/lib/utils';
import { str, email, url, ValidationError } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vendor = await prisma.vendor.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      applications: { orderBy: { name: 'asc' } },
      documents: { orderBy: { uploadedAt: 'desc' } },
      questionnaireAssignments: {
        include: { questionnaire: { select: { id: true, name: true, type: true } } },
        orderBy: { assignedAt: 'desc' },
      },
      riskAssessments: { orderBy: { assessedAt: 'desc' }, take: 5 },
    },
  });

  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ vendor });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.vendor.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  let vendor;
  try {
    vendor = await prisma.vendor.update({
      where: { id },
      data: {
        name:                body.name                !== undefined ? str(body.name, 'Vendor name', { required: true, max: 255 })! : undefined,
        legalName:           body.legalName           !== undefined ? str(body.legalName, 'Legal name', { max: 255 }) : undefined,
        website:             body.website             !== undefined ? url(body.website, 'Website') : undefined,
        description:         body.description         !== undefined ? str(body.description, 'Description', { max: 2000 }) : undefined,
        category:            body.category            !== undefined ? (body.category || null) : undefined,
        criticality:         body.criticality         ?? undefined,
        status:              body.status              ?? undefined,
        isExempt:            body.isExempt            !== undefined ? body.isExempt : undefined,
        exemptReason:        body.exemptReason        !== undefined ? str(body.exemptReason, 'Exempt reason', { max: 500 }) : undefined,
        trustCenterUrl:      body.trustCenterUrl      !== undefined ? url(body.trustCenterUrl, 'Trust center URL') : undefined,
        primaryContactName:  body.primaryContactName  !== undefined ? str(body.primaryContactName, 'Contact name', { max: 255 }) : undefined,
        primaryContactEmail: body.primaryContactEmail !== undefined ? email(body.primaryContactEmail, 'Contact email') : undefined,
        primaryContactPhone: body.primaryContactPhone !== undefined ? str(body.primaryContactPhone, 'Contact phone', { max: 50 }) : undefined,
        processesPII:        body.processesPII        !== undefined ? body.processesPII : undefined,
        processesPHI:        body.processesPHI        !== undefined ? body.processesPHI : undefined,
        processesFinancial:  body.processesFinancial  !== undefined ? body.processesFinancial : undefined,
        dataRetentionDays:   body.dataRetentionDays   !== undefined ? (body.dataRetentionDays || null) : undefined,
        dataLocation:        body.dataLocation        !== undefined ? str(body.dataLocation, 'Data location', { max: 255 }) : undefined,
        contractStartDate:   body.contractStartDate   !== undefined ? (body.contractStartDate ? new Date(body.contractStartDate) : null) : undefined,
        contractEndDate:     body.contractEndDate     !== undefined ? (body.contractEndDate ? new Date(body.contractEndDate) : null) : undefined,
        contractValue:       body.contractValue       !== undefined ? (body.contractValue || null) : undefined,
        lastReviewDate:      body.lastReviewDate      !== undefined ? (body.lastReviewDate ? new Date(body.lastReviewDate) : null) : undefined,
        nextReviewDate:      body.nextReviewDate      !== undefined ? (body.nextReviewDate ? new Date(body.nextReviewDate) : null) : undefined,
        tags:                body.tags                !== undefined ? JSON.stringify(body.tags) : undefined,
        notes:               body.notes               !== undefined ? str(body.notes, 'Notes', { max: 10000 }) : undefined,
      },
    });
  } catch (err) {
    if (err instanceof ValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  // Recalculate risk if relevant fields changed
  if (
    body.criticality !== undefined ||
    body.processesPII !== undefined ||
    body.processesPHI !== undefined ||
    body.processesFinancial !== undefined
  ) {
    await recalculateRisk(id, session.tenantId);
  }

  return NextResponse.json({ success: true, vendor });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.vendor.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.vendor.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

async function recalculateRisk(vendorId: string, tenantId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      documents: { select: { documentType: true, reviewStatus: true, expiresAt: true, aiReviewResult: true } },
      questionnaireAssignments: { select: { status: true, score: true, responses: true } },
    },
  });
  if (!vendor) return;

  if (vendor.riskOverride) return;

  const { score, level, factors } = calculateVendorRiskScore({
    vendor,
    documents: vendor.documents,
    assignments: vendor.questionnaireAssignments,
  });

  await prisma.vendor.update({ where: { id: vendorId }, data: { riskScore: score, riskLevel: level } });

  await prisma.vendorRiskAssessment.create({
    data: {
      vendorId,
      tenantId,
      riskScore: score,
      riskLevel: level,
      riskFactors: JSON.stringify(factors),
      status: 'finalized',
    },
  });
}
