import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Review Goal | GoalOps Enterprise' };

async function approveGoal(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const approvalId = formData.get('approvalId') as string;
  const goalId = formData.get('goalId') as string;
  const comment = formData.get('comment') as string;

  await supabase.from('approvals').update({
    status: 'approved', comment, acted_at: new Date().toISOString()
  }).eq('id', approvalId);

  await supabase.from('goals').update({
    status: 'approved', manager_comment: comment || null
  }).eq('id', goalId);

  revalidatePath('/dashboard/manager/approvals');
  redirect('/dashboard/manager/approvals');
}

async function rejectGoal(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const approvalId = formData.get('approvalId') as string;
  const goalId = formData.get('goalId') as string;
  const comment = formData.get('comment') as string;

  await supabase.from('approvals').update({
    status: 'rejected', comment, acted_at: new Date().toISOString()
  }).eq('id', approvalId);

  await supabase.from('goals').update({
    status: 'rejected', manager_comment: comment || null
  }).eq('id', goalId);

  revalidatePath('/dashboard/manager/approvals');
  redirect('/dashboard/manager/approvals');
}

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: approval } = await supabase
    .from('approvals')
    .select('*, goals(*), profiles!approvals_employee_id_fkey(full_name, department, designation, employee_code)')
    .eq('id', id)
    .eq('manager_id', user.id)
    .single();

  if (!approval) redirect('/dashboard/manager/approvals');

  const goal = approval.goals as any;
  const employee = approval.profiles as any;

  return (
    <div>
      <PageHeader
        title="Review Goal Submission"
        subtitle="Approve or reject this goal with optional feedback"
        action={
          <Link href="/dashboard/manager/approvals"
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <div className="max-w-2xl flex flex-col gap-4">
        {/* Employee info */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'var(--brand-gradient)' }}>
              {employee?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{employee?.full_name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {employee?.designation} · {employee?.department} · {employee?.employee_code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              {goal?.thrust_area}
            </span>
            <Badge variant="submitted" dot>submitted</Badge>
          </div>

          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{goal?.title}</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{goal?.description}</p>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{goal?.target_value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{goal?.uom_type}</div>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{goal?.weightage}%</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>weightage</div>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{goal?.cycle_year}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>cycle year</div>
            </div>
          </div>
        </Card>

        {/* Already acted */}
        {approval.status !== 'pending' ? (
          <Card className="p-4 text-center">
            <Badge variant={approval.status as any}>{approval.status}</Badge>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              This goal has already been {approval.status}.
            </p>
            {approval.comment && (
              <p className="text-sm mt-2 italic" style={{ color: 'var(--text-secondary)' }}>
                "{approval.comment}"
              </p>
            )}
          </Card>
        ) : (
          <Card className="p-4">
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              Manager Feedback <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </p>

            {/* Approve form */}
            <form action={approveGoal} className="flex flex-col gap-3 mb-3">
              <input type="hidden" name="approvalId" value={approval.id} />
              <input type="hidden" name="goalId" value={goal?.id} />
              <textarea
                name="comment"
                className="form-input"
                rows={3}
                placeholder="Add feedback for the employee (optional)…"
              />
              <div className="flex gap-3">
                <button type="submit"
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 flex-1 justify-center"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <CheckCircle size={15} /> Approve Goal
                </button>
              </div>
            </form>

            {/* Reject form */}
            <form action={rejectGoal}>
              <input type="hidden" name="approvalId" value={approval.id} />
              <input type="hidden" name="goalId" value={goal?.id} />
              <input type="hidden" name="comment" value="" />
              <button type="submit"
                className="w-full flex items-center gap-2 px-5 py-2.5 justify-center rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                <XCircle size={15} /> Reject Goal
              </button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
