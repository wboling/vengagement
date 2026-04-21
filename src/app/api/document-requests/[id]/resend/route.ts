import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';
import { sendDocumentRequestReminder } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const request = await prisma.documentRequest.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { vendor: { select: { name: true, primaryContactEmail: true } } },
  });
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const to = request.vendor.primaryContactEmail;
  if (!to) {
    return NextResponse.json(
      { error: 'No primary contact email on this vendor. Add one via Edit Vendor.' },
      { status: 400 }
    );
  }

  try {
    await sendDocumentRequestReminder(
      to,
      request.vendor.name,
      [{ label: request.label ?? request.documentType, dueDate: request.dueDate, nistRef: request.nistRef }],
      session.tenantId
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ success: true, to });
}
