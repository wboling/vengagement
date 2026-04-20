import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const vendorId = formData.get('vendorId') as string | null;
  const clientId = formData.get('clientId') as string | null;
  const documentType = formData.get('documentType') as string ?? 'Other';
  const name = formData.get('name') as string ?? file?.name ?? 'Document';
  const description = formData.get('description') as string | null;
  const documentDate = formData.get('documentDate') as string | null;
  const expiresAt = formData.get('expiresAt') as string | null;
  const renewalDate = formData.get('renewalDate') as string | null;
  const tags = formData.get('tags') as string | null;
  const triggerAiReview = formData.get('triggerAiReview') === 'true';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (vendorId) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId: session.tenantId } });
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }
  if (clientId) {
    const client = await prisma.client.findFirst({ where: { id: clientId, tenantId: session.tenantId } });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const storageKey = `${session.tenantId}/${vendorId ?? clientId ?? 'general'}/${Date.now()}-${file.name}`;

  let fileUrl: string | null = null;
  let fileKey: string | null = storageKey;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const hasValidToken = blobToken && blobToken.startsWith('vercel_blob_rw_') && blobToken.length > 30;

  if (hasValidToken) {
    try {
      const blob = await put(storageKey, buffer, {
        access: 'public',
        contentType: file.type,
        token: blobToken,
      });
      fileUrl = blob.url;
      fileKey = blob.pathname;
    } catch (err) {
      console.warn('Vercel Blob upload failed, storing reference only:', err);
    }
  }

  const document = await prisma.vendorDocument.create({
    data: {
      vendorId: vendorId ?? null,
      clientId: clientId ?? null,
      tenantId: session.tenantId,
      documentType,
      name,
      description: description || null,
      fileKey,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      documentDate: documentDate ? new Date(documentDate) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      renewalDate: renewalDate ? new Date(renewalDate) : null,
      uploadedBy: session.userId,
      tags: tags ?? '[]',
      aiReviewStatus: triggerAiReview ? 'pending' : 'not_reviewed',
    },
  });

  await logAudit(session, 'upload', 'document', document.id, document.name, { documentType: document.documentType }, req);

  // Queue AI review asynchronously if requested
  if (triggerAiReview && document.id) {
    const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: session.tenantId } });
    const hasPlatformAi = !!(process.env.AI_API_KEY && process.env.AI_PROVIDER);
    if (settings?.aiEnabled || hasPlatformAi) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      fetch(`${appUrl}/api/documents/${document.id}/review`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: `vg_session=${token}`,
        },
        body: JSON.stringify({ buffer: buffer.toString('base64'), mimeType: file.type }),
      }).catch(console.error);
    }
  }

  return NextResponse.json({ success: true, document }, { status: 201 });
}
