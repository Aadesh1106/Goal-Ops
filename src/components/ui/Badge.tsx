import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/utils';
import type { GoalStatus } from '@/types';

type BadgeVariant = GoalStatus | 'pending' | 'open' | 'resolved' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}

const VARIANT_MAP: Record<string, { bg: string; text: string; border: string }> = {
  ...STATUS_COLORS,
  default: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
};

export function Badge({ variant = 'default', className, children, dot }: BadgeProps) {
  const colors = VARIANT_MAP[variant] ?? VARIANT_MAP.default;
  return (
    <span
      className={cn(
        'badge',
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', colors.text.replace('text-', 'bg-'))} />
      )}
      {children}
    </span>
  );
}
