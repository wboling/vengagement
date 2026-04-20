import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { validateSessionToken, isAdmin, SESSION_COOKIE } from '@/lib/auth/session';

export default async function AdminSubLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect('/login');
  const session = await validateSessionToken(token);
  if (!session || !isAdmin(session)) redirect('/dashboard');
  return <>{children}</>;
}
