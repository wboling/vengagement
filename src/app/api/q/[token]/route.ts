import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { BUILT_IN_QUESTIONNAIRES } from '@/lib/data-questionnaires';
import { parseJsonSafe } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// GET: fetch questionnaire for a guest token
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const assignment = await prisma.questionnaireAssignment.findUnique({
    where: { accessToken: token },
    include: {
      questionnaire: true,
      vendor: { select: { name: true } },
    },
  });

  if (!assignment) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  if (assignment.accessTokenExpiry && assignment.accessTokenExpiry < new Date()) {
    return NextResponse.json({ error: 'This questionnaire link has expired' }, { status: 410 });
  }
  if (assignment.status === 'submitted' || assignment.status === 'approved' || assignment.status === 'reviewed') {
    return NextResponse.json({ error: 'This questionnaire has already been submitted' }, { status: 409 });
  }

  let sections;
  const builtIn = BUILT_IN_QUESTIONNAIRES.find((q) => q.id === assignment.questionnaireId);
  if (builtIn) {
    sections = builtIn.sections;
  } else {
    sections = parseJsonSafe(assignment.questionnaire.sections, []);
  }

  // Fetch outstanding document requests for this vendor
  const documentRequests = await prisma.documentRequest.findMany({
    where: { vendorId: assignment.vendorId },
    orderBy: [{ status: 'asc' }, { requestedAt: 'asc' }],
    select: { id: true, documentType: true, label: true, description: true, nistRef: true, status: true, dueDate: true },
  });

  // Fetch tenant branding for portal theming
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId: assignment.tenantId },
    select: { branding: true },
  });
  let branding: Record<string, string> = {};
  try { branding = JSON.parse(tenantSettings?.branding ?? '{}'); } catch {}

  return NextResponse.json({
    assignment: {
      id: assignment.id,
      vendorName: assignment.vendor.name,
      questionnaireName: assignment.questionnaire.name,
      questionnaireDescription: assignment.questionnaire.description,
      dueDate: assignment.dueDate,
      status: assignment.status,
      sections,
      responses: parseJsonSafe(assignment.responses, {}),
      documentRequests,
    },
    branding: {
      primaryColor: branding.primaryColor ?? null,
      logoUrl: branding.logoUrl ?? null,
    },
  });
}

// POST: submit guest questionnaire responses
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const assignment = await prisma.questionnaireAssignment.findUnique({
    where: { accessToken: token },
  });

  if (!assignment) return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
  if (assignment.accessTokenExpiry && assignment.accessTokenExpiry < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 });
  }
  if (['submitted', 'approved', 'reviewed'].includes(assignment.status)) {
    return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
  }

  const { responses } = await req.json();

  await prisma.questionnaireAssignment.update({
    where: { id: assignment.id },
    data: {
      responses: typeof responses === 'string' ? responses : JSON.stringify(responses),
      status: 'submitted',
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
