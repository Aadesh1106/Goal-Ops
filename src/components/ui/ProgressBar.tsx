import { cn, getProgressBgColor } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'auto'; // auto = color based on value
}

export function ProgressBar({
  value,
  className,
  showLabel = false,
  size = 'md',
  color = 'auto',
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' };
  const fillColor =
    color === 'brand'
      ? 'bg-indigo-500'
      : getProgressBgColor(clamped);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('progress-bar flex-1', heights[size])}>
        <div
          className={cn('progress-fill', fillColor, heights[size])}
          style={{ width: `${clamped}%`, background: color === 'brand' ? 'var(--brand-gradient)' : undefined }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium tabular-nums w-8 text-right"
          style={{ color: 'var(--text-secondary)' }}>
          {clamped}%
        </span>
      )}
    </div>
  );
}

interface WeightageBarProps {
  used: number;   // 0–100
  max?: number;
}

export function WeightageBar({ used, max = 100 }: WeightageBarProps) {
  const pct = Math.min((used / max) * 100, 100);
  const remaining = max - used;
  const overLimit = used > max;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: 'var(--text-muted)' }}>Weightage Used</span>
        <span className={overLimit ? 'text-red-400 font-semibold' : ''} style={{ color: overLimit ? undefined : 'var(--text-secondary)' }}>
          {used}% / {max}%
        </span>
      </div>
      <div className="progress-bar h-2">
        <div
          className={cn('progress-fill h-2', overLimit ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : '')}
          style={{
            width: `${pct}%`,
            background: overLimit ? '#ef4444' : pct >= 100 ? '#10b981' : 'var(--brand-gradient)',
          }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1.5">
        <span style={{ color: overLimit ? 'var(--status-error)' : 'var(--text-muted)' }}>
          {overLimit ? `Exceeds limit by ${used - max}%` : `${remaining}% remaining`}
        </span>
        {used === max && (
          <span className="text-emerald-400 font-medium">✓ Perfect balance</span>
        )}
      </div>
    </div>
  );
}
