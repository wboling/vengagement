import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both current and new password are required' }, { status: 400 });
  }

  if (newPassword.length < 12) {
    return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: 'Password auth not configured' }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash, mustChangePw: false },
  });

  await prisma.authAuditLog.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      email: session.user.email,
      eventType: 'password_change',
    },
  });

  return NextResponse.json({ success: true });
}
