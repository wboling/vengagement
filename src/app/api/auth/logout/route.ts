import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, invalidateSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await invalidateSession(token);

  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
