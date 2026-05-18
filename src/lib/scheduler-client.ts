// ============================================================
// GoalOps Enterprise — Client-Safe Scheduler Utilities
// ============================================================
// This file contains ONLY pure, client-safe functions.
// No server-only imports (next/headers, supabase/server, etc.)
// Use this in 'use client' components instead of scheduler.ts
// ============================================================

export type TrackingWindow = 'goal_setting' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;

/**
 * Returns the active period name based on the calendar month.
 * Pure function — safe to use in client components.
 */
export function getCalendarWindow(date: Date = new Date()): TrackingWindow {
  const month = date.getMonth() + 1; // 1-indexed

  switch (month) {
    case 5:  return 'goal_setting'; // May
    case 7:  return 'Q1';          // July
    case 10: return 'Q2';          // October
    case 1:  return 'Q3';          // January
    case 3:
    case 4:  return 'Q4';          // March / April
    default: return null;
  }
}

/**
 * Returns a human-readable label for a given window.
 * Pure function — safe to use in client components.
 */
export function getWindowLabel(window: TrackingWindow): string {
  switch (window) {
    case 'goal_setting': return 'Goal Setting & Allocation (May)';
    case 'Q1':           return 'Q1 Check-in (July)';
    case 'Q2':           return 'Q2 Check-in (October)';
    case 'Q3':           return 'Q3 Check-in (January)';
    case 'Q4':           return 'Q4 Check-in (March/April)';
    default:             return 'No Active Window (Closed)';
  }
}
