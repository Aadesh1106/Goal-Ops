import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader, KpiCard } from '@/components/layout/DashboardShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckSquare, Clock, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Manager Dashboard | GoalOps Enterprise' };

export default async function ManagerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Team members
  const { data: team } = await supabase
    .from('profiles')
    .select('id, full_name, department, designation')
    .eq('manager_id', user.id);

  const teamIds = team?.map(t => t.id) ?? [];

  // Pending approvals
  const { data: pendingApprovals } = await supabase
    .from('approvals')
    .select('*, goals(title, weightage, thrust_area, employee_id), profiles!approvals_employee_id_fkey(full_name)')
    .eq('manager_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  // Team goals summary
  const { data: teamGoals } = await supabase
    .from('goals')
    .select('status')
    .in('employee_id', teamIds.length > 0 ? teamIds : ['00000000-0000-0000-0000-000000000000']);

  const pending = pendingApprovals?.length ?? 0;
  const approved = teamGoals?.filter(g => g.status === 'approved' || g.status === 'locked').length ?? 0;
  const totalGoals = teamGoals?.length ?? 0;

  return (
    <div>
      <PageHeader title="Manager Dashboard" subtitle="Review team goals, approve submissions, and track progress" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pending Approvals" value={pending} icon={<Clock size={16} style={{ color: '#f59e0b' }} />} />
        <KpiCard label="Team Members" value={team?.length ?? 0} icon={<Users size={16} style={{ color: '#818cf8' }} />} />
        <KpiCard label="Goals Approved" value={approved} icon={<CheckSquare size={16} style={{ color: '#10b981' }} />} />
        <KpiCard label="Total Team Goals" value={totalGoals} icon={<TrendingUp size={16} style={{ color: '#06b6d4' }} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            {pending > 0 && (
              <Link href="/dashboard/manager/approvals"
                className="text-xs px-3 py-1 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: '#818cf8' }}>
                View all →
              </Link>
            )}
          </CardHeader>
          {pendingApprovals && pendingApprovals.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pendingApprovals.slice(0, 4).map((a: any) => (
                <Link key={a.id} href={`/dashboard/manager/approvals/${a.id}`}
                  className="flex items-center justify-between py-2 hover:opacity-80 transition-opacity"
                  style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {a.goals?.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {a.profiles?.full_name} · {a.goals?.thrust_area}
                    </p>
                  </div>
                  <Badge variant="pending" dot>pending</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No pending approvals 🎉
            </p>
          )}
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
          {team && team.length > 0 ? (
            <div className="flex flex-col gap-3">
              {team.map((member) => (
                <div key={member.id} className="flex items-center gap-3 py-2"
                  style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'var(--brand-gradient)' }}>
                    {member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{member.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.designation} · {member.department}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No team members assigned yet
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
