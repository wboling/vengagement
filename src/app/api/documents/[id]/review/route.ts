import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateSessionFromRequest, isResponder } from '@/lib/auth/session';
import { reviewDocument, extractTextFromBuffer } from '@/lib/ai/document-review';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await validateSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const document = await prisma.vendorDocument.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Check tenant has AI enabled
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: session.tenantId } });
  if (!settings?.aiEnabled) {
    return NextResponse.json({ error: 'AI review not configured. Enable it in Settings → AI Configuration.' }, { status: 400 });
  }

  let fileText: string;

  // If a buffer was passed directly (from upload flow)
  const body = await req.json().catch(() => null);
  if (body?.buffer && body?.mimeType) {
    const buffer = Buffer.from(body.buffer, 'base64');
    fileText = await extractTextFromBuffer(buffer, body.mimeType);
  } else if (document.fileUrl) {
    // Fetch from Vercel Blob
    const response = await fetch(document.fileUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Could not retrieve file for review' }, { status: 400 });
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fileText = await extractTextFromBuffer(buffer, document.mimeType ?? 'application/pdf');
  } else {
    return NextResponse.json({ error: 'No file available for review' }, { status: 400 });
  }

  const result = await reviewDocument(id, session.tenantId, fileText);

  return NextResponse.json({ success: true, result });
}
