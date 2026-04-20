import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/db/prisma';
import { validateSessionFromRequest, isCompanyAdmin } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await validateSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isCompanyAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const document = await prisma.vendorDocument.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (document.fileUrl) {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      try {
        await del(document.fileUrl, { token: blobToken });
      } catch {
        // Non-fatal — proceed with DB delete
      }
    }
  }

  await prisma.vendorDocument.delete({ where: { id } });
  await logAudit(session, 'delete', 'document', id, document.name, undefined, req);

  return NextResponse.json({ success: true });
}
