import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, KpiCard } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ClipboardList, Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { QUARTERS } from '@/lib/constants';

export const metadata = { title: 'Check-ins | GoalOps Enterprise' };

export default async function EmployeeCheckinsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: checkins } = await supabase
    .from('quarterly_checkins')
    .select('*, goals(title, target_value, uom_type, status)')
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false });

  // Get active goals for check-ins (only approved or locked)
  const { data: activeGoals } = await supabase
    .from('goals')
    .select('id')
    .eq('employee_id', user.id)
    .in('status', ['approved', 'locked']);

  // Query total goal count to dynamically determine setup states
  const { data: allGoals } = await supabase
    .from('goals')
    .select('status')
    .eq('employee_id', user.id);

  const canAddCheckin = (activeGoals?.length ?? 0) > 0;
  const hasGoals = (allGoals?.length ?? 0) > 0;
  const isPendingApproval = hasGoals && !canAddCheckin;

  return (
    <div>
      <PageHeader
        title="Quarterly Check-ins"
        subtitle="Track and submit your progress for each quarter"
        action={
          canAddCheckin ? (
            <Link href="/dashboard/employee/checkins/new"
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
              <Plus size={15} /> Log Check-in
            </Link>
          ) : null
        }
      />

      {/* Dynamic State Helpers */}
      {!hasGoals && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border"
          style={{ background: 'rgba(99,102,241,0.03)', borderColor: 'rgba(99,102,241,0.15)' }}>
          <div className="flex items-start gap-3">
            <ClipboardList size={20} className="shrink-0 mt-0.5" style={{ color: '#818cf8' }} />
            <div>
              <h4 className="font-bold text-white text-sm mb-0.5">Setup Your Performance Goals</h4>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                You haven't defined any performance goals for the current tracking cycle. To begin logging quarterly check-ins, please establish your goals first.
              </p>
            </div>
          </div>
          <Link href="/dashboard/employee/goals/new"
            className="btn-primary shrink-0 text-xs px-4 py-2 flex items-center gap-1.5 justify-center w-full sm:w-auto">
            <Plus size={14} /> Define My Goals
          </Link>
        </div>
      )}

      {isPendingApproval && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border animate-in fade-in duration-300"
          style={{ background: 'rgba(245,158,11,0.03)', borderColor: 'rgba(245,158,11,0.15)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0 mt-0.5 text-[#fbbf24]" />
            <div>
              <h4 className="font-bold text-white text-sm mb-0.5">Goals Pending Manager Approval</h4>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Your submitted performance goals are currently pending review. Once your reporting manager approves your goals, you will be authorized to log quarterly progress updates!
              </p>
            </div>
          </div>
          <Link href="/dashboard/employee/goals"
            className="shrink-0 text-xs px-4 py-2 rounded-lg font-semibold border text-center transition-all hover:bg-white/5 w-full sm:w-auto"
            style={{ borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}>
            Track Goal Status
          </Link>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <KpiCard label="Total Check-ins" value={checkins?.length ?? 0} icon={<ClipboardList size={16} style={{ color: '#8b5cf6' }} />} />
        <KpiCard label="Avg. Progress" value={`${checkins?.length ? Math.round(checkins.reduce((s: any, c: any) => s + c.progress_percentage, 0) / checkins.length) : 0}%`} icon={<TrendingUp size={16} style={{ color: '#10b981' }} />} />
      </div>

      {checkins && checkins.length > 0 ? (
        <div className="flex flex-col gap-4">
          {checkins.map((c: any) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg" style={{ color: 'var(--brand-accent)' }}>{c.quarter}</span>
                  <span className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    {c.cycle_year}
                  </span>
                  <Badge variant={c.status === 'reviewed' ? 'approved' : c.status === 'submitted' ? 'submitted' : 'draft'} dot>
                    {c.status}
                  </Badge>
                  <span className="text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider"
                    style={{
                      background: c.progress_status === 'Completed' ? 'rgba(16,185,129,0.1)' 
                        : c.progress_status === 'On Track' ? 'rgba(59,130,246,0.1)' 
                        : 'rgba(255,255,255,0.06)',
                      color: c.progress_status === 'Completed' ? '#34d399' 
                        : c.progress_status === 'On Track' ? '#60a5fa' 
                        : 'var(--text-muted)',
                      border: c.progress_status === 'Completed' ? '1px solid rgba(16,185,129,0.2)' 
                        : c.progress_status === 'On Track' ? '1px solid rgba(59,130,246,0.2)' 
                        : '1px solid rgba(255,255,255,0.1)'
                    }}>
                    {c.progress_status}
                  </span>
                </div>
                <div className="font-bold text-lg" style={{ color: c.progress_percentage >= 100 ? 'var(--status-success)' : 'var(--text-primary)' }}>
                  {c.progress_percentage}%
                </div>
              </div>

              <div className="mb-4">
                <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  {c.goals?.title}
                </p>
                <div className="progress-bar h-1.5 mb-1.5">
                  <div className="progress-fill h-1.5" style={{ width: `${c.progress_percentage}%` }} />
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>Planned: {c.planned_value} ({c.goals?.uom_type})</span>
                  <span>Actual: <strong>{c.actual_value}</strong> ({c.goals?.uom_type})</span>
                </div>
              </div>

              {c.employee_remarks && (
                <div className="text-xs p-3 rounded-lg mb-2" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  <strong>My Remarks:</strong> {c.employee_remarks}
                </div>
              )}

              {c.manager_remarks && (
                <div className="text-xs p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', color: '#34d399' }}>
                  <strong>Manager Feedback:</strong> {c.manager_remarks}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-16 flex flex-col items-center justify-center text-center">
          <ClipboardList size={40} style={{ color: 'var(--text-muted)' }} className="mb-4" />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No check-ins logged</h3>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Log your progress updates here every quarter.
          </p>
        </Card>
      )}
    </div>
  );
}
