import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader, KpiCard } from '@/components/layout/DashboardShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Target, CheckSquare, AlertTriangle, Activity } from 'lucide-react';
import { DepartmentPerformanceChart } from '@/components/ui/Charts';

export const metadata = { title: 'Admin Dashboard' };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Platform-wide metrics
  const [
    { count: totalUsers },
    { count: totalGoals },
    { count: pendingApprovals },
    { count: openEscalations },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('goals').select('*', { count: 'exact', head: true }),
    supabase.from('goals').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('escalations').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  // Recent audit logs
  const { data: recentLogs } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(6);

  // Calculate department metrics
  const { data: profiles } = await supabase.from('profiles').select('id, department');
  const { data: goals } = await supabase.from('goals').select('id, status, employee_id');

  const deptData = Array.from(new Set(profiles?.map(p => p.department) || [])).map(dept => {
    const empIds = profiles?.filter(p => p.department === dept).map(p => p.id) || [];
    const deptGoals = goals?.filter(g => empIds.includes(g.employee_id)) || [];
    const completed = deptGoals.filter(g => g.status === 'locked' || g.status === 'approved').length;
    const completion = deptGoals.length > 0 ? Math.round((completed / deptGoals.length) * 100) : 0;
    return { department: dept, completion };
  });

  return (
    <div>
      <PageHeader
        title="Admin Control Centre"
        subtitle="Platform-wide governance overview and operational intelligence"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Users" value={totalUsers ?? 0} icon={<Users size={16} style={{ color: '#818cf8' }} />} />
        <KpiCard label="Total Goals" value={totalGoals ?? 0} icon={<Target size={16} style={{ color: '#06b6d4' }} />} />
        <KpiCard label="Pending Approvals" value={pendingApprovals ?? 0} icon={<CheckSquare size={16} style={{ color: '#f59e0b' }} />} />
        <KpiCard label="Open Escalations" value={openEscalations ?? 0} icon={<AlertTriangle size={16} style={{ color: '#ef4444' }} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <a href="/dashboard/admin/audit" className="text-xs" style={{ color: '#818cf8' }}>View all →</a>
          </CardHeader>
          {recentLogs && recentLogs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <Activity size={11} style={{ color: '#818cf8' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {/* @ts-expect-error: joined profile */}
                      <span style={{ color: 'var(--text-primary)' }}>{log.profiles?.full_name ?? 'System'}</span>
                      {' '}{log.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No activity yet.</p>
          )}
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <div className="h-[250px] w-full">
            <DepartmentPerformanceChart data={deptData} />
          </div>
        </Card>
      </div>
    </div>
  );
}
