import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/db/prisma';
import { validateDocumentFile } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const assignment = await prisma.questionnaireAssignment.findUnique({
    where: { accessToken: token },
    include: { vendor: { select: { id: true, tenantId: true } } },
  });

  if (!assignment) return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
  if (assignment.accessTokenExpiry && assignment.accessTokenExpiry < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const documentRequestId = formData.get('documentRequestId') as string | null;
  const documentType = (formData.get('documentType') as string) ?? 'Other';
  const docName = (formData.get('name') as string) || file?.name || 'Document';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const fileCheck = validateDocumentFile(file);
  if (!fileCheck.ok) return NextResponse.json({ error: fileCheck.error }, { status: 400 });

  const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
  let fileUrl: string | null = null;
  let fileKey: string | null = null;

  if (BLOB_TOKEN) {
    const ext = file.name.split('.').pop() ?? 'bin';
    const filename = `vendor-docs/${assignment.vendorId}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const blob = await put(filename, bytes, { access: 'public', token: BLOB_TOKEN });
    fileUrl = blob.url;
    fileKey = blob.pathname;
  }

  const document = await prisma.vendorDocument.create({
    data: {
      tenantId: assignment.vendor.tenantId,
      vendorId: assignment.vendorId,
      documentType,
      name: docName,
      fileUrl,
      fileKey,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  // Mark document request as received
  if (documentRequestId) {
    await prisma.documentRequest.update({
      where: { id: documentRequestId },
      data: { status: 'received' },
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, document: { id: document.id, name: document.name, fileUrl } });
}
