import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Review Check-in | GoalOps Enterprise' };

async function reviewCheckin(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const checkinId = formData.get('checkinId') as string;
  const remarks = formData.get('remarks') as string;

  await supabase.from('quarterly_checkins').update({
    status: 'reviewed',
    manager_remarks: remarks || null,
    reviewed_at: new Date().toISOString()
  }).eq('id', checkinId);

  revalidatePath('/dashboard/manager/checkins');
  redirect('/dashboard/manager/checkins');
}

export default async function CheckinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: checkin } = await supabase
    .from('quarterly_checkins')
    .select('*, goals(*), profiles!quarterly_checkins_employee_id_fkey(full_name, department, designation)')
    .eq('id', id)
    .single();

  if (!checkin) redirect('/dashboard/manager/checkins');

  const goal = checkin.goals as any;
  const employee = checkin.profiles as any;

  return (
    <div>
      <PageHeader
        title="Review Quarterly Check-in"
        subtitle={`Reviewing ${checkin.quarter} progress for ${employee?.full_name}`}
        action={
          <Link href="/dashboard/manager/checkins"
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <div className="max-w-2xl flex flex-col gap-4">
        {/* Progress Snapshot */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'var(--brand-gradient)' }}>
              {employee?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{employee?.full_name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{employee?.designation}</p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{goal?.title}</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Target: {goal?.target_value} {goal?.uom_type}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5 text-sm">
            <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{checkin.planned_value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Planned</div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{checkin.actual_value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Actual Achieved</div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="font-bold text-lg" style={{ color: checkin.progress_percentage >= 100 ? 'var(--status-success)' : 'var(--brand-accent)' }}>
                {checkin.progress_percentage}%
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Progress</div>
            </div>
          </div>

          <div className="progress-bar h-2 mb-5">
            <div className="progress-fill h-2" style={{ width: `${checkin.progress_percentage}%` }} />
          </div>

          {checkin.employee_remarks && (
            <div className="text-sm p-4 rounded-lg" style={{ background: 'var(--bg-elevated)', borderLeft: '3px solid var(--brand-primary)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Employee Remarks</p>
              <p style={{ color: 'var(--text-secondary)' }}>"{checkin.employee_remarks}"</p>
            </div>
          )}
        </Card>

        {checkin.status === 'reviewed' ? (
          <Card className="p-4 text-center">
            <Badge variant="approved">Reviewed</Badge>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>You have reviewed this check-in.</p>
            {checkin.manager_remarks && (
              <p className="text-sm mt-2 italic" style={{ color: 'var(--text-secondary)' }}>
                "{checkin.manager_remarks}"
              </p>
            )}
          </Card>
        ) : (
          <Card className="p-4">
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              Add Review Feedback
            </p>
            <form action={reviewCheckin} className="flex flex-col gap-3">
              <input type="hidden" name="checkinId" value={checkin.id} />
              <textarea
                name="remarks"
                className="form-input"
                rows={3}
                placeholder="Acknowledge progress, offer guidance, or note blockers…"
              />
              <button type="submit"
                className="btn-primary flex items-center justify-center gap-2 py-2.5">
                <CheckCircle size={15} /> Submit Review
              </button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
