import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { SESSION_COOKIE, validateSessionToken, isCompanyAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isCompanyAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFrom } = await req.json();

  if (!smtpHost) return NextResponse.json({ error: 'SMTP host is required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, name: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort ?? 587,
      secure: smtpSecure ?? false,
      ...(smtpUser && smtpPass ? { auth: { user: smtpUser, pass: smtpPass } } : {}),
    });

    await transport.verify();

    await transport.sendMail({
      from: smtpFrom || smtpUser || 'noreply@vengagement.app',
      to: user.email,
      subject: 'Vengagement — SMTP Test',
      text: `Hello ${user.name},\n\nThis is a test email confirming your SMTP configuration is working correctly.\n\nSent from Vengagement Settings.`,
      html: `<p>Hello ${user.name},</p><p>This is a test email confirming your SMTP configuration is working correctly.</p><p style="color:#6b7280;font-size:12px;">Sent from Vengagement Settings.</p>`,
    });

    return NextResponse.json({ success: true, to: user.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
