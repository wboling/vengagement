import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';
import { sendQuestionnaireInvite } from '@/lib/email';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: questionnaireId } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { vendorId, dueDate, vendorContactName, vendorContactEmail, cycle, yearCycle, sendEmail } = body;

  if (!vendorId) return NextResponse.json({ error: 'vendorId is required' }, { status: 400 });

  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId: session.tenantId } });
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  // Check if questionnaire exists (DB or built-in)
  const { BUILT_IN_QUESTIONNAIRES } = await import('@/lib/data-questionnaires');
  const isBuiltIn = BUILT_IN_QUESTIONNAIRES.some((q) => q.id === questionnaireId);
  if (!isBuiltIn) {
    const q = await prisma.questionnaire.findFirst({
      where: {
        id: questionnaireId,
        OR: [{ tenantId: session.tenantId }, { isBuiltIn: true }],
      },
    });
    if (!q) return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 });
  }

  // For built-in questionnaires not yet in DB, create DB entry first
  let dbQuestionnaireId = questionnaireId;
  if (isBuiltIn) {
    const builtIn = BUILT_IN_QUESTIONNAIRES.find((q) => q.id === questionnaireId)!;
    const existing = await prisma.questionnaire.findUnique({ where: { id: questionnaireId } });
    if (!existing) {
      await prisma.questionnaire.create({
        data: {
          id: questionnaireId,
          tenantId: null,
          name: builtIn.name,
          description: builtIn.description,
          type: builtIn.type,
          version: builtIn.version,
          sections: JSON.stringify(builtIn.sections),
          isBuiltIn: true,
          isActive: true,
        },
      });
    }
  }

  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: session.tenantId } });
  const accessToken = randomBytes(32).toString('hex');
  const expireDays = settings?.guestLinkExpireDays ?? 30;
  const accessTokenExpiry = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);

  const assignment = await prisma.questionnaireAssignment.create({
    data: {
      vendorId,
      tenantId: session.tenantId,
      questionnaireId: dbQuestionnaireId,
      assignedBy: session.userId,
      dueDate: dueDate ? new Date(dueDate) : null,
      vendorContactName: vendorContactName || null,
      vendorContactEmail: vendorContactEmail || null,
      accessToken: settings?.allowGuestQuestionnaire ? accessToken : null,
      accessTokenExpiry: settings?.allowGuestQuestionnaire ? accessTokenExpiry : null,
      cycle: cycle ?? 'annual',
      yearCycle: yearCycle ?? new Date().getFullYear(),
      status: 'pending',
    },
  });

  // Send email invite if requested and contact email provided
  if (sendEmail && vendorContactEmail) {
    const questionnaireName = BUILT_IN_QUESTIONNAIRES.find((q) => q.id === questionnaireId)?.name ?? 'Security Questionnaire';
    await sendQuestionnaireInvite(
      vendorContactEmail,
      vendor.name,
      questionnaireName,
      accessToken,
      dueDate ? new Date(dueDate) : null,
      session.tenantId
    ).catch(console.error);
  }

  return NextResponse.json({ success: true, assignment }, { status: 201 });
}
