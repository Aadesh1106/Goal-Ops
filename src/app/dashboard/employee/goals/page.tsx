import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { WeightageBar } from '@/components/ui/ProgressBar';
import { Target, Plus, Edit2, Send, Trash2 } from 'lucide-react';
import type { Goal } from '@/types';

async function deleteGoal(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const goalId = formData.get('goalId') as string;
  await supabase.from('goals').delete().eq('id', goalId).eq('employee_id', user.id).eq('status', 'draft');
  revalidatePath('/dashboard/employee/goals');
}

export const metadata = { title: 'My Goals | GoalOps Enterprise' };

export default async function EmployeeGoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false });

  const totalWeightage = goals?.reduce((s, g) => s + g.weightage, 0) ?? 0;
  const canAddMore = (goals?.length ?? 0) < 8;
  const canSubmitAll = totalWeightage > 0 && (goals?.some(g => g.status === 'draft') ?? false);

  return (
    <div>
      <PageHeader
        title="My Goals"
        subtitle={`Cycle ${new Date().getFullYear()} · ${goals?.length ?? 0}/8 goals · ${totalWeightage}% weightage used`}
        action={
          canAddMore ? (
            <Link href="/dashboard/employee/goals/new"
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
              <Plus size={15} /> Add Goal
            </Link>
          ) : null
        }
      />

      {/* Weightage bar */}
      <div className="card mb-5 p-4 transition-all duration-300" style={{
        borderColor: totalWeightage > 100 ? 'rgba(239, 68, 68, 0.35)' : totalWeightage === 100 ? 'rgba(16, 185, 129, 0.35)' : undefined,
        background: totalWeightage > 100 ? 'rgba(239, 68, 68, 0.05)' : totalWeightage === 100 ? 'rgba(16, 185, 129, 0.05)' : undefined,
        boxShadow: totalWeightage > 100 ? '0 0 15px rgba(239, 68, 68, 0.08)' : undefined
      }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Total Weightage
          </span>
          <span className="text-sm font-bold" style={{
            color: totalWeightage === 100 ? 'var(--status-success)' : totalWeightage > 100 ? 'var(--status-error)' : 'var(--text-primary)'
          }}>
            {totalWeightage}% / 100%
          </span>
        </div>
        <WeightageBar used={totalWeightage} />
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          {totalWeightage === 100
            ? '✓ Perfect — you can now submit all draft goals for manager review.'
            : totalWeightage > 100
            ? `⚠ Over limit by ${totalWeightage - 100}% — reduce weightage before submitting.`
            : `${100 - totalWeightage}% remaining. Goals must total exactly 100% before submission.`}
        </p>
      </div>

      {/* Goals list */}
      {goals && goals.length > 0 ? (
        <div className="flex flex-col gap-3">
          {goals.map((goal: Goal) => (
            <Card key={goal.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      {goal.thrust_area}
                    </span>
                    <Badge variant={goal.status as 'draft' | 'submitted' | 'approved' | 'rejected' | 'locked'} dot>
                      {goal.status}
                    </Badge>
                    {goal.title.startsWith('[Shared]') && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                        Shared Goal
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                    {goal.title}
                  </h3>
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {goal.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>Target: <strong>{goal.target_value} {goal.uom_type}</strong></span>
                    <span>Weightage: <strong>{goal.weightage}%</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {(goal.status !== 'locked' || goal.title.startsWith('[Shared]')) && (
                    <Link href={`/dashboard/employee/goals/${goal.id}/edit`}
                      className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
                      <Edit2 size={12} /> Edit
                    </Link>
                  )}
                  {goal.status === 'draft' && totalWeightage > 0 && (
                    <Link href={`/dashboard/employee/goals/${goal.id}/submit`}
                      className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
                      <Send size={12} /> Submit
                    </Link>
                  )}
                  {goal.status === 'draft' && (
                    <form action={deleteGoal}>
                      <input type="hidden" name="goalId" value={goal.id} />
                      <button type="submit"
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg w-full transition-opacity hover:opacity-80"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {goal.manager_comment && (
                <div className="mt-3 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                  <strong>Manager feedback:</strong> {goal.manager_comment}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-16 flex flex-col items-center justify-center text-center">
          <Target size={40} style={{ color: 'var(--text-muted)' }} className="mb-4" />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No goals yet</h3>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Add up to 8 goals for this cycle. Total weightage must equal 100%.
          </p>
          <Link href="/dashboard/employee/goals/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> Add your first goal
          </Link>
        </Card>
      )}
    </div>
  );
}
