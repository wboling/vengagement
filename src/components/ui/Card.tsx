import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

export function Card({ children, className, padding = 'md', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl',
        PADDING[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-sm font-semibold text-[var(--color-text-primary)]', className)}>
      {children}
    </h2>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
  accent?: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
          {sub && <p className="text-xs text-[var(--color-text-muted)] mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg', accent ?? 'bg-indigo-500/10')}>
            <Icon size={18} className={accent ? '' : 'text-indigo-400'} />
          </div>
        )}
      </div>
    </Card>
  );
}
