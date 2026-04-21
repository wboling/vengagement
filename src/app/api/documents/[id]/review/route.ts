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
    const body = await req.json().catch(() => null);

    if (typeof body?.extractedText === 'string' && body.extractedText.trim().length > 0) {
      // Text was extracted at upload time and passed directly — use it
      fileText = body.extractedText;
    } else if (document.fileUrl) {
      // Fall back to fetching from Vercel Blob
      const response = await fetch(document.fileUrl);
      if (!response.ok) throw new Error(`Could not fetch file: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fileText = await extractTextFromBuffer(buffer, document.mimeType ?? 'application/pdf');
    } else {
      console.error(`[AI Review] doc=${id}: no extractedText in body and no fileUrl`);
      await prisma.vendorDocument.update({ where: { id }, data: { aiReviewStatus: 'failed' } });
      return NextResponse.json({ error: 'No file content available for review. Re-upload the document to retry.' }, { status: 400 });
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
