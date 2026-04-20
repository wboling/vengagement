import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken } from '@/lib/auth/session';
import { sendPasswordResetEmail } from '@/lib/email';

function validatePasswordStrength(password: string): string | null {
  if (password.length < 12) return 'Password must be at least 12 characters';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must include a number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a special character';
  return null;
}

// POST: request a reset link
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: true }); // always succeed to prevent enumeration

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return NextResponse.json({ success: true });

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    await prisma.pwResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendPasswordResetEmail(user.email, user.name, token, user.tenantId).catch(console.error);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password request error:', err);
    return NextResponse.json({ success: true }); // don't leak errors
  }
}

// PATCH: consume a reset token and set new password
export async function PATCH(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    const strengthError = validatePasswordStrength(password);
    if (strengthError) return NextResponse.json({ error: strengthError }, { status: 400 });

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await prisma.pwResetToken.findFirst({
      where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
    });

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash, mustChangePw: false, failedAttempts: 0, lockedUntil: null } }),
      prisma.pwResetToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
