import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isAdmin, isCompanyAdmin, isResponder } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const statusParam = searchParams.get('status');
  const statuses = statusParam ? statusParam.split(',').map((s) => s.trim()).filter(Boolean) : null;

  const requests = await prisma.vendorLifecycleRequest.findMany({
    where: {
      tenantId: session.tenantId,
      ...(statuses && statuses.length === 1 ? { status: statuses[0] } : {}),
      ...(statuses && statuses.length > 1 ? { status: { in: statuses } } : {}),
    },
    orderBy: { requestedAt: 'desc' },
    include: {
      vendor: { select: { id: true, name: true, status: true } },
      steps: { orderBy: { stepOrder: 'asc' } },
    },
  });

  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: session.tenantId } });

  // Build lifecycle steps based on tenant settings
  const steps: Array<{ stepType: string; stepOrder: number }> = [
    { stepType: 'submission', stepOrder: 1 },
  ];
  if (settings?.requireSecurityReview !== false) steps.push({ stepType: 'security_review', stepOrder: 2 });
  if (settings?.requireLegalReview !== false) steps.push({ stepType: 'legal_review', stepOrder: 3 });
  if (settings?.requireExecApproval) steps.push({ stepType: 'exec_approval', stepOrder: 4 });
  steps.push({ stepType: 'document_collection', stepOrder: steps.length + 1 });
  steps.push({ stepType: 'questionnaire_assignment', stepOrder: steps.length + 1 });
  steps.push({ stepType: 'complete', stepOrder: steps.length + 1 });

  const request = await prisma.vendorLifecycleRequest.create({
    data: {
      tenantId: session.tenantId,
      vendorName: body.vendorName,
      vendorLegalName: body.vendorLegalName || null,
      vendorWebsite: body.vendorWebsite || null,
      vendorDescription: body.vendorDescription || null,
      vendorCategory: body.vendorCategory || null,
      businessJustification: body.businessJustification || null,
      estimatedDataTypes: JSON.stringify(body.estimatedDataTypes ?? []),
      estimatedCriticality: body.estimatedCriticality ?? 'medium',
      applications: JSON.stringify(body.applications ?? []),
      requestedBy: session.userId,
      status: body.submit ? 'submitted' : 'draft',
      currentStep: 'submission',
      steps: {
        create: steps.map((s) => ({
          stepType: s.stepType,
          stepOrder: s.stepOrder,
          status: s.stepType === 'submission' ? 'completed' : 'pending',
          completedAt: s.stepType === 'submission' ? new Date() : null,
        })),
      },
    },
    include: { steps: true },
  });

  return NextResponse.json({ success: true, request }, { status: 201 });
}
