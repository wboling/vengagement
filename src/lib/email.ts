import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db/prisma';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

async function getSmtpConfig(tenantId?: string): Promise<SmtpConfig | null> {
  // 1. Try tenant-level settings
  if (tenantId) {
    const ts = await prisma.tenantSettings.findUnique({ where: { tenantId } });
    if (ts?.smtpHost) {
      return {
        host: ts.smtpHost,
        port: ts.smtpPort ?? 587,
        secure: ts.smtpSecure,
        user: ts.smtpUser ?? undefined,
        pass: ts.smtpPass ?? undefined,
        from: ts.smtpFrom ?? ts.smtpUser ?? 'noreply@vengagement.app',
      };
    }
  }

  // 2. Try platform-level settings (DB)
  const platformSettings = await prisma.platformSetting.findMany({
    where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from'] } },
  });
  const ps: Record<string, string> = {};
  for (const s of platformSettings) ps[s.key] = s.value;

  if (ps.smtp_host) {
    return {
      host: ps.smtp_host,
      port: parseInt(ps.smtp_port ?? '587'),
      secure: ps.smtp_secure === 'true',
      user: ps.smtp_user,
      pass: ps.smtp_pass,
      from: ps.smtp_from ?? ps.smtp_user ?? 'noreply@vengagement.app',
    };
  }

  // 3. Fall back to env vars
  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@vengagement.app',
    };
  }

  return null;
}

async function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
  });
}

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Vengagement';
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function htmlWrap(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#0f1525;border-radius:12px;border:1px solid #1e2d45;overflow:hidden;">
    <div style="padding:24px 32px;background:#131929;border-bottom:1px solid #1e2d45;">
      <span style="font-size:20px;font-weight:700;color:#e8edf5;letter-spacing:-0.3px;">${appName}</span>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="padding:16px 32px;background:#131929;border-top:1px solid #1e2d45;text-align:center;">
      <p style="margin:0;font-size:12px;color:#4a5a72;">This email was sent by ${appName}. Do not reply.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendMfaCode(
  to: string,
  name: string,
  code: string,
  tenantId?: string
): Promise<void> {
  const config = await getSmtpConfig(tenantId);
  if (!config) throw new Error('SMTP not configured');

  const transporter = await createTransporter(config);
  const content = `
    <p style="color:#8899b4;margin-top:0;">Hello ${name},</p>
    <p style="color:#8899b4;">Your verification code is:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#4f46e5;font-family:monospace;">${code}</span>
    </div>
    <p style="color:#4a5a72;font-size:13px;">This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>`;

  await transporter.sendMail({
    from: config.from,
    to,
    subject: `${appName} — Your verification code: ${code}`,
    html: htmlWrap(content),
    text: `Hello ${name},\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string,
  tenantId?: string
): Promise<void> {
  const config = await getSmtpConfig(tenantId);
  if (!config) throw new Error('SMTP not configured');

  const transporter = await createTransporter(config);
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
  const content = `
    <p style="color:#8899b4;margin-top:0;">Hello ${name},</p>
    <p style="color:#8899b4;">A password reset was requested for your account. Click the button below to set a new password.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Reset Password</a>
    </div>
    <p style="color:#4a5a72;font-size:13px;">This link expires in 24 hours. If you did not request a reset, you can safely ignore this email.</p>`;

  await transporter.sendMail({
    from: config.from,
    to,
    subject: `${appName} — Password Reset Request`,
    html: htmlWrap(content),
    text: `Hello ${name},\n\nReset your password here: ${resetUrl}\n\nThis link expires in 24 hours.`,
  });
}

export async function sendQuestionnaireInvite(
  to: string,
  vendorName: string,
  questionnaireName: string,
  accessToken: string,
  dueDate: Date | null,
  tenantId: string
): Promise<void> {
  const config = await getSmtpConfig(tenantId);
  if (!config) throw new Error('SMTP not configured');

  const transporter = await createTransporter(config);
  const url = `${appUrl}/q/${accessToken}`;
  const dueLine = dueDate
    ? `<p style="color:#8899b4;">Please complete this questionnaire by <strong style="color:#e8edf5;">${new Date(dueDate).toLocaleDateString()}</strong>.</p>`
    : '';

  const content = `
    <p style="color:#8899b4;margin-top:0;">Hello,</p>
    <p style="color:#8899b4;">You have been invited to complete a vendor security questionnaire on behalf of <strong style="color:#e8edf5;">${vendorName}</strong>.</p>
    <p style="color:#8899b4;"><strong style="color:#e8edf5;">Questionnaire:</strong> ${questionnaireName}</p>
    ${dueLine}
    <div style="text-align:center;margin:32px 0;">
      <a href="${url}" style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Complete Questionnaire</a>
    </div>
    <p style="color:#4a5a72;font-size:13px;">You do not need an account to complete this questionnaire. The link above is unique to you — please do not share it.</p>`;

  await transporter.sendMail({
    from: config.from,
    to,
    subject: `${appName} — Vendor Security Questionnaire: ${questionnaireName}`,
    html: htmlWrap(content),
    text: `You have been invited to complete a vendor security questionnaire.\n\nQuestionnaire: ${questionnaireName}\nLink: ${url}`,
  });
}

export async function sendQuestionnaireReminder(
  to: string,
  vendorName: string,
  questionnaireName: string,
  accessToken: string,
  dueDate: Date | null,
  tenantId: string
): Promise<void> {
  const config = await getSmtpConfig(tenantId);
  if (!config) throw new Error('SMTP not configured');

  const transporter = await createTransporter(config);
  const url = `${appUrl}/q/${accessToken}`;
  const dueLine = dueDate
    ? ` The deadline is <strong style="color:#e8edf5;">${new Date(dueDate).toLocaleDateString()}</strong>.`
    : '';

  const content = `
    <p style="color:#8899b4;margin-top:0;">Hello,</p>
    <p style="color:#8899b4;">This is a reminder to complete the vendor security questionnaire for <strong style="color:#e8edf5;">${vendorName}</strong>.${dueLine}</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${url}" style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Complete Questionnaire</a>
    </div>`;

  await transporter.sendMail({
    from: config.from,
    to,
    subject: `[Reminder] ${appName} — Questionnaire Due: ${questionnaireName}`,
    html: htmlWrap(content),
    text: `Reminder: Please complete the questionnaire "${questionnaireName}" for ${vendorName}.\n\nLink: ${url}`,
  });
}

export async function sendLifecycleApprovalRequest(
  to: string,
  approverName: string,
  vendorName: string,
  requestId: string,
  stepType: string,
  tenantId: string
): Promise<void> {
  const config = await getSmtpConfig(tenantId);
  if (!config) return;

  const transporter = await createTransporter(config);
  const url = `${appUrl}/lifecycle/${requestId}`;
  const stepLabel: Record<string, string> = {
    security_review: 'Security Review',
    legal_review: 'Legal Review',
    exec_approval: 'Executive Approval',
  };

  const content = `
    <p style="color:#8899b4;margin-top:0;">Hello ${approverName},</p>
    <p style="color:#8899b4;">Your approval is required for the onboarding of a new vendor: <strong style="color:#e8edf5;">${vendorName}</strong>.</p>
    <p style="color:#8899b4;"><strong style="color:#e8edf5;">Step:</strong> ${stepLabel[stepType] ?? stepType}</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${url}" style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Review Request</a>
    </div>`;

  await transporter.sendMail({
    from: config.from,
    to,
    subject: `${appName} — Approval Required: ${vendorName} (${stepLabel[stepType] ?? stepType})`,
    html: htmlWrap(content),
    text: `Approval required for vendor onboarding: ${vendorName}\nStep: ${stepLabel[stepType] ?? stepType}\nLink: ${url}`,
  });
}

export async function sendDocumentRequestReminder(
  to: string,
  vendorName: string,
  documents: Array<{ label: string; dueDate: Date | null; nistRef: string | null }>,
  tenantId: string
): Promise<void> {
  const config = await getSmtpConfig(tenantId);
  if (!config) throw new Error('SMTP not configured');

  const transporter = await createTransporter(config);

  const rows = documents
    .map((d) => {
      const due = d.dueDate
        ? `<span style="color:#f59e0b;"> — Due ${new Date(d.dueDate).toLocaleDateString()}</span>`
        : '';
      const ref = d.nistRef ? ` <span style="font-size:11px;color:#4a5a72;">(${d.nistRef})</span>` : '';
      return `<li style="margin:6px 0;color:#8899b4;">${d.label}${ref}${due}</li>`;
    })
    .join('');

  const content = `
    <p style="color:#8899b4;margin-top:0;">Hello,</p>
    <p style="color:#8899b4;">The following documents have been requested from <strong style="color:#e8edf5;">${vendorName}</strong> and are still pending:</p>
    <ul style="padding-left:20px;margin:16px 0;">
      ${rows}
    </ul>
    <p style="color:#8899b4;">Please provide these documents at your earliest convenience to ensure compliance.</p>`;

  await transporter.sendMail({
    from: config.from,
    to,
    subject: `${appName} — Document Request Reminder: ${vendorName}`,
    html: htmlWrap(content),
    text: `Document Request Reminder for ${vendorName}\n\nPending documents:\n${documents.map((d) => `- ${d.label}${d.dueDate ? ` (Due: ${new Date(d.dueDate).toLocaleDateString()})` : ''}`).join('\n')}`,
  });
}

export async function sendDocumentExpiryAlert(
  to: string,
  name: string,
  vendorName: string,
  documentName: string,
  expiresAt: Date,
  tenantId: string
): Promise<void> {
  const config = await getSmtpConfig(tenantId);
  if (!config) return;

  const transporter = await createTransporter(config);
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const content = `
    <p style="color:#8899b4;margin-top:0;">Hello ${name},</p>
    <p style="color:#8899b4;">A vendor document is expiring soon and requires attention.</p>
    <div style="background:#131929;border:1px solid #1e2d45;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="margin:0 0 8px;color:#8899b4;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Vendor</p>
      <p style="margin:0 0 16px;color:#e8edf5;font-weight:600;">${vendorName}</p>
      <p style="margin:0 0 8px;color:#8899b4;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Document</p>
      <p style="margin:0 0 16px;color:#e8edf5;">${documentName}</p>
      <p style="margin:0 0 8px;color:#8899b4;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Expires</p>
      <p style="margin:0;color:#f59e0b;font-weight:600;">${expiresAt.toLocaleDateString()} (${daysLeft} days)</p>
    </div>
    <p style="color:#8899b4;">Please renew or replace this document before it expires to maintain compliance.</p>`;

  await transporter.sendMail({
    from: config.from,
    to,
    subject: `${appName} — Document Expiring: ${documentName} (${daysLeft} days)`,
    html: htmlWrap(content),
    text: `Document expiring: ${documentName} for vendor ${vendorName}\nExpires: ${expiresAt.toLocaleDateString()} (${daysLeft} days)`,
  });
}
