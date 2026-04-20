import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, validateSessionToken } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });

  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      tenantId: session.tenantId,
      mfaEnabled: session.user.mfaEnabled,
      mustChangePw: session.user.mustChangePw,
    },
    tenant: {
      id: session.tenant.id,
      name: session.tenant.name,
      industry: session.tenant.industry,
      logoUrl: session.tenant.logoUrl,
      enableVendors: session.tenant.enableVendors,
      enableQuestionnaires: session.tenant.enableQuestionnaires,
      enableDocuments: session.tenant.enableDocuments,
      enableReports: session.tenant.enableReports,
      enableLifecycle: session.tenant.enableLifecycle,
      enableAiReview: session.tenant.enableAiReview,
    },
  });
}
