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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGoalFormValues>({ resolver: zodResolver(createGoalSchema) });

  useEffect(() => {
    const fetchGoal = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('goals').select('*').eq('id', goalId).single();
      if (data) {
        setIsShared(data.title.startsWith('[Shared]'));
        reset({
          thrust_area: data.thrust_area,
          title: data.title,
          description: data.description,
          uom_type: data.uom_type,
          target_value: data.target_value,
          weightage: data.weightage,
        });
      }
      setLoading(false);
    };
    fetchGoal();
  }, [goalId, reset]);

  const onSubmit = async (values: CreateGoalFormValues) => {
    setServerError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    // Fetch existing goals to check total weightage, excluding the current goal
    const { data: existingGoals } = await supabase
      .from('goals')
      .select('id, weightage')
      .eq('employee_id', user.id);

    const otherGoalsTotal = existingGoals
      ?.filter(g => g.id !== goalId)
      ?.reduce((s, g) => s + g.weightage, 0) ?? 0;

    if (otherGoalsTotal + values.weightage > 100) {
      setServerError(`Cannot update goal. Changing this goal's weightage to ${values.weightage}% would make the total weightage ${otherGoalsTotal + values.weightage}%, which strictly exceeds the 100% limit. (Total weightage of other goals is ${otherGoalsTotal}%).`);
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
        subtitle={isShared ? "Departmental KPI: Only the weightage can be updated. Title and targets are locked." : "Update your goal details. Only draft and rejected goals can be edited."}
        action={
          <Link href="/dashboard/employee/goals"
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

          <div>
            <label className="form-label" htmlFor="edit-thrust" style={isShared ? { opacity: 0.7 } : undefined}>Thrust Area</label>
            <select id="edit-thrust" className="form-input" disabled={isShared} style={isShared ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : undefined} {...register('thrust_area')}>
              <option value="">Select thrust area…</option>
              {THRUST_AREAS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.thrust_area && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.thrust_area.message}</p>}
          </div>

          <div>
            <label className="form-label" htmlFor="edit-title" style={isShared ? { opacity: 0.7 } : undefined}>Goal Title</label>
            <input id="edit-title" className="form-input" readOnly={isShared} style={isShared ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : undefined} {...register('title')} />
            {errors.title && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.title.message}</p>}
          </div>

          <div>
            <label className="form-label" htmlFor="edit-desc" style={isShared ? { opacity: 0.7 } : undefined}>Description</label>
            <textarea id="edit-desc" className="form-input" rows={3} readOnly={isShared} style={isShared ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : undefined} {...register('description')} />
            {errors.description && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="edit-uom" style={isShared ? { opacity: 0.7 } : undefined}>Unit of Measurement</label>
              <select id="edit-uom" className="form-input" disabled={isShared} style={isShared ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : undefined} {...register('uom_type')}>
                 <option value="percentage">Percentage (%)</option>
                 <option value="number">Numeric</option>
                 <option value="currency">Timeline (Days)</option>
                 <option value="boolean">Zero-based (0 = Success)</option>
                 <option value="rating">Rating (1–5)</option>
               </select>
              {errors.uom_type && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.uom_type.message}</p>}
            </div>
            <div>
              <label className="form-label" htmlFor="edit-target" style={isShared ? { opacity: 0.7 } : undefined}>Target Value</label>
              <input id="edit-target" type="number" step="0.01" className="form-input" readOnly={isShared} style={isShared ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
                {...register('target_value', { valueAsNumber: true })} />
              {errors.target_value && <p className="mt-1 text-xs" style={{ color: 'var(--status-error)' }}>{errors.target_value.message}</p>}
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="edit-weight">Weightage (%) <span className="font-normal" style={{ color: 'var(--text-muted)' }}>10 – 50%</span></label>
            <input id="edit-weight" type="number" min={10} max={50} className="form-input"
              {...register('weightage', { valueAsNumber: true })} />
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
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
            <Link href="/dashboard/employee/goals" className="btn-secondary px-5 py-2.5">Cancel</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
