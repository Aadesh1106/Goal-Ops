'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { createGoalSchema, type CreateGoalFormValues } from '@/lib/validations';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { THRUST_AREAS } from '@/lib/constants';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditGoalPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params.id as string;
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShared, setIsShared] = useState(false);
  const [goalStatus, setGoalStatus] = useState<string | null>(null);
  const [remainingWeight, setRemainingWeight] = useState<number>(100);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGoalFormValues>({ resolver: zodResolver(createGoalSchema) });

  const isLocked = goalStatus === 'approved' || goalStatus === 'locked';

  useEffect(() => {
    const fetchGoal = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('goals').select('*').eq('id', goalId).single();
      if (data) {
        setIsShared(data.title.startsWith('[Shared]'));
        setGoalStatus(data.status);
        reset({
          thrust_area: data.thrust_area,
          title: data.title,
          description: data.description,
          uom_type: data.uom_type,
          target_value: data.target_value,
          weightage: data.weightage,
        });

        // Fetch other goals to compute available weight space (excluding this one)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: existingGoals } = await supabase
            .from('goals')
            .select('id, weightage, status')
            .eq('employee_id', user.id);
          const otherTotal = existingGoals
            ?.filter(g => g.id !== goalId && g.status !== 'rejected')
            ?.reduce((s, g) => s + g.weightage, 0) ?? 0;
          setRemainingWeight(Math.max(0, 100 - otherTotal));
        }
      }
      setLoading(false);
    };
    fetchGoal();
  }, [goalId, reset]);

  const onSubmit = async (values: CreateGoalFormValues) => {
    if (isLocked) {
      setServerError('This goal has already been approved and locked. Standard modifications are restricted.');
      return;
    }
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

    const updatePayload = isShared 
      ? { weightage: values.weightage }
      : {
          thrust_area: values.thrust_area,
          title: values.title,
          description: values.description,
          uom_type: values.uom_type,
          target_value: values.target_value,
          weightage: values.weightage,
          status: 'draft', // Revert to draft status for resubmission and approval
        };

    const { error } = await supabase.from('goals').update(updatePayload).eq('id', goalId);

    if (error) { setServerError(error.message); return; }
    router.push('/dashboard/employee/goals');
    router.refresh();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="spinner" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Edit Goal"
        subtitle={isLocked ? "This goal is approved and locked. Standard modification is restricted without Admin intervention." : isShared ? "Departmental KPI: Only the weightage can be updated. Title and targets are locked." : "Update your goal details. Only draft and rejected goals can be edited."}
        action={
          <Link href="/dashboard/employee/goals"
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

          {isLocked && (
            <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: 'rgba(239,68,68,0.03)', borderColor: 'rgba(239,68,68,0.15)' }}>
              <span className="text-red-400 shrink-0 mt-0.5">⚠️</span>
              <div>
                <h4 className="font-bold text-white text-sm">Goal Sheet Locked</h4>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  This goal has already been approved and locked. Standard modification is restricted. Please contact your administrator or HR skip-level if revisions are necessary.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="edit-thrust" style={(isShared || isLocked) ? { opacity: 0.7 } : undefined}>Thrust Area</label>
            <select id="edit-thrust" className="form-input" disabled={isShared || isLocked} style={(isShared || isLocked) ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : undefined} {...register('thrust_area')}>
              <option value="">Select thrust area…</option>
              {THRUST_AREAS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.thrust_area && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.thrust_area.message}</p>}
          </div>

          <div>
            <label className="form-label" htmlFor="edit-title" style={(isShared || isLocked) ? { opacity: 0.7 } : undefined}>Goal Title</label>
            <input id="edit-title" className="form-input" readOnly={isShared || isLocked} style={(isShared || isLocked) ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : undefined} {...register('title')} />
            {errors.title && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.title.message}</p>}
          </div>

          <div>
            <label className="form-label" htmlFor="edit-desc" style={(isShared || isLocked) ? { opacity: 0.7 } : undefined}>Description</label>
            <textarea id="edit-desc" className="form-input" rows={3} readOnly={isShared || isLocked} style={(isShared || isLocked) ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : undefined} {...register('description')} />
            {errors.description && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="edit-uom" style={(isShared || isLocked) ? { opacity: 0.7 } : undefined}>Unit of Measurement</label>
              <select id="edit-uom" className="form-input" disabled={isShared || isLocked} style={(isShared || isLocked) ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : undefined} {...register('uom_type')}>
                <option value="numeric_min">Numeric Min (Higher is Better)</option>
                <option value="numeric_max">Numeric Max (Lower is Better)</option>
                <option value="timeline">Timeline (Days - Lower is Better)</option>
                <option value="zero_based">Zero-based (0 = Success)</option>
              </select>
              {errors.uom_type && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.uom_type.message}</p>}
            </div>
            <div>
              <label className="form-label" htmlFor="edit-target" style={(isShared || isLocked) ? { opacity: 0.7 } : undefined}>Target Value</label>
              <input id="edit-target" type="number" step="0.01" className="form-input" readOnly={isShared || isLocked} style={(isShared || isLocked) ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
                {...register('target_value', { valueAsNumber: true })} />
              {errors.target_value && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.target_value.message}</p>}
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="edit-weight" style={isLocked ? { opacity: 0.7 } : undefined}>
              Weightage (%) <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
                {remainingWeight < 10
                  ? `⛔ Deadlock state: Only ${remainingWeight}% remains. Edit other goals to free up space (min 10% per goal).`
                  : remainingWeight === 100
                  ? `10% – 100% available (no other goals yet)`
                  : `Available: 10% – ${remainingWeight}%. Leaving <10% unused is not allowed.`}
              </span>
            </label>
            <input 
              id="edit-weight" 
              type="number" 
              min={10} 
              max={100} 
              className="form-input" 
              readOnly={isLocked} 
              style={isLocked ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
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
            <button type="submit" disabled={isSubmitting || isLocked}
              className="btn-primary flex items-center gap-2 px-5 py-2.5"
              style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
              <Save size={14} />
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
            <Link href="/dashboard/employee/goals" className="btn-secondary px-5 py-2.5">Cancel</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
