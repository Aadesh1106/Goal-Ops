// ============================================================
// GoalOps Enterprise — Shared Utility Functions
// ============================================================
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type ApiResponse } from '@/types';

// ─── Tailwind class merger ─────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── API Response helpers ─────────────────────────────────────
export function successResponse<T>(data: T): ApiResponse<T> {
  return { data, error: null, success: true };
}

export function errorResponse<T>(error: string): ApiResponse<T> {
  return { data: null, error, success: false };
}

// ─── Goal Validation ─────────────────────────────────────────
export function calculateTotalWeightage(weightages: number[]): number {
  return weightages.reduce((sum, w) => sum + w, 0);
}

export function validateWeightage(
  weightages: number[],
  newWeight: number,
  excludeIndex?: number
): { valid: boolean; message?: string } {
  const others = excludeIndex !== undefined
    ? weightages.filter((_, i) => i !== excludeIndex)
    : weightages;
  const total = calculateTotalWeightage([...others, newWeight]);

  if (newWeight < 10) return { valid: false, message: 'Minimum weightage is 10%' };
  if (newWeight > 50) return { valid: false, message: 'Maximum weightage is 50%' };
  if (total > 100) return { valid: false, message: `Total weightage exceeds 100% (current: ${total}%)` };
  return { valid: true };
}

// ─── Date helpers ─────────────────────────────────────────────
export function formatDate(dateStr: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateStr);
}

// ─── Progress calculations ────────────────────────────────────
export function calculateProgress(actual: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((actual / target) * 100), 100);
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) return 'text-emerald-400';
  if (progress >= 50) return 'text-amber-400';
  return 'text-red-400';
}

export function getProgressBgColor(progress: number): string {
  if (progress >= 80) return 'bg-emerald-500';
  if (progress >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

// ─── Status helpers ───────────────────────────────────────────
export const STATUS_COLORS = {
  draft: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
  submitted: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  locked: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  open: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  resolved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
} as const;

// ─── Truncate text ────────────────────────────────────────────
export function truncate(str: string, len: number): string {
  return str.length > len ? `${str.slice(0, len)}…` : str;
}

// ─── Generate initials ────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Number formatting ────────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
