import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';
import { sendQuestionnaireReminder } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const assignment = await prisma.questionnaireAssignment.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      vendor: { select: { id: true, name: true } },
      questionnaire: true,
    },
  });

  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ assignment });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.questionnaireAssignment.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  const assignment = await prisma.questionnaireAssignment.update({
    where: { id },
    data: {
      status:            body.status     ?? undefined,
      responses:         body.responses  !== undefined ? (typeof body.responses === 'string' ? body.responses : JSON.stringify(body.responses)) : undefined,
      completedAt:       body.status === 'submitted' ? new Date() : undefined,
      reviewedBy:        body.reviewedBy ?? undefined,
      reviewedAt:        body.reviewedBy ? new Date() : undefined,
      reviewNotes:       body.reviewNotes !== undefined ? (body.reviewNotes || null) : undefined,
      score:             body.score       !== undefined ? body.score : undefined,
      dueDate:           body.dueDate     !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
    },
  });

  return NextResponse.json({ success: true, assignment });
}

// POST to /api/assignments/[id]/remind triggers a reminder email
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  if (!url.pathname.endsWith('/remind')) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const assignment = await prisma.questionnaireAssignment.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { vendor: { select: { name: true } }, questionnaire: { select: { name: true } } },
  });

  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!assignment.vendorContactEmail || !assignment.accessToken) {
    return NextResponse.json({ error: 'No vendor contact email or access token configured' }, { status: 400 });
  }

  await sendQuestionnaireReminder(
    assignment.vendorContactEmail,
    assignment.vendor.name,
    assignment.questionnaire.name,
    assignment.accessToken,
    assignment.dueDate,
    session.tenantId
  );

  await prisma.questionnaireAssignment.update({
    where: { id },
    data: { reminderCount: { increment: 1 }, lastReminderSent: new Date() },
  });

  return NextResponse.json({ success: true });
}
