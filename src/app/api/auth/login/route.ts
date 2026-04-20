import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { createSession, SESSION_COOKIE, SESSION_DURATION_MS } from '@/lib/auth/session';

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const COMMON_PASSWORDS = new Set([
  'Password1!', 'Admin@1234', 'Welcome1!', 'password', 'Passw0rd!',
]);

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check lock status
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await prisma.authAuditLog.create({
        data: { tenantId: user.tenantId, userId: user.id, email: user.email, eventType: 'login_fail', ipAddress: req.headers.get('x-forwarded-for') ?? undefined, metadata: JSON.stringify({ reason: 'account_locked' }) },
      });
      return NextResponse.json({ error: 'Account temporarily locked. Try again later.' }, { status: 403 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Password login not enabled for this account' }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      const attempts = user.failedAttempts + 1;
      const shouldLock = attempts >= LOCKOUT_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : undefined,
        },
      });
      await prisma.authAuditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          email: user.email,
          eventType: shouldLock ? 'lockout' : 'login_fail',
          ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
          metadata: JSON.stringify({ attempts }),
        },
      });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Successful password auth
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLogin: new Date() },
    });

    const token = await createSession(user.id, user.tenantId, {
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    await prisma.authAuditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        email: user.email,
        eventType: 'login_success',
        ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      },
    });

    const requiresMfa = user.mfaEnabled;

    const response = NextResponse.json({
      success: true,
      requiresMfa,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
