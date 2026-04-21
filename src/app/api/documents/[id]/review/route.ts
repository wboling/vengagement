import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateSessionFromRequest, isResponder } from '@/lib/auth/session';
import { reviewDocument, extractTextFromBuffer } from '@/lib/ai/document-review';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await validateSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const document = await prisma.vendorDocument.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Check tenant AI config or fall back to platform env vars
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: session.tenantId } });
  const hasPlatformAi = !!(process.env.AI_API_KEY && process.env.AI_PROVIDER);
  if (!settings?.aiEnabled && !hasPlatformAi) {
    console.error(`[AI Review] doc=${id} tenant=${session.tenantId}: AI not configured (aiEnabled=${settings?.aiEnabled}, hasPlatformAi=${hasPlatformAi})`);
    return NextResponse.json({ error: 'AI review not configured. Enable it in Settings → AI Configuration.' }, { status: 400 });
  }

  let fileText: string;

  try {
    // If a buffer was passed directly (from upload flow), ignore it and use Blob URL
    if (document.fileUrl) {
      const response = await fetch(document.fileUrl);
      if (!response.ok) throw new Error(`Could not fetch file: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fileText = await extractTextFromBuffer(buffer, document.mimeType ?? 'application/pdf');
    } else {
      // Last-resort: try to use a buffer passed in the body
      const body = await req.json().catch(() => null);
      if (body?.buffer && body?.mimeType) {
        const buffer = Buffer.from(body.buffer, 'base64');
        fileText = await extractTextFromBuffer(buffer, body.mimeType);
      } else {
        console.error(`[AI Review] doc=${id}: no fileUrl and no buffer in request body`);
        await prisma.vendorDocument.update({ where: { id }, data: { aiReviewStatus: 'failed' } });
        return NextResponse.json({ error: 'No file available for review' }, { status: 400 });
      }
    }
  } catch (err) {
    console.error(`[AI Review] doc=${id} text extraction failed:`, (err as Error).message);
    await prisma.vendorDocument.update({ where: { id }, data: { aiReviewStatus: 'failed' } });
    return NextResponse.json({ error: `Text extraction failed: ${(err as Error).message}` }, { status: 400 });
  }

  console.log(`[AI Review] doc=${id} extracted ${fileText.length} chars, starting review`);
  const result = await reviewDocument(id, session.tenantId, fileText);

  return NextResponse.json({ success: true, result });
}
