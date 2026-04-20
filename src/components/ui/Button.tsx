import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ElementType;
  iconRight?: React.ElementType;
}

const VARIANTS = {
  primary:   'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent',
  secondary: 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] border-[var(--color-border)]',
  ghost:     'bg-transparent hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-transparent',
  danger:    'bg-rose-600 hover:bg-rose-700 text-white border-transparent',
  outline:   'bg-transparent hover:bg-indigo-500/10 text-indigo-400 border-indigo-500/40',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-lg gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 12 : 14} />
      )}
      {children}
      {IconRight && !loading && <IconRight size={size === 'sm' ? 12 : 14} />}
    </button>
  );
}
