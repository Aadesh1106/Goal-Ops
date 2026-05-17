import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PageHeader, KpiCard } from '@/components/layout/DashboardShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Target, CheckSquare, AlertTriangle, Activity, Lock, Unlock, Download } from 'lucide-react';
import { DepartmentPerformanceChart } from '@/components/ui/Charts';

export const metadata = { title: 'Admin Dashboard' };

async function unlockGoal(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const goalId = formData.get('goalId') as string;
  
  await supabase.from('goals').update({ status: 'draft' }).eq('id', goalId);
  
  // Log audit trail
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      entity_type: 'goal',
      entity_id: goalId,
      action: 'goal_reopened',
      metadata: { unlocked_by_admin: true }
    });
  }

  revalidatePath('/dashboard/admin');
}

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

  const { data: lockedGoals } = await supabase
    .from('goals')
    .select('id, title, status, profiles!goals_employee_id_fkey(full_name, employee_code)')
    .in('status', ['approved', 'locked'])
    .limit(5);

  return (
    <div>
      <PageHeader
        title="Admin Control Centre"
        subtitle="Platform-wide governance overview and operational intelligence"
        action={
          <a href="/api/export" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Download size={15} /> Export Achievement Report (CSV)
          </a>
        }
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

      <Card className="flex flex-col mt-6">
        <CardHeader>
          <CardTitle>Goal Governance Controls (Lock Bypass & Exception Management)</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-4">
          {lockedGoals && lockedGoals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)' }} className="text-xs">
                    <th className="pb-2">Employee</th>
                    <th className="pb-2">Goal Title</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lockedGoals.map((g: any) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="text-xs">
                      <td className="py-2.5 font-medium">
                        {g.profiles?.full_name} <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>{g.profiles?.employee_code}</span>
                      </td>
                      <td className="py-2.5 max-w-[300px] truncate">{g.title}</td>
                      <td className="py-2.5">
                        <Badge variant={g.status === 'locked' ? 'approved' : 'draft'} dot>{g.status}</Badge>
                      </td>
                      <td className="py-2.5 text-right">
                        <form action={unlockGoal}>
                          <input type="hidden" name="goalId" value={g.id} />
                          <button type="submit" className="px-2.5 py-1.5 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <Unlock size={12} /> Unlock & Reopen
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No locked or approved goals on the platform right now.</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Microsoft Entra ID (Azure AD) Sync
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 text-xs">
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>SSO Status</span>
                <Badge variant="approved">ACTIVE</Badge>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Single Sign-On is currently enabled platform-wide. Org structure and reporting lines sync automatically with Entra Active Directory attributes.</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Hierarchy Mapping</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Active</span>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Reporting structure and hierarchy are auto-derived from AD attributes (Admin → Manager → Employee).</p>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block" />
              Microsoft Teams & Notifications
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 text-xs">
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Adaptive Cards Bot</span>
                <Badge variant="approved">CONNECTED</Badge>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Automated webhook channels successfully trigger adaptive cards in MS Teams when goals are submitted, approved, or check-ins are logged.</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Deep Link Support</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Active</span>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Teams push notifications redirect directly back into GoalOps dashboard review scopes.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
