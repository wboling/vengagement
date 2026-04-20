import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isCompanyAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = isCompanyAdmin(session);

  let settings = await prisma.tenantSettings.findUnique({ where: { tenantId: session.tenantId } });

  if (!settings) {
    settings = await prisma.tenantSettings.create({
      data: { tenantId: session.tenantId },
    });
  }

  // Non-admins get branding only (for theme loading)
  if (!isAdmin) {
    return NextResponse.json({ settings: { branding: settings?.branding ?? '{}' } });
  }

  // Redact secrets before sending
  return NextResponse.json({
    settings: {
      ...settings,
      smtpPass: settings.smtpPass ? '••••••••' : null,
      aiApiKey: settings.aiApiKey ? '••••••••' : null,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isCompanyAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();

  const data: Record<string, unknown> = {};

  // SMTP settings
  if (body.smtpHost    !== undefined) data.smtpHost    = body.smtpHost || null;
  if (body.smtpPort    !== undefined) data.smtpPort    = body.smtpPort ? Number(body.smtpPort) : null;
  if (body.smtpSecure  !== undefined) data.smtpSecure  = Boolean(body.smtpSecure);
  if (body.smtpUser    !== undefined) data.smtpUser    = body.smtpUser || null;
  if (body.smtpFrom    !== undefined) data.smtpFrom    = body.smtpFrom || null;
  // Only update pass if not the redacted placeholder
  if (body.smtpPass !== undefined && body.smtpPass !== '••••••••') {
    data.smtpPass = body.smtpPass || null;
  }

  // AI settings
  if (body.aiEnabled  !== undefined) data.aiEnabled  = Boolean(body.aiEnabled);
  if (body.aiProvider !== undefined) data.aiProvider = body.aiProvider || null;
  if (body.aiModel    !== undefined) data.aiModel    = body.aiModel || null;
  if (body.aiBaseUrl  !== undefined) data.aiBaseUrl  = body.aiBaseUrl || null;
  if (body.aiApiKey !== undefined && body.aiApiKey !== '••••••••') {
    data.aiApiKey = body.aiApiKey || null;
  }

  // Risk & review settings
  if (body.riskThresholds           !== undefined) data.riskThresholds           = typeof body.riskThresholds === 'string' ? body.riskThresholds : JSON.stringify(body.riskThresholds);
  if (body.annualReviewMonth        !== undefined) data.annualReviewMonth        = Number(body.annualReviewMonth);
  if (body.documentExpiryLeadDays   !== undefined) data.documentExpiryLeadDays   = Number(body.documentExpiryLeadDays);

  // Notifications
  if (body.notifyDocumentExpiry    !== undefined) data.notifyDocumentExpiry    = Boolean(body.notifyDocumentExpiry);
  if (body.notifyQuestionnairesDue !== undefined) data.notifyQuestionnairesDue = Boolean(body.notifyQuestionnairesDue);
  if (body.notifyNewVendorRequests !== undefined) data.notifyNewVendorRequests = Boolean(body.notifyNewVendorRequests);

  // Lifecycle
  if (body.requireSecurityReview !== undefined) data.requireSecurityReview = Boolean(body.requireSecurityReview);
  if (body.requireLegalReview    !== undefined) data.requireLegalReview    = Boolean(body.requireLegalReview);
  if (body.requireExecApproval   !== undefined) data.requireExecApproval   = Boolean(body.requireExecApproval);

  // Questionnaire
  if (body.defaultQuestionnaireIds  !== undefined) data.defaultQuestionnaireIds  = typeof body.defaultQuestionnaireIds === 'string' ? body.defaultQuestionnaireIds : JSON.stringify(body.defaultQuestionnaireIds);
  if (body.allowGuestQuestionnaire  !== undefined) data.allowGuestQuestionnaire  = Boolean(body.allowGuestQuestionnaire);
  if (body.guestLinkExpireDays      !== undefined) data.guestLinkExpireDays      = Number(body.guestLinkExpireDays);

  // Branding/theme
  if (body.branding !== undefined) {
    data.branding = typeof body.branding === 'string' ? body.branding : JSON.stringify(body.branding);
  }

  // Also update tenant-level AI feature flag
  if (body.aiEnabled !== undefined) {
    await prisma.tenant.update({ where: { id: session.tenantId }, data: { enableAiReview: Boolean(body.aiEnabled) } });
  }

  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: session.tenantId },
    update: data,
    create: { tenantId: session.tenantId, ...data },
  });

  return NextResponse.json({ success: true, settings: { ...settings, smtpPass: settings.smtpPass ? '••••••••' : null, aiApiKey: settings.aiApiKey ? '••••••••' : null } });
}
