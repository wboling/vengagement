import { NextRequest, NextResponse } from 'next/server';
import { randomInt, createHash } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken } from '@/lib/auth/session';
import { sendMfaCode } from '@/lib/email';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const code = String(randomInt(100000, 999999));
  const codeHash = createHash('sha256').update(code).digest('hex');

  await prisma.mfaCode.create({
    data: {
      userId: session.userId,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendMfaCode(session.user.email, session.user.name, code, session.tenantId);
  return NextResponse.json({ success: true });
}
