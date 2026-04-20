export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight font-serif">
            Vengagement
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Vendor Risk Management Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
