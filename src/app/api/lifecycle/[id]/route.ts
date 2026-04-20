import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isCompanyAdmin, isResponder } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const request = await prisma.vendorLifecycleRequest.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      steps: { orderBy: { stepOrder: 'asc' } },
      vendor: { select: { id: true, name: true, status: true } },
    },
  });

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ request });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.vendorLifecycleRequest.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  // Handle step approval/rejection
  if (body.action === 'approve_step' && body.stepType) {
    return approveStep(id, session, body);
  }

  if (body.action === 'reject' && isCompanyAdmin(session)) {
    await prisma.vendorLifecycleRequest.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: body.reason || null },
    });
    return NextResponse.json({ success: true });
  }

  if (body.action === 'complete' && isCompanyAdmin(session)) {
    // Create the actual vendor from the request
    const vendor = await prisma.vendor.create({
      data: {
        tenantId: session.tenantId,
        name: existing.vendorName,
        legalName: existing.vendorLegalName || null,
        website: existing.vendorWebsite || null,
        description: existing.vendorDescription || null,
        category: existing.vendorCategory || undefined,
        criticality: existing.estimatedCriticality,
        status: 'active',
        createdBy: session.userId,
      },
    });

    await prisma.vendorLifecycleRequest.update({
      where: { id },
      data: { status: 'completed', vendorId: vendor.id, completedAt: new Date(), currentStep: 'complete' },
    });

    return NextResponse.json({ success: true, vendorId: vendor.id });
  }

  const request = await prisma.vendorLifecycleRequest.update({
    where: { id },
    data: {
      vendorName:           body.vendorName           ?? undefined,
      vendorLegalName:      body.vendorLegalName       !== undefined ? (body.vendorLegalName || null) : undefined,
      vendorWebsite:        body.vendorWebsite         !== undefined ? (body.vendorWebsite || null) : undefined,
      vendorDescription:    body.vendorDescription     !== undefined ? (body.vendorDescription || null) : undefined,
      businessJustification: body.businessJustification !== undefined ? (body.businessJustification || null) : undefined,
      adminNotes:           body.adminNotes            !== undefined ? (body.adminNotes || null) : undefined,
      status:               body.status               ?? undefined,
    },
  });

  return NextResponse.json({ success: true, request });
}

async function approveStep(
  requestId: string,
  session: Awaited<ReturnType<typeof validateSessionToken>> & object,
  body: Record<string, unknown>
) {
  const steps = await prisma.vendorLifecycleStep.findMany({ where: { requestId }, orderBy: { stepOrder: 'asc' } });
  const currentStep = steps.find((s) => s.stepType === body.stepType);
  if (!currentStep) return NextResponse.json({ error: 'Step not found' }, { status: 404 });

  await prisma.vendorLifecycleStep.update({
    where: { id: currentStep.id },
    data: { status: 'completed', completedBy: session!.userId, completedAt: new Date(), notes: (body.notes as string) || null },
  });

  // Move to next pending step
  const nextStep = steps.find(
    (s) => s.stepOrder > currentStep.stepOrder && s.status === 'pending'
  );
  if (nextStep) {
    await prisma.vendorLifecycleStep.update({
      where: { id: nextStep.id },
      data: { status: 'in_progress' },
    });
    await prisma.vendorLifecycleRequest.update({
      where: { id: requestId },
      data: { currentStep: nextStep.stepType, status: 'under_review' },
    });
  } else {
    await prisma.vendorLifecycleRequest.update({
      where: { id: requestId },
      data: { status: 'approved', currentStep: 'document_collection' },
    });
  }

  return NextResponse.json({ success: true });
}
