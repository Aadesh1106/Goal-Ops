'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { createCheckinSchema, type CreateCheckinFormValues } from '@/lib/validations';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { QUARTERS } from '@/lib/constants';
import { ArrowLeft, Save, Lock } from 'lucide-react';
import Link from 'next/link';
import { triggerTeamsCheckinNotification } from './actions';
import { getCalendarWindow } from '@/lib/scheduler';

export default function NewCheckinPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [windowLoading, setWindowLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCheckinFormValues>({
    resolver: zodResolver(createCheckinSchema),
    defaultValues: {
      cycle_year: new Date().getFullYear(),
    }
  });

  const selectedGoalId = watch('goal_id');
  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  useEffect(() => {
    const fetchGoals = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ BUG-003 Fix: Fetch the active scheduler window (admin override or calendar)
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'window_override')
        .single();

      const overrideWindow = settingsData?.value?.active_window ?? null;
      const calWindow = overrideWindow || (getCalendarWindow() as string | null);
      setActiveWindow(calWindow);
      setWindowLoading(false);
      
      const { data } = await supabase
        .from('goals')
        .select('id, title, target_value, uom_type, status')
        .eq('employee_id', user.id)
        .in('status', ['approved', 'locked']);
        
      setGoals(data || []);
      setLoading(false);
    };
    fetchGoals();
  }, []);

  const onSubmit = async (values: CreateCheckinFormValues) => {
    setServerError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { error } = await supabase.from('quarterly_checkins').insert({
      employee_id: user.id,
      goal_id: values.goal_id,
      quarter: values.quarter,
      cycle_year: values.cycle_year,
      planned_value: values.planned_value,
      actual_value: values.actual_value,
      progress_status: values.progress_status,
      employee_remarks: values.employee_remarks || null,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    });

    if (error) {
      if (error.code === '23505') {
        setServerError('A check-in for this goal and quarter already exists.');
      } else {
        setServerError(error.message);
      }
      return;
    }

    // Trigger Teams notification
    await triggerTeamsCheckinNotification({
      goalId: values.goal_id,
      quarter: values.quarter,
      plannedValue: values.planned_value,
      actualValue: values.actual_value,
      progressStatus: values.progress_status
    });
    
    router.push('/dashboard/employee/checkins');
    router.refresh();
  };

  if (loading || windowLoading) return <div className="p-24 flex justify-center"><div className="spinner" /></div>;

  // ✅ BUG-003: Block check-ins outside of scheduled windows
  const isCheckinWindow = activeWindow && ['Q1', 'Q2', 'Q3', 'Q4'].includes(activeWindow);
  if (!isCheckinWindow) {
    const WINDOW_LABELS: Record<string, string> = {
      goal_setting: 'Goal Setting & Allocation (May)',
      Q1: 'Q1 Check-in (July)',
      Q2: 'Q2 Check-in (October)',
      Q3: 'Q3 Check-in (January)',
      Q4: 'Q4 Check-in (March/April)',
    };
    return (
      <div>
        <PageHeader
          title="Log Quarterly Check-in"
          subtitle="Check-in window status"
          action={
            <Link href="/dashboard/employee/checkins"
              className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
              <ArrowLeft size={14} /> Back
            </Link>
          }
        />
        <Card className="max-w-2xl">
          <div className="flex flex-col items-center py-10 text-center gap-4">
            <Lock size={32} style={{ color: 'var(--text-muted)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Check-in Window Closed</h3>
            <p className="text-sm max-w-md" style={{ color: 'var(--text-muted)' }}>
              Quarterly check-ins are only available during the scheduled windows:
              <br />
              <strong style={{ color: 'var(--text-secondary)' }}>Q1:</strong> July &nbsp;
              <strong style={{ color: 'var(--text-secondary)' }}>Q2:</strong> October &nbsp;
              <strong style={{ color: 'var(--text-secondary)' }}>Q3:</strong> January &nbsp;
              <strong style={{ color: 'var(--text-secondary)' }}>Q4:</strong> March/April
            </p>
            {activeWindow && (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                Current period: <strong style={{ color: 'var(--text-secondary)' }}>{WINDOW_LABELS[activeWindow] ?? activeWindow}</strong>
              </div>
            )}
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Contact your Admin to override the window if needed.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Log Quarterly Check-in"
        subtitle="Update progress on your approved goals"
        action={
          <Link href="/dashboard/employee/checkins"
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <Card className="max-w-2xl">
        {goals.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              You don't have any approved goals yet. Only approved goals can have check-ins.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            
            <div>
              <label className="form-label" htmlFor="goal_id">Select Goal</label>
              <select id="goal_id" className="form-input" {...register('goal_id')}>
                <option value="">Select a goal…</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
              {errors.goal_id && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.goal_id.message}</p>}
            </div>

            {selectedGoal && (
              <div className="text-xs p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                Target: <strong>{selectedGoal.target_value} {selectedGoal.uom_type}</strong>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="quarter">Quarter</label>
                <select id="quarter" className="form-input" {...register('quarter')}>
                  <option value="">Select quarter…</option>
                  {QUARTERS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
                {errors.quarter && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.quarter.message}</p>}
              </div>
              <div>
                <label className="form-label" htmlFor="cycle_year">Cycle Year</label>
                <input id="cycle_year" type="number" className="form-input" readOnly
                  {...register('cycle_year', { valueAsNumber: true })} />
                {errors.cycle_year && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.cycle_year.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="planned_value">Planned Value (Up to this quarter)</label>
                <input id="planned_value" type="number" step="0.01" className="form-input"
                  {...register('planned_value', { valueAsNumber: true })} />
                {errors.planned_value && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.planned_value.message}</p>}
              </div>
              <div>
                <label className="form-label" htmlFor="actual_value">Actual Achieved Value</label>
                <input id="actual_value" type="number" step="0.01" className="form-input"
                  {...register('actual_value', { valueAsNumber: true })} />
                {errors.actual_value && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.actual_value.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="progress_status">Current Progress Status</label>
                <select id="progress_status" className="form-input" {...register('progress_status')}>
                  <option value="">Select status…</option>
                  <option value="Not Started">Not Started</option>
                  <option value="On Track">On Track</option>
                  <option value="Completed">Completed</option>
                </select>
                {errors.progress_status && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.progress_status.message}</p>}
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="employee_remarks">Remarks / Justification</label>
              <textarea id="employee_remarks" className="form-input" rows={3}
                placeholder="Explain the progress, blockers, or achievements…"
                {...register('employee_remarks')} />
              {errors.employee_remarks && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.employee_remarks.message}</p>}
            </div>

            {serverError && (
              <div className="text-xs px-3 py-2.5 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {serverError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting}
                className="btn-primary flex items-center gap-2 px-5 py-2.5">
                <Save size={14} />
                {isSubmitting ? 'Submitting…' : 'Submit Check-in'}
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
