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
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewCheckinPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    
    router.push('/dashboard/employee/checkins');
    router.refresh();
  };

  if (loading) return <div className="p-24 flex justify-center"><div className="spinner" /></div>;

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
