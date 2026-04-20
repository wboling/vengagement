import { AuthProvider } from '@/lib/auth/context';
import { AppProvider } from '@/lib/store';
import { ThemeProvider } from '@/lib/theme';
import { ClientLayout } from '@/components/layout/ClientLayout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
