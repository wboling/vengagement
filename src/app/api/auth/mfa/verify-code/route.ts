import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, hashToken } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

  const codeHash = createHash('sha256').update(String(code)).digest('hex');

  const record = await prisma.mfaCode.findFirst({
    where: {
      userId: session.userId,
      codeHash,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.mfaCode.update({ where: { id: record.id }, data: { used: true } }),
    prisma.session.update({ where: { tokenHash: hashToken(token) }, data: { mfaVerified: true } }),
  ]);

  return NextResponse.json({ success: true });
}
