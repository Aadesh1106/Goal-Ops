// ============================================================
// GoalOps Enterprise — Check-in Scheduler & Calendar Engine
// ============================================================
// Server-only module. Use scheduler-client.ts in 'use client' components.
// ============================================================

// Import locally for use in this file, and re-export for consumers
import { getCalendarWindow, getWindowLabel, type TrackingWindow } from '@/lib/scheduler-client';

// Re-export everything from the client-safe module
export type { TrackingWindow } from '@/lib/scheduler-client';
export { getCalendarWindow, getWindowLabel as getWindowDescription } from '@/lib/scheduler-client';

export interface WindowStatus {
  activeWindow: TrackingWindow;
  isOverride: boolean;
  allowedMonths: string;
}

/**
 * Retrieves the currently active window, factoring in admin overrides.
 * SERVER-ONLY — dynamically imports the Supabase server client.
 */
export async function getActiveWindow(): Promise<WindowStatus> {
  // 1. Check database settings for an admin override
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'window_override')
      .single();

    if (data && data.value && data.value.active_window !== undefined) {
      const activeOverride = data.value.active_window as TrackingWindow;
      if (activeOverride) {
        return {
          activeWindow: activeOverride,
          isOverride: true,
          allowedMonths: 'Admin Override'
        };
      }
    }
  } catch (err) {
    console.warn('[Scheduler] Database config query bypassed, falling back to calendar: ', err);
  }

  // 2. Fall back to the automatic date-based calendar window
  const calWindow = getCalendarWindow();
  let months = 'Closed';
  if (calWindow === 'goal_setting') months = 'May';
  else if (calWindow === 'Q1') months = 'July';
  else if (calWindow === 'Q2') months = 'October';
  else if (calWindow === 'Q3') months = 'January';
  else if (calWindow === 'Q4') months = 'March / April';

  return {
    activeWindow: calWindow,
    isOverride: false,
    allowedMonths: months
  };
}
