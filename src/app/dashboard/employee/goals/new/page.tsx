'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { createGoalSchema, type CreateGoalFormValues } from '@/lib/validations';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { THRUST_AREAS } from '@/lib/constants';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

import { useEffect } from 'react';

export default function NewGoalPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [remainingWeight, setRemainingWeight] = useState<number>(100);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGoalFormValues>({ resolver: zodResolver(createGoalSchema) });

  useEffect(() => {
    const fetchRemaining = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existingGoals } = await supabase
          .from('goals')
          .select('weightage, status')
          .eq('employee_id', user.id);
        const currentTotal = existingGoals
          ?.filter((g) => g.status !== 'rejected')
          ?.reduce((s, g) => s + g.weightage, 0) ?? 0;
        setRemainingWeight(Math.max(0, 100 - currentTotal));
      }
    };
    fetchRemaining();
  }, []);

  const onSubmit = async (values: CreateGoalFormValues) => {
    setServerError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const S = remainingWeight;
    const W = values.weightage;

    if (W < 10) {
      setServerError("Each goal must have at least 10% weightage.");
      return;
    }

    if (W > S) {
      setServerError(`You only have ${S}% remaining available.`);
      return;
    }

    const remainder = S - W;
    if (remainder > 0 && remainder < 10) {
      setServerError(`Cannot assign ${W}% because remaining goals require minimum 10% allocation.`);
      return;
    }

    const { error } = await supabase.from('goals').insert({
      employee_id: user.id,
      thrust_area: values.thrust_area,
      title: values.title,
      description: values.description,
      uom_type: values.uom_type,
      target_value: values.target_value,
      weightage: values.weightage,
      cycle_year: new Date().getFullYear(),
    });

    if (error) { setServerError(error.message); return; }
    router.push('/dashboard/employee/goals');
    router.refresh();
  };

  return (
    <div>
      <PageHeader
        title="Add New Goal"
        subtitle="Define a goal for this performance cycle. Weightage must be 10–100%."
        action={
          <Link href="/dashboard/employee/goals"
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

          {/* Thrust Area */}
          <div>
            <label className="form-label" htmlFor="thrust_area">Thrust Area</label>
            <select id="thrust_area" className="form-input" {...register('thrust_area')}>
              <option value="">Select thrust area…</option>
              {THRUST_AREAS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.thrust_area && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.thrust_area.message}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="form-label" htmlFor="goal-title">Goal Title</label>
            <input id="goal-title" className="form-input" placeholder="e.g. Increase API throughput by 40%" {...register('title')} />
            {errors.title && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="form-label" htmlFor="goal-desc">Description</label>
            <textarea id="goal-desc" className="form-input" rows={3}
              placeholder="Describe what success looks like for this goal…"
              {...register('description')} />
            {errors.description && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.description.message}</p>}
          </div>

          {/* UOM + Target */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="uom_type">Unit of Measurement</label>
              <select id="uom_type" className="form-input" {...register('uom_type')}>
                <option value="">Select…</option>
                <option value="numeric_min">Numeric Min (Higher is Better)</option>
                <option value="numeric_max">Numeric Max (Lower is Better)</option>
                <option value="timeline">Timeline (Days - Lower is Better)</option>
                <option value="zero_based">Zero-based (0 = Success)</option>
              </select>
              {errors.uom_type && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.uom_type.message}</p>}
            </div>
            <div>
              <label className="form-label" htmlFor="target_value">Target Value</label>
              <input id="target_value" type="number" step="0.01" className="form-input"
                placeholder="e.g. 40" {...register('target_value', { valueAsNumber: true })} />
              {errors.target_value && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.target_value.message}</p>}
            </div>
          </div>

          {/* Weightage */}
          <div>
            <label className="form-label" htmlFor="weightage">
              Weightage (%)
              <span className="ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
                {remainingWeight === 10
                ? `Must be exactly 10% (completes your 100% total)`
                : `Valid range: 10% – ${remainingWeight - 10}% (or exactly ${remainingWeight}% to reach 100%)`}
              </span>
            </label>
            <input 
              id="weightage" 
              type="number" 
              min={10} 
              max={100} 
              className="form-input"
              placeholder={remainingWeight.toString()} 
              {...register('weightage', { valueAsNumber: true })} 
            />
            {errors.weightage && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.weightage.message}</p>}
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
              {isSubmitting ? 'Saving…' : 'Save Goal'}
            </button>
            <Link href="/dashboard/employee/goals" className="btn-secondary px-5 py-2.5">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
