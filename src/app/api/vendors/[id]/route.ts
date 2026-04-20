import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isAdmin, isResponder } from '@/lib/auth/session';
import { calculateVendorRiskScore } from '@/lib/risk-calculator';
import { parseJsonSafe } from '@/lib/utils';

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

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      name:                body.name                ?? undefined,
      legalName:           body.legalName           !== undefined ? (body.legalName || null) : undefined,
      website:             body.website             !== undefined ? (body.website || null) : undefined,
      description:         body.description         !== undefined ? (body.description || null) : undefined,
      category:            body.category            !== undefined ? (body.category || null) : undefined,
      criticality:         body.criticality         ?? undefined,
      status:              body.status              ?? undefined,
      isExempt:            body.isExempt            !== undefined ? body.isExempt : undefined,
      exemptReason:        body.exemptReason        !== undefined ? (body.exemptReason || null) : undefined,
      trustCenterUrl:      body.trustCenterUrl      !== undefined ? (body.trustCenterUrl || null) : undefined,
      primaryContactName:  body.primaryContactName  !== undefined ? (body.primaryContactName || null) : undefined,
      primaryContactEmail: body.primaryContactEmail !== undefined ? (body.primaryContactEmail || null) : undefined,
      primaryContactPhone: body.primaryContactPhone !== undefined ? (body.primaryContactPhone || null) : undefined,
      processesPII:        body.processesPII        !== undefined ? body.processesPII : undefined,
      processesPHI:        body.processesPHI        !== undefined ? body.processesPHI : undefined,
      processesFinancial:  body.processesFinancial  !== undefined ? body.processesFinancial : undefined,
      dataRetentionDays:   body.dataRetentionDays   !== undefined ? (body.dataRetentionDays || null) : undefined,
      dataLocation:        body.dataLocation        !== undefined ? (body.dataLocation || null) : undefined,
      contractStartDate:   body.contractStartDate   !== undefined ? (body.contractStartDate ? new Date(body.contractStartDate) : null) : undefined,
      contractEndDate:     body.contractEndDate     !== undefined ? (body.contractEndDate ? new Date(body.contractEndDate) : null) : undefined,
      contractValue:       body.contractValue       !== undefined ? (body.contractValue || null) : undefined,
      lastReviewDate:      body.lastReviewDate      !== undefined ? (body.lastReviewDate ? new Date(body.lastReviewDate) : null) : undefined,
      nextReviewDate:      body.nextReviewDate      !== undefined ? (body.nextReviewDate ? new Date(body.nextReviewDate) : null) : undefined,
      tags:                body.tags                !== undefined ? JSON.stringify(body.tags) : undefined,
      notes:               body.notes               !== undefined ? (body.notes || null) : undefined,
    },
  });

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
