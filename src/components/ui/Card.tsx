import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  noPadding?: boolean;
}

export function Card({ className, hover = true, noPadding, children, ...props }: CardProps) {
  return (
    <div
      className={cn('card', !noPadding && '', hover && 'hover:border-indigo-500/20', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-semibold text-sm', className)}
      style={{ color: 'var(--text-primary)' }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardSubtitle({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs mt-0.5', className)} style={{ color: 'var(--text-muted)' }} {...props}>
      {children}
    </p>
  );
}
