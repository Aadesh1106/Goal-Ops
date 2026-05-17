import { cn } from '@/lib/utils';
import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn('form-input px-4 py-2.5 text-base', error && 'border-red-500/50 focus:border-red-500', className)}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: 'var(--status-error)' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="form-label">{label}</label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn('form-input px-4 py-2.5 text-base', className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs" style={{ color: 'var(--status-error)' }}>{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <textarea
        ref={ref}
        id={id}
        rows={3}
        className={cn('form-input resize-none', error && 'border-red-500/50', className)}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: 'var(--status-error)' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';
