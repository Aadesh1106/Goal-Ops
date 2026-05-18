'use server';

import { createClient } from '@/lib/supabase/server';
import { notifyCheckinLogged } from '@/lib/teams';

export async function triggerTeamsCheckinNotification(params: {
  goalId: string;
  quarter: string;
  plannedValue: number;
  actualValue: number;
  progressStatus: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Fetch employee full name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Fetch goal title
    const { data: goal } = await supabase
      .from('goals')
      .select('title')
      .eq('id', params.goalId)
      .single();

    // Fetch the updated checkin to get computed progress score
    const { data: checkin } = await supabase
      .from('quarterly_checkins')
      .select('progress_percentage')
      .eq('employee_id', user.id)
      .eq('goal_id', params.goalId)
      .eq('quarter', params.quarter)
      .single();

    if (profile && goal) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await notifyCheckinLogged({
        employeeName: profile.full_name || 'Employee',
        goalTitle: goal.title || 'Performance Goal',
        quarter: params.quarter,
        plannedValue: params.plannedValue,
        actualValue: params.actualValue,
        progressPercentage: checkin?.progress_percentage ?? 0,
        progressStatus: params.progressStatus,
        viewLink: `${appUrl}/dashboard/manager/checkins`
      });
      return { success: true };
    }
  } catch (err: any) {
    console.error('Failed to trigger Teams checkin notification:', err);
    return { success: false, error: err.message };
  }
  return { success: false, error: 'Profile or Goal not found' };
}
