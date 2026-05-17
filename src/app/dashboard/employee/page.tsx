import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader, KpiCard } from '@/components/layout/DashboardShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Target, CheckSquare, TrendingUp, Clock } from 'lucide-react';
import { QuarterlyTrendChart } from '@/components/ui/Charts';

export const metadata = { title: 'Employee Dashboard' };

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
  const approved = goals?.filter((g) => g.status === 'approved' || g.status === 'locked').length ?? 0;
  const submitted = goals?.filter((g) => g.status === 'submitted').length ?? 0;
  const totalWeightage = goals?.reduce((s, g) => s + g.weightage, 0) ?? 0;

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

        <Card>
          <CardHeader>
            <CardTitle>Weightage Summary</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Used</span>
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalWeightage}%</span>
            </div>
            <div className="progress-bar h-2">
              <div className="progress-fill h-2" style={{ width: `${totalWeightage}%` }} />
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>0%</span>
              <span className={totalWeightage === 100 ? 'text-emerald-400 font-medium' : ''}>
                {totalWeightage === 100 ? '✓ Perfect 100%' : `${100 - totalWeightage}% remaining`}
              </span>
              <span>100%</span>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              You can add up to <strong style={{ color: 'var(--text-secondary)' }}>8 goals</strong> ({8 - totalGoals} remaining).
              All goals must total exactly <strong style={{ color: 'var(--text-secondary)' }}>100%</strong> before submission.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
