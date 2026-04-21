import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateSessionFromRequest } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await validateSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const document = await prisma.vendorDocument.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, fileUrl: true, fileName: true, mimeType: true },
  });
  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!document.fileUrl) return NextResponse.json({ error: 'File not available' }, { status: 404 });

  const privateToken = process.env.BLOB_PRIVATE_READ_WRITE_TOKEN;
  if (!privateToken) return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });

  const blobResponse = await fetch(document.fileUrl, {
    headers: { Authorization: `Bearer ${privateToken}` },
  });

  if (!blobResponse.ok) {
    return NextResponse.json({ error: 'Could not retrieve file' }, { status: 502 });
  }

  const contentType = document.mimeType ?? blobResponse.headers.get('content-type') ?? 'application/octet-stream';
  const filename = encodeURIComponent(document.fileName ?? document.id);

  return new NextResponse(blobResponse.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
