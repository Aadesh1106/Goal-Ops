import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, KpiCard } from '@/components/layout/DashboardShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Target, CheckSquare, TrendingUp, Clock } from 'lucide-react';
import { QuarterlyTrendChart } from '@/components/ui/Charts';

export const metadata = { 
  title: 'My Dashboard | GoalOps Enterprise',
  description: 'Track your goals, check-ins, and performance this cycle'
};

export default async function EmployeeDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Fetch goals summary
  const { data: goals } = await supabase
    .from('goals')
    .select('id, status, weightage')
    .eq('employee_id', user.id);

  const totalGoals = goals?.length ?? 0;
  const activeGoalCount = goals?.filter((g) => g.status !== 'rejected').length ?? 0;
  const approved = goals?.filter((g) => g.status === 'approved' || g.status === 'locked').length ?? 0;
  const submitted = goals?.filter((g) => g.status === 'submitted').length ?? 0;
  const totalWeightage = goals?.filter((g) => g.status !== 'rejected').reduce((s, g) => s + g.weightage, 0) ?? 0;

  // Fetch checkins for chart
  const { data: checkins } = await supabase
    .from('quarterly_checkins')
    .select('quarter, progress_percentage')
    .eq('employee_id', user.id);

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const trendData = quarters.map(q => {
    const qCheckins = checkins?.filter(c => c.quarter === q) || [];
    const avgProgress = qCheckins.length > 0 
      ? Math.round(qCheckins.reduce((s, c) => s + c.progress_percentage, 0) / qCheckins.length)
      : 0;
    return { quarter: q, progress: avgProgress };
  });

  return (
    <div>
      <PageHeader
        title="My Dashboard"
        subtitle="Track your goals, check-ins, and performance this cycle"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Goals" value={totalGoals} icon={<Target size={16} style={{ color: '#818cf8' }} />} />
        <KpiCard label="Approved" value={approved} icon={<CheckSquare size={16} style={{ color: '#10b981' }} />} />
        <KpiCard label="Pending Review" value={submitted} icon={<Clock size={16} style={{ color: '#f59e0b' }} />} />
        <KpiCard label="Total Weightage" value={`${totalWeightage}%`} icon={<TrendingUp size={16} style={{ color: '#06b6d4' }} />} />
      </div>

      {/* Quick view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Quarterly Progress Trend</CardTitle>
          </CardHeader>
          <div className="h-[250px] w-full">
            <QuarterlyTrendChart data={trendData} />
          </div>
        </Card>

        <Card className="transition-all duration-300" style={{
          borderColor: totalWeightage > 100 ? 'rgba(239, 68, 68, 0.35)' : totalWeightage === 100 ? 'rgba(16, 185, 129, 0.35)' : undefined,
          background: totalWeightage > 100 ? 'rgba(239, 68, 68, 0.05)' : totalWeightage === 100 ? 'rgba(16, 185, 129, 0.05)' : undefined,
          boxShadow: totalWeightage > 100 ? '0 0 15px rgba(239, 68, 68, 0.08)' : undefined
        }}>
          <CardHeader>
            <CardTitle>Weightage Summary</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Used</span>
              <span className="text-xl font-bold" style={{ color: totalWeightage > 100 ? 'var(--status-error)' : 'var(--text-primary)' }}>{totalWeightage}%</span>
            </div>
            <div className="progress-bar h-2" style={{ background: 'var(--bg-elevated)' }}>
              <div className="progress-fill h-2 transition-all duration-300" style={{
                width: `${Math.min(totalWeightage, 100)}%`,
                background: totalWeightage > 100 ? 'var(--status-error)' : totalWeightage === 100 ? 'var(--status-success)' : 'linear-gradient(90deg, #818cf8, #6366f1)'
              }} />
            </div>
            <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              <span>0%</span>
              <span className={
                totalWeightage === 100 
                  ? 'text-emerald-400' 
                  : totalWeightage > 100 
                  ? 'text-red-400 font-bold animate-pulse' 
                  : 'text-indigo-400'
              }>
                {totalWeightage === 100 
                  ? '✓ Perfect 100%' 
                  : totalWeightage > 100 
                  ? `⚠ Over limit by ${totalWeightage - 100}%` 
                  : `${100 - totalWeightage}% remaining`}
              </span>
              <span>100%</span>
            </div>
            {totalWeightage > 100 ? (
              <div className="mt-2 p-3 rounded-lg flex flex-col gap-2.5" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <p className="text-xs" style={{ color: '#fca5a5', lineHeight: '1.4' }}>
                  Your goals weightage total is currently out of compliance at <strong>{totalWeightage}%</strong>. Please reduce the weightage of your draft goals to exactly 100% to enable submissions.
                </p>
                <Link href="/dashboard/employee/goals" className="btn-primary py-2 text-xs text-center flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90" style={{ background: '#ef4444', border: 'none', color: '#fff' }}>
                  Rectify Goals Now
                </Link>
              </div>
            ) : totalWeightage === 100 ? (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                ✓ Your weightage is perfect! Go to <Link href="/dashboard/employee/goals" className="underline text-emerald-400 font-semibold">My Goals</Link> to submit your draft goals for review.
              </p>
            ) : (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                You can add up to <strong style={{ color: 'var(--text-secondary)' }}>8 goals</strong> ({8 - activeGoalCount} slots remaining).
                All goals must total exactly <strong style={{ color: 'var(--text-secondary)' }}>100%</strong> before submission.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
