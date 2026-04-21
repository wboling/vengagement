import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isCompanyAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isCompanyAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
  if (!BLOB_TOKEN) return NextResponse.json({ error: 'File storage not configured' }, { status: 503 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPG, SVG, or WEBP files are accepted' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'png';
  const filename = `logos/${session.tenantId}-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const blob = await put(filename, bytes, { access: 'public', token: BLOB_TOKEN });

  // Update branding JSON with logoUrl
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: session.tenantId } });
  let branding: Record<string, unknown> = {};
  try { branding = JSON.parse(settings?.branding ?? '{}'); } catch {}
  branding.logoUrl = blob.url;

  await prisma.tenantSettings.upsert({
    where: { tenantId: session.tenantId },
    update: { branding: JSON.stringify(branding) },
    create: { tenantId: session.tenantId, branding: JSON.stringify(branding) },
  });

  // Also update Tenant.logoUrl for convenience
  await prisma.tenant.update({ where: { id: session.tenantId }, data: { logoUrl: blob.url } });

  return NextResponse.json({ success: true, logoUrl: blob.url });
}
