import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken, isResponder } from '@/lib/auth/session';
import { BUILT_IN_QUESTIONNAIRES } from '@/lib/data-questionnaires';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Single questionnaire fetch (for builder edit)
  const singleId = req.nextUrl.searchParams.get('id');
  if (singleId) {
    const q = await prisma.questionnaire.findFirst({
      where: { id: singleId, OR: [{ tenantId: session.tenantId }, { isBuiltIn: true }] },
    });
    if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ questionnaire: q });
  }

  const dbQuestionnaires = await prisma.questionnaire.findMany({
    where: {
      OR: [
        { tenantId: session.tenantId },
        { isBuiltIn: true },
        { isPublic: true },
      ],
      isActive: true,
    },
    orderBy: [{ isBuiltIn: 'desc' }, { name: 'asc' }],
  });

  // Merge built-in templates (from code) with DB entries
  const dbIds = new Set(dbQuestionnaires.map((q) => q.id));
  const builtIns = BUILT_IN_QUESTIONNAIRES.filter((q) => !dbIds.has(q.id)).map((q) => ({
    ...q,
    tenantId: null,
    isActive: true,
    isPublic: false,
    createdBy: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    sections: JSON.stringify(q.sections),
    _count: { assignments: 0 },
  }));

  const questionnaires = [
    ...builtIns,
    ...dbQuestionnaires.map((q) => ({ ...q, sections: q.sections })),
  ];

  return NextResponse.json({ questionnaires });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();

  const questionnaire = await prisma.questionnaire.create({
    data: {
      tenantId: session.tenantId,
      name: body.name,
      description: body.description || null,
      type: body.type ?? 'custom',
      version: body.version ?? '1.0',
      sections: typeof body.sections === 'string' ? body.sections : JSON.stringify(body.sections),
      isBuiltIn: false,
      isActive: true,
      isPublic: false,
      createdBy: session.userId,
    },
  });

  return NextResponse.json({ success: true, questionnaire }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session || !isResponder(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, ...body } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const existing = await prisma.questionnaire.findFirst({
    where: { id, tenantId: session.tenantId, isBuiltIn: false },
  });
  if (!existing) return NextResponse.json({ error: 'Not found or not editable' }, { status: 404 });

  const questionnaire = await prisma.questionnaire.update({
    where: { id },
    data: {
      name:        body.name        ?? undefined,
      description: body.description !== undefined ? (body.description || null) : undefined,
      sections:    body.sections    !== undefined ? (typeof body.sections === 'string' ? body.sections : JSON.stringify(body.sections)) : undefined,
    },
  });

  return NextResponse.json({ success: true, questionnaire });
}
