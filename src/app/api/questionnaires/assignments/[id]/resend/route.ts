import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';
import { sendQuestionnaireInvite } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const assignment = await prisma.questionnaireAssignment.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      questionnaire: { select: { name: true } },
      vendor: { select: { name: true } },
    },
  });
  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

  if (!assignment.vendorContactEmail) {
    return NextResponse.json({ error: 'No vendor contact email on this assignment' }, { status: 400 });
  }
  if (!assignment.accessToken) {
    return NextResponse.json({ error: 'No access token for this assignment — delete and re-assign' }, { status: 400 });
  }

  try {
    await sendQuestionnaireInvite(
      assignment.vendorContactEmail,
      assignment.vendor.name,
      assignment.questionnaire.name,
      assignment.accessToken,
      assignment.dueDate,
      session.tenantId
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await prisma.questionnaireAssignment.update({
    where: { id },
    data: {
      reminderCount: { increment: 1 },
      lastReminderSent: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
