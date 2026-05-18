// ============================================================
// GoalOps Enterprise — Check-in Scheduler & Calendar Engine
// ============================================================
// Note: server Supabase client is imported dynamically inside getActiveWindow()

export type TrackingWindow = 'goal_setting' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;

export interface WindowStatus {
  activeWindow: TrackingWindow;
  isOverride: boolean;
  allowedMonths: string;
}

/**
 * Returns the active period name based on the calendar month
 */
export function getCalendarWindow(date: Date = new Date()): TrackingWindow {
  const month = date.getMonth() + 1; // 1-indexed

  switch (month) {
    case 5: // May
      return 'goal_setting';
    case 7: // July
      return 'Q1';
    case 10: // October
      return 'Q2';
    case 1: // January
      return 'Q3';
    case 3: // March
    case 4: // April
      return 'Q4';
    default:
      return null;
  }
}

/**
 * Gets the readable window description
 */
export function getWindowDescription(window: TrackingWindow): string {
  switch (window) {
    case 'goal_setting': return 'Goal Setting & Allocation (May)';
    case 'Q1': return 'Quarter 1 Check-in (July)';
    case 'Q2': return 'Quarter 2 Check-in (October)';
    case 'Q3': return 'Quarter 3 Check-in (January)';
    case 'Q4': return 'Quarter 4 Check-in (March/April)';
    default: return 'No Active Window (Closed)';
  }
}

/**
 * Retrieves the currently active window, factoring in admin overrides
 */
export async function getActiveWindow(): Promise<WindowStatus> {
  // 1. Check database settings for an admin override
  // Note: We use the server-compatible Supabase client dynamically or a fallback
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
