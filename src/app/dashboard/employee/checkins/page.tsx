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

  const canAddCheckin = (activeGoals?.length ?? 0) > 0;

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

      {!canAddCheckin && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-lg"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="text-sm">
            You don't have any approved goals yet. Only approved or locked goals can have check-ins.
          </div>
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
                  <span>Planned: {c.planned_value} {c.goals?.uom_type}</span>
                  <span>Actual: <strong>{c.actual_value}</strong> {c.goals?.uom_type}</span>
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
