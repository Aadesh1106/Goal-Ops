import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Send, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Submit Goal | GoalOps Enterprise' };

async function submitGoal(goalId: string) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Verify total weightage does not exceed 100 before submitting
  const { data: allGoals } = await supabase
    .from('goals').select('weightage, id, status').eq('employee_id', user.id);
  const total = allGoals?.filter((g) => g.status !== 'rejected').reduce((s, g) => s + g.weightage, 0) ?? 0;
  if (total > 100) return;

  // Update the goal status to submitted
  const { error: updateErr } = await supabase
    .from('goals')
    .update({ status: 'submitted' })
    .eq('id', goalId)
    .eq('employee_id', user.id);

  if (updateErr) {
    console.error('Failed to submit goal:', updateErr);
    return;
  }

  // Find manager — first try profile.manager_id, then fallback to any manager
  const { data: profile } = await supabase
    .from('profiles').select('manager_id, department').eq('id', user.id).single();
  
  let managerId = profile?.manager_id;
  
  // Fallback: find any manager in system if not assigned
  if (!managerId) {
    const { data: anyManager } = await supabase
      .from('profiles').select('id').eq('role', 'manager').limit(1).single();
    managerId = anyManager?.id ?? null;
  }

  // Create approval record
  if (managerId) {
    await supabase.from('approvals').insert({
      goal_id: goalId,
      manager_id: managerId,
      employee_id: user.id,
    });
  }

  revalidatePath('/dashboard/employee/goals');
  redirect('/dashboard/employee/goals');
}

export default async function SubmitGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: goal } = await supabase.from('goals').select('*').eq('id', id).eq('employee_id', user.id).single();
  if (!goal || goal.status !== 'draft') redirect('/dashboard/employee/goals');

  const { data: allGoals } = await supabase.from('goals').select('weightage, status').eq('employee_id', user.id);
  const totalWeightage = allGoals?.filter((g) => g.status !== 'rejected').reduce((s, g) => s + g.weightage, 0) ?? 0;
  const canSubmit = totalWeightage <= 100;

  const handleSubmit = submitGoal.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Submit Goal for Approval"
        subtitle="Once submitted, your manager will review and approve or reject the goal."
        action={
          <Link href="/dashboard/employee/goals"
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <div className="max-w-xl flex flex-col gap-4">
        {/* Goal preview */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="draft" dot>draft</Badge>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              {goal.thrust_area}
            </span>
          </div>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{goal.title}</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{goal.description}</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{goal.target_value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{goal.uom_type}</div>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{goal.weightage}%</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>weightage</div>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="font-bold" style={{ color: totalWeightage <= 100 ? 'var(--status-success)' : 'var(--status-error)' }}>
                {totalWeightage}%
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>total weight</div>
            </div>
          </div>
        </Card>

        {!canSubmit && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div className="text-sm">
              Total weightage is <strong>{totalWeightage}%</strong> — cannot exceed 100% before submitting.
              Please adjust your goals first.
            </div>
          </div>
        )}

        {canSubmit && (
          <form action={handleSubmit}>
            <button type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              <Send size={15} /> Confirm Submission
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
